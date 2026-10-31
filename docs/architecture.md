# Arquitetura

engine/Domain.fs implementa agregação, orçamento, burn rate, cumprimento do SLO e decisão. O build roda verificações F# nativas e transpila o mesmo módulo com Fable para engine/pkg/Domain.js, ignorado no Git. server/core.mjs valida o DTO e converte nomes e valores sem tráfego para JSON; os cálculos permanecem em F#. Cada requisição é uma função da entrada, sem estado compartilhado.

Minutos são índices inteiros. Janelas usam [end_minute - minutos, end_minute), sem calendário ou fuso. Buckets devem ser únicos e estar na janela longa. Ausência não significa zero erros. availability é uma fração 0..1; sem tráfego, availability e burn_rate são null. allowed_errors é floor(requests * (1000000-target_ppm)/1000000). burn_rate usa a fração teórica do alvo, sem arredondamento de exibição. slo_met informa cumprimento do alvo e só é avaliado com cobertura completa e tráfego. decision=ok significa ausência do alerta multiwindow, não cumprimento obrigatório do SLO. O alerta exige cobertura/tráfego e burn_rate >= threshold nas duas janelas. Não coleta métricas nem envia notificações.

A camada HTTP valida media type, UTF-8 e tamanho do stream. server/service.mjs define contratos e operações; server/meta.mjs contém dados sintéticos. Os testes usam o motor real, sem mocks.

31 testes Node/HTTP, verificações F# nativas e 200 janelas comparadas com um oráculo de contadores. Cobrem cobertura ausente, tráfego zero, limite inclusivo de alerta, orçamento negativo e contadores máximos.
