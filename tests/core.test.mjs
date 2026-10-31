import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, compare } from "../server/core.mjs";
import { meta } from "../server/meta.mjs";
const healthy = meta.examples[0].input;
test("no burn alert does not imply SLO compliance", () => {
  const r = analyze({
    ...healthy,
    buckets: healthy.buckets.map((b) => ({ ...b, errors: 5 })),
  });
  assert.equal(r.decision, "ok");
  assert.equal(r.long_window.slo_met, false);
  assert.equal(analyze({ ...healthy, buckets: [] }).long_window.slo_met, null);
});
test("incident requires threshold in both windows", () => {
  const input = structuredClone(healthy);
  input.buckets[0].errors = 500;
  assert.equal(analyze(input).decision, "ok");
  input.buckets[4].errors = 500;
  assert.equal(analyze(input).decision, "alert");
});
test("missing data and no traffic never imply health", () => {
  assert.equal(
    analyze({ ...healthy, buckets: [] }).decision,
    "insufficient_data",
  );
  const r = analyze({
    ...healthy,
    buckets: healthy.buckets.map((b) => ({ ...b, requests: 0, errors: 0 })),
  });
  assert.equal(r.decision, "insufficient_data");
  assert.equal(r.long_window.availability, null);
  assert.equal(r.long_window.burn_rate, null);
});
test("zero error availability and exact remaining budget", () => {
  const r = analyze(healthy);
  assert.equal(r.long_window.availability, 1);
  assert.equal(r.long_window.allowed_errors, 5);
  assert.equal(r.long_window.remaining_errors, 5);
});
test("inclusive threshold boundary without display rounding", () => {
  const input = {
    ...healthy,
    target_ppm: 990000,
    threshold: 2,
    buckets: healthy.buckets.map((b) => ({ ...b, errors: 20 })),
  };
  assert.equal(analyze(input).decision, "alert");
  input.threshold = 2.0001;
  assert.equal(analyze(input).decision, "ok");
});
test("window endpoints and minute ordering", () => {
  const input = structuredClone(healthy);
  input.buckets.reverse();
  assert.deepEqual(analyze(input), analyze(healthy));
  assert.throws(
    () =>
      analyze({ ...healthy, buckets: [{ minute: 5, requests: 1, errors: 0 }] }),
    (e) => e.code === "invalid_minute",
  );
});
test("maximum supported counters do not overflow", () => {
  const input = {
    target_ppm: 990000,
    end_minute: 120,
    long_minutes: 120,
    short_minutes: 5,
    buckets: Array.from({ length: 120 }, (_, minute) => ({
      minute,
      requests: 1000000,
      errors: 1000000,
    })),
  };
  const r = analyze(input);
  assert.equal(r.long_window.requests, 120000000);
  assert.equal(r.long_window.allowed_errors, 1200000);
  assert.equal(r.long_window.remaining_errors, -118800000);
  assert.equal(r.decision, "alert");
});
test("200 generated windows agree with independent observed-counter oracle", () => {
  for (let i = 1; i <= 200; i++) {
    const buckets = Array.from({ length: 5 }, (_, minute) => ({
        minute,
        requests: 1000 + i,
        errors: (i * 7 + minute) % 100,
      })),
      r = analyze({ ...healthy, buckets }),
      requests = buckets.reduce((s, b) => s + b.requests, 0),
      errors = buckets.reduce((s, b) => s + b.errors, 0);
    assert.equal(r.long_window.requests, requests);
    assert.equal(r.long_window.errors, errors);
    assert.equal(r.long_window.allowed_errors, Math.floor(requests / 1000));
    assert.ok(
      Math.abs(r.long_window.burn_rate - (errors * 1000) / requests) < 1e-10,
    );
  }
});
test("comparison changes only target", () => {
  const r = compare(meta.examples[1].input);
  assert.deepEqual(
    r.targets.map((t) => t.target_ppm),
    [990000, 999000, 999900],
  );
  assert.ok(r.targets.every((t) => t.long_window.requests === 5000));
});
for (const input of [
  null,
  {},
  { ...healthy, target_ppm: 1000000 },
  { ...healthy, target_ppm: 989999 },
  { ...healthy, long_minutes: 121 },
  { ...healthy, short_minutes: 6 },
  { ...healthy, threshold: 0 },
  { ...healthy, end_minute: 1 },
  { ...healthy, buckets: [healthy.buckets[0], healthy.buckets[0]] },
  { ...healthy, buckets: [{ minute: 0, requests: 1, errors: 2 }] },
  { ...healthy, buckets: [{ minute: 0, requests: 1.2, errors: 0 }] },
  { ...healthy, extra: true },
])
  test("invalid " + JSON.stringify(input), () =>
    assert.throws(
      () => analyze(input),
      (e) => e.status === 422,
    ),
  );
