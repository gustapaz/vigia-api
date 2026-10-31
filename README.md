# Vigia API

Analise disponibilidade, orçamento de erros e burn rate em múltiplas janelas. Motor F# real compilado com Fable e executado no servidor, sem monitoramento ou notificações externas.

**Stack: F# + Fable 4.29.**

[Demo](https://vigia-api-gustapaz.starrylinen.chatgpt.site) · [Swagger](https://vigia-api-gustapaz.starrylinen.chatgpt.site/docs.html) · [OpenAPI](https://vigia-api-gustapaz.starrylinen.chatgpt.site/api/openapi.json)

## Recursos

O alerta exige burn rate acima do limiar nas duas janelas, cobertura completa e tráfego observado. Minutos ausentes não são tratados como sucesso: a decisão passa a insufficient_data. O orçamento inteiro é arredondado para baixo; burn rate usa a fração do alvo. A decisão ok significa ausência deste alerta; slo_met informa separadamente se o alvo foi cumprido.

Exemplos sintéticos, processamento real no servidor. Não há serviços externos simulando os cálculos.

## Executar localmente

Node.js 24, npm e .NET SDK 8. O manifesto .config/dotnet-tools.json fixa Fable 4.29.0. DOTNET_BIN pode apontar para um SDK fora do PATH; o build ajusta o PATH somente de seus subprocessos.

```sh
npm ci
npm run build
npm start -- --port 5222
```

Abra http://127.0.0.1:5222 e /docs.html. Não exige conta cloud, banco, cartão ou segredo. O serviço não precisa guardar dados entre requisições; não há migração ou persistência prometida.

```sh
npm run build:engine
npm run check
npm run typecheck
npm test
npm run smoke -- http://127.0.0.1:5222
```

31 testes Node/HTTP, verificações F# nativas e 200 janelas comparadas com um oráculo de contadores. Cobrem cobertura ausente, tráfego zero, limite inclusivo de alerta, orçamento negativo e contadores máximos. A CI instala do lockfile, compila o motor e Worker, verifica formatação/tipos e executa testes. Os tipos TypeScript cobrem o adaptador e a interface; o núcleo é F# + Fable 4.29.

## API

```sh
curl https://vigia-api-gustapaz.starrylinen.chatgpt.site/api/health
curl -X POST https://vigia-api-gustapaz.starrylinen.chatgpt.site/api/v1/analyze -H 'Content-Type: application/json' --data-binary @examples/requests/example-1.json
curl -X POST https://vigia-api-gustapaz.starrylinen.chatgpt.site/api/v1/compare -H 'Content-Type: application/json' --data-binary @examples/requests/example-1.json
```

GET /api/v1/examples retorna três entradas executáveis. O health roda o motor antes de retornar engine_check:true. O contrato Swagger detalha payloads e respostas. Erros usam application/problem+json e request_id: JSON/UTF-8 inválido 400, Origin diferente 403, rota desconhecida 404, conflito de patch 409 quando aplicável, tamanho 413, mídia 415 e contrato 422.

## Semântica e limites

Minutos são índices inteiros. Janelas usam [end_minute - minutos, end_minute), sem calendário ou fuso. Buckets devem ser únicos e estar na janela longa. Ausência não significa zero erros. availability é uma fração 0..1; sem tráfego, availability e burn_rate são null. allowed_errors é floor(requests * (1000000-target_ppm)/1000000). burn_rate usa a fração teórica do alvo, sem arredondamento de exibição. slo_met informa cumprimento do alvo e só é avaliado com cobertura completa e tráfego. decision=ok significa ausência do alerta multiwindow, não cumprimento obrigatório do SLO. O alerta exige cobertura/tráfego e burn_rate >= threshold nas duas janelas. Não coleta métricas nem envia notificações.

Até 120 minutos, 1.000.000 de requisições por bucket, alvo de 990000 a 999999 ppm e 32 KiB por JSON. Minutos são índices inteiros, não horários de calendário. O serviço analisa dados enviados; não coleta métricas nem envia alertas.

## Arquitetura e hospedagem

[Arquitetura](docs/architecture.md) · [Segurança](docs/security.md)

engine/Domain.fs implementa agregação, orçamento, burn rate, cumprimento do SLO e decisão. O build roda verificações F# nativas e transpila o mesmo módulo com Fable para engine/pkg/Domain.js, ignorado no Git. server/core.mjs valida o DTO e converte nomes e valores sem tráfego para JSON; os cálculos permanecem em F#. Cada requisição é uma função da entrada, sem estado compartilhado.

Vinext/React é o adaptador Worker e o cliente técnico; as regras não executam no navegador. Inputs/resultados ficam no escopo da requisição e na memória da página.

Demo em Sites sem cartão, faturamento, trial ou plano pago ativado. GitHub hospeda código/CI; Pages não executa a API. Disponibilidade e cotas dependem da hospedagem, sem SLA ou promessa de gratuidade permanente. Não há rate limit global próprio; o trabalho por chamada é limitado. Use apenas dados sintéticos. Nenhuma variável secreta é obrigatória; veja .env.example.

## Licença

Código do projeto sob MIT. A licença MIT do Fable está em vendor/Fable-LICENSE. Swagger UI conserva LICENSE e NOTICE em public/swagger/. O tooling Sites/Vinext mantém seus avisos em vendor/ e scripts/vite/sites-vite-plugin.LICENSE.
