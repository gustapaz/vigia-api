import { meta } from "./meta.mjs";
import { analyze, compare } from "./core.mjs";
const input = {
  type: "object",
  additionalProperties: false,
  required: ["end_minute", "buckets"],
  properties: {
    target_ppm: {
      type: "integer",
      minimum: 990000,
      maximum: 999999,
      default: 999000,
    },
    end_minute: { type: "integer", minimum: 1, maximum: 2000000000 },
    long_minutes: { type: "integer", minimum: 1, maximum: 120, default: 60 },
    short_minutes: { type: "integer", minimum: 1, maximum: 120, default: 5 },
    threshold: { type: "number", minimum: 1, maximum: 100, default: 14.4 },
    buckets: {
      type: "array",
      maxItems: 120,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["minute", "requests", "errors"],
        properties: {
          minute: { type: "integer" },
          requests: { type: "integer", minimum: 0, maximum: 1000000 },
          errors: { type: "integer", minimum: 0, maximum: 1000000 },
        },
      },
    },
  },
};
const window = {
  type: "object",
  required: [
    "minutes",
    "present",
    "coverage",
    "complete",
    "requests",
    "errors",
    "allowed_errors",
    "remaining_errors",
    "availability",
    "burn_rate",
    "has_traffic",
    "slo_met",
  ],
  properties: {
    ...Object.fromEntries(
      [
        "minutes",
        "present",
        "requests",
        "errors",
        "allowed_errors",
        "remaining_errors",
      ].map((k) => [k, { type: "integer" }]),
    ),
    coverage: { type: "number" },
    complete: { type: "boolean" },
    has_traffic: { type: "boolean" },
    slo_met: { type: "boolean", nullable: true },
    availability: { type: "number", nullable: true },
    burn_rate: { type: "number", nullable: true },
  },
};
const output = {
  type: "object",
  required: [
    "engine",
    "target_ppm",
    "threshold",
    "decision",
    "long_window",
    "short_window",
    "interval",
  ],
  properties: {
    engine: { type: "string" },
    target_ppm: { type: "integer" },
    threshold: { type: "number" },
    decision: { type: "string", enum: ["ok", "alert", "insufficient_data"] },
    long_window: window,
    short_window: window,
    interval: { type: "string" },
  },
};
export function createService() {
  return {
    meta,
    health: () => analyze(meta.examples[0].input).decision === "ok",
    actions: {
      [meta.primary]: {
        label: "Analisar SLO em duas janelas",
        description: meta.behavior,
        input,
        output,
        run: analyze,
      },
      [meta.secondary]: {
        label: "Comparar alvos 99%, 99,9% e 99,99%",
        description:
          "Valida o alvo recebido, mas calcula os três alvos fixos sobre os mesmos dados.",
        input,
        output: {
          type: "object",
          required: ["engine", "targets", "note"],
          properties: {
            engine: { type: "string" },
            targets: { type: "array", items: output },
            note: { type: "string" },
          },
        },
        run: compare,
      },
    },
  };
}
