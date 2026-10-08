# Status do Hearts público

Data do recorte: 2026-10-08.

## Disponível nesta versão

- Núcleo TypeScript extraído de um projeto existente, com alterações de empacotamento e higienização descritas em [EXTRACTION.md](docs/EXTRACTION.md).
- Coleta com provider em memória e contrato de repositório injetável.
- Normalização de empresa, domínio e telefone; resumo de execução e replay informado pelo repositório.
- Avaliação de contato a partir de evidências fornecidas; hipótese de oferta; rascunho para revisão; classificação de resposta.
- Orquestração genérica de despacho com mock e tratamento de resultado incerto.
- Testes offline e demo com dados sintéticos.

## Limites que importam

| Tema | Situação |
|---|---|
| Persistência e deduplicação por conta | O original tem implementação PostgreSQL; aqui há somente contratos e fake de teste. Não há prova de concorrência ou isolamento de banco neste subset |
| Aprovação humana | O rascunho indica se o contato atende à regra de revisão. O store de aprovação durável não foi incluído; `readyForReview` não autoriza envio |
| Evidência de contato | É fornecida pelo chamador. Os testes usam evidência artificial; não comprovam titularidade de um número real |
| Oferta e resposta | Heurísticas determinísticas com limitações semânticas; confiança não calibrada; respostas fora dos padrões podem exigir revisão |
| Dispatch | Mock/fake somente. `accepted` é o retorno do sender, não entrega a um destinatário |
| CRM, scraping, mensageria e webhook | Adapters e configuração de produção excluídos |
| Métricas de negócio | Nenhum resultado de conversão, receita ou escala é alegado |

## Relação com o projeto original

O código de origem possui implementação local de aprovação, claim de despacho, inbound, opt-out por conta e handoff, além de adapters para providers externos e CRM. Eles foram inspecionados localmente para definir o recorte; não compõem a aplicação pública e não foram executados nesta preparação.

A documentação original registra ensaios locais anteriores, mas integração produtiva, grants/RLS do CRM, entrega real, webhook externo e reconciliação após falha entre sistemas permanecem gates de validação. Esses registros históricos não são apresentados como teste desta cópia.

## Verificação da cópia

Verificado em 2026-10-08 com Node.js 24.14.1 e npm 11.11.0:

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Passou, sem erros de TypeScript |
| `npm test` | 8 testes passaram; 0 falhas, 0 ignorados |
| `npm run demo` | Executou a demo sintética; contato provável/validado pela evidência, hipótese, draft e classificação produzidos |

Nenhum comando de banco ou provider faz parte dos scripts deste pacote. Esses resultados comprovam o recorte offline nas condições acima, não a operação externa do projeto original.
