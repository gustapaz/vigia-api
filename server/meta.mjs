const healthy = Array.from({ length: 5 }, (_, minute) => ({
  minute,
  requests: 1000,
  errors: 0,
}));
const base = {
  target_ppm: 999000,
  end_minute: 5,
  long_minutes: 5,
  short_minutes: 2,
  threshold: 14.4,
};
export const meta = {
  repo: "vigia-api",
  title: "Vigia API",
  engine: "fsharp-fable",
  accent: "#24615b",
  headline: "Um alerta precisa de dados suficientes.",
  description:
    "Analise disponibilidade, orçamento de erros e burn rate em múltiplas janelas. Motor F# real compilado com Fable e executado no servidor, sem monitoramento ou notificações externas.",
  behavior:
    "O alerta exige burn rate acima do limiar nas duas janelas, cobertura completa e tráfego observado. Minutos ausentes não são tratados como sucesso: a decisão passa a insufficient_data. O orçamento inteiro é arredondado para baixo; burn rate usa a fração do alvo. A decisão ok significa ausência deste alerta; slo_met informa separadamente se o alvo foi cumprido.",
  limits:
    "Até 120 minutos, 1.000.000 de requisições por bucket, alvo de 990000 a 999999 ppm e 32 KiB por JSON. Minutos são índices inteiros, não horários de calendário. O serviço analisa dados enviados; não coleta métricas nem envia alertas.",
  primary: "/api/v1/analyze",
  secondary: "/api/v1/compare",
  primaryLabel: "Analisar janelas →",
  secondaryLabel: "Comparar alvos SLO",
  examples: [
    {
      name: "Serviço saudável",
      input: { ...base, buckets: healthy },
      expected: {
        decision: "ok",
        "long_window.allowed_errors": 5,
        "long_window.coverage": 1,
      },
    },
    {
      name: "Incidente",
      input: {
        ...base,
        buckets: healthy.map((b) => ({
          ...b,
          errors: b.minute >= 3 ? 200 : 0,
        })),
      },
      expected: {
        decision: "alert",
        "long_window.errors": 400,
        "short_window.errors": 400,
      },
    },
    {
      name: "Minuto ausente",
      input: { ...base, buckets: healthy.slice(0, 4) },
      expected: { decision: "insufficient_data", "long_window.coverage": 0.8 },
    },
  ],
  secondaryExpected: {
    "targets.0.target_ppm": 990000,
    "targets.0.decision": "ok",
  },
};
