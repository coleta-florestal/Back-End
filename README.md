# Back-End

## Base das regras de status do inventário

Base da [tarefa #42](https://github.com/coleta-florestal/Front-End/issues/42), conforme os
casos de teste de início de talhão, encerramento de parcela e finalização da amostra.
Neste projeto, a "amostra" do backlog antigo corresponde ao talhão.

| Entidade | Modelo    | Estados                                                                            |
| -------- | --------- | ---------------------------------------------------------------------------------- |
| Talhão   | `Plot`    | `NOT_STARTED` (sem medição), `IN_PROGRESS` (em andamento), `FINISHED` (finalizado) |
| Parcela  | `SubPlot` | `NOT_STARTED` (não iniciada), `IN_PROGRESS` (em andamento), `CLOSED` (encerrada)   |

Novos registros começam em `NOT_STARTED`. A migração marca como `IN_PROGRESS` as
parcelas que já possuem árvores e seus respectivos talhões, sem inferir encerramentos
que não estavam registrados no banco.

### Regras e transições

O `InventoryStatusService`, exportado pelo `InventoryStatusModule`, fornece:

- `assertPlotCanBeChanged`: bloqueia alterações em um talhão finalizado.
- `assertSubPlotCanBeChanged`: bloqueia alterações em parcela encerrada ou talhão finalizado.
- `startCollection`: retorna os estados de talhão e parcela em andamento na primeira coleta;
  novas coletas mantêm esses estados. Não reabre parcela encerrada.
- `closeSubPlot`: exige coleta iniciada e pelo menos uma árvore; retorna `CLOSED`.
- `reopenSubPlot`: exige parcela encerrada e talhão em andamento; retorna `IN_PROGRESS`.
- `finishPlot`: exige talhão em andamento e pelo menos uma parcela, com todas as parcelas
  encerradas; retorna `FINISHED`.

Encerramentos repetidos são rejeitados. Uma parcela reaberta precisa ser encerrada
novamente antes da finalização do talhão. O mínimo de parcelas para estatística pertence
ao processamento e não é confundido com a regra de finalização do inventário.

### Integração com os CRUDs

Este bloco fornece o modelo e as regras de domínio. Os CRUDs de talhões, parcelas e
árvores ainda precisam importar `InventoryStatusModule`, consultar os estados atuais,
validar a operação e persistir os estados retornados junto com a alteração dos dados.
Os métodos do serviço não gravam no banco nem expõem novas rotas HTTP.

A validação, a alteração de dados e a atualização dos estados devem ocorrer na mesma
transação, protegendo a operação contra uma finalização concorrente. Não reutilizar
estados enviados pelo cliente ou carregados anteriormente para autorizar a gravação.
A aplicação desses bloqueios às operações de escrita será integrada com a
[tarefa #46](https://github.com/coleta-florestal/Front-End/issues/46).

Os serviços de cálculo e auditoria continuam nas tarefas correspondentes; esta base não
calcula métricas, não cria CRUDs paralelos e não registra a #42 como concluída no backlog.

### Verificação

Execute `npx prisma generate`, `npx prisma validate`, `npm test -- --runInBand`,
`npm run build` e `npm run lint`. Os testes das regras são unitários e não acessam um
banco externo. A migração deve ser executada em PostgreSQL de desenvolvimento antes da
integração, incluindo uma base com árvores previamente cadastradas.
