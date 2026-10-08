# Rastreabilidade da extração

Esta versão deriva do pacote `agents/hearts-prospeccao` do projeto Hearts. O diretório original foi preservado. Nenhum histórico Git, export de workflow, ambiente, perfil interno, banco ou payload de operação foi copiado.

| Origem no pacote | Arquivo público | Adaptação |
|---|---|---|
| `src/contracts.ts` | `src/contracts.ts` | Conteúdo preservado; finais de linha normalizados |
| `src/normalize.ts` | `src/normalize.ts` | Conteúdo preservado; finais de linha normalizados |
| `src/extract.ts` | `src/extract.ts` | Conteúdo preservado; finais de linha normalizados |
| `src/journey.ts` | `src/journey.ts` | Conteúdo preservado; finais de linha normalizados |
| `src/providers.ts`, linhas 1–9 | `src/providers.ts` | Mantido somente `MockProvider` |
| `src/evolution.ts`, linhas 3–18 e 45–58 | `src/dispatch.ts` | Mantidos contratos, mock e orquestração genérica; HTTP e parser excluídos |
| `tests/extract.test.ts`, linhas 1–70 | `tests/extract.test.ts` | Import e testes de RapidAPI removidos; telefones sintéticos substituídos |
| `tests/journey.test.ts` | `tests/journey.test.ts` | Telefones sintéticos substituídos; assertions preservadas |
| `tests/evolution.test.ts`, linhas 1–2 e 32–44 | `tests/dispatch.test.ts` | Mantido teste de resultado incerto; import ajustado; telefone sintético substituído |
| `tsconfig.json` | `tsconfig.json` | Adicionada compilação de `examples/**/*.ts` |

README, STATUS, esta documentação, `.gitignore`, package/lock, RIGHTS e `examples/demo.ts` foram preparados para este recorte. A demo é nova e apenas exercita funções existentes com entradas artificiais. Não representa um fluxo produtivo extraído.

Os testes usam números de demonstração na faixa `202-555-01xx` e domínios `.example`/`.invalid`. Não há arquivos de configuração de cliente ou endpoints operacionais neste subset.

O empacotamento preserva a autoria do projeto e permite revisar decisões concretas do código. A exclusão dos adapters limita o que pode ser demonstrado aqui; a cópia não é apresentada como substituto implantável do sistema completo.
