import { analyze as compute } from "../engine/pkg/Domain.js";
import { exact, invalid } from "./http.mjs";
export function validate(input) {
  exact(
    input,
    [
      "target_ppm",
      "end_minute",
      "long_minutes",
      "short_minutes",
      "threshold",
      "buckets",
    ],
    "requisição",
  );
  const target = input.target_ppm === undefined ? 999000 : input.target_ppm,
    long = input.long_minutes === undefined ? 60 : input.long_minutes,
    short = input.short_minutes === undefined ? 5 : input.short_minutes,
    threshold = input.threshold === undefined ? 14.4 : input.threshold,
    end = input.end_minute;
  if (!Number.isInteger(target) || target < 990000 || target > 999999)
    invalid("invalid_target", "target_ppm deve estar entre 990000 e 999999.");
  if (
    !Number.isInteger(long) ||
    long < 1 ||
    long > 120 ||
    !Number.isInteger(short) ||
    short < 1 ||
    short > long
  )
    invalid("invalid_window", "Janelas inteiras: 1 <= short <= long <= 120.");
  if (!Number.isInteger(end) || end < long || end > 2000000000)
    invalid(
      "invalid_end",
      "end_minute deve ser inteiro, pelo menos long_minutes.",
    );
  if (!Number.isFinite(threshold) || threshold < 1 || threshold > 100)
    invalid("invalid_threshold", "threshold deve estar entre 1 e 100.");
  if (!Array.isArray(input.buckets) || input.buckets.length > 120)
    invalid("invalid_buckets", "Envie até 120 buckets.");
  const seen = new Set();
  const buckets = input.buckets
    .map((b) => {
      exact(b, ["minute", "requests", "errors"], "bucket");
      if (
        !Number.isInteger(b.minute) ||
        b.minute < end - long ||
        b.minute >= end ||
        seen.has(b.minute)
      )
        invalid(
          "invalid_minute",
          "Minutos devem ser únicos e pertencer à janela longa [end-long,end).",
        );
      seen.add(b.minute);
      if (
        !Number.isInteger(b.requests) ||
        b.requests < 0 ||
        b.requests > 1000000 ||
        !Number.isInteger(b.errors) ||
        b.errors < 0 ||
        b.errors > b.requests
      )
        invalid(
          "invalid_counts",
          "Contadores inteiros: 0 <= errors <= requests <= 1000000.",
        );
      return { ...b };
    })
    .sort((a, b) => a.minute - b.minute);
  return { target, long, short, threshold, end, buckets };
}
const finite = (v) => (Number.isFinite(v) ? v : null);
function window(w) {
  return {
    minutes: w.minutes,
    present: w.present,
    coverage: w.coverage,
    complete: w.complete,
    requests: w.requests,
    errors: w.errors,
    allowed_errors: w.allowedErrors,
    remaining_errors: w.remainingErrors,
    availability: finite(w.availability),
    burn_rate: finite(w.burnRate),
    has_traffic: w.hasTraffic,
    slo_met: w.complete && w.hasTraffic ? w.withinTarget : null,
  };
}
export function analyze(input) {
  const v = validate(input),
    r = compute(v.target, v.end, v.long, v.short, v.threshold, v.buckets);
  return {
    engine: "fsharp-fable",
    target_ppm: r.targetPpm,
    threshold: r.threshold,
    decision: r.decision,
    long_window: window(r.longWindow),
    short_window: window(r.shortWindow),
    interval: "[end_minute - window_minutes, end_minute)",
  };
}
export function compare(input) {
  validate(input);
  return {
    engine: "fsharp-fable",
    targets: [990000, 999000, 999900].map((target_ppm) =>
      analyze({ ...input, target_ppm }),
    ),
    note: "Same observed data; selected target_ppm is validated before comparing the three fixed targets.",
  };
}
