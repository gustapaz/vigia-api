# Segurança e operação

Até 120 minutos, 1.000.000 de requisições por bucket, alvo de 990000 a 999999 ppm e 32 KiB por JSON. Minutos são índices inteiros, não horários de calendário. O serviço analisa dados enviados; não coleta métricas nem envia alertas.

O stream conta bytes efetivos, sem confiar em Content-Length. Corpos comprimidos, propriedades desconhecidas, tipos e quantidades fora do contrato são recusados. Não existe execução de código enviado pelo usuário.

Origin de navegador deve coincidir com o serviço. Clientes sem Origin são aceitos; isso não é autenticação. Não há contas, cookies, segredos de demonstração ou ações sobre dados persistidos. Respostas incluem no-store, nosniff, Referrer-Policy e request IDs. Erros não expõem stack traces ou payloads.

A aplicação não registra entradas; a infraestrutura pode registrar metadados. Use somente dados sintéticos. Sem rate limit global ou DDoS próprio. O processamento é limitado, mas a disponibilidade depende da plataforma. Nenhum cartão, faturamento, trial ou plano pago foi ativado.

engine/Domain.fs implementa agregação, orçamento, burn rate, cumprimento do SLO e decisão. O build roda verificações F# nativas e transpila o mesmo módulo com Fable para engine/pkg/Domain.js, ignorado no Git. server/core.mjs valida o DTO e converte nomes e valores sem tráfego para JSON; os cálculos permanecem em F#. Cada requisição é uma função da entrada, sem estado compartilhado.

Os testes comprovam comportamentos específicos, sem certificar ausência universal de vulnerabilidades.
