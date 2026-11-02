# Back-End

## Configuração de validações de coleta

Implementação da [tarefa #62](https://github.com/coleta-florestal/Front-End/issues/62).

Os limites de DAP e altura são uma configuração global do sistema. As rotas exigem um
token JWT válido no cabeçalho `Authorization: Bearer <token>` e perfil `ADMIN` ou
`SUPER_ADMIN`.

| Método | Rota                 | Comportamento                                               |
| ------ | -------------------- | ----------------------------------------------------------- |
| GET    | `/admin/validations` | Consulta os limites configurados.                           |
| PUT    | `/admin/validations` | Cria a primeira configuração ou substitui todos os limites. |

O corpo do PUT deve conter os quatro campos numéricos:

```json
{
  "minDapCm": 1,
  "maxDapCm": 200,
  "minHeightM": 0.5,
  "maxHeightM": 80
}
```

Os valores acima são apenas exemplos de uso da API, sem validação biométrica pela cliente.
DAP é informado em centímetros; altura, em metros. Todos os valores devem ser positivos
e finitos, e cada mínimo deve ser menor que seu máximo. Campos ausentes, campos extras
e faixas inválidas retornam `400`. Os limites são inclusivos para a futura validação das
medições: uma medida igual ao mínimo ou ao máximo está dentro da faixa.

Não há limites predefinidos. Antes do primeiro PUT, a consulta retorna `404`, indicando
que o administrador ainda precisa configurar a coleta. A resposta inclui os limites,
o identificador fixo `1` e as datas de criação e atualização.

O `ValidationsModule` exporta `ValidationsService`. O módulo responsável pela
[validação de dados (#45)](https://github.com/coleta-florestal/Front-End/issues/45) pode
importá-lo e chamar `findOne()` para obter os limites. Esta tarefa configura os limites;
a aplicação deles no cadastro das árvores faz parte dessa integração.

Em um ambiente de desenvolvimento configurado, aplique a migração antes de usar as
rotas, com `npm run db:deploy` (o Prisma utiliza `DIRECT_URL`).
