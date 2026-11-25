# GLUPTA · Inventário Florestal

O GLUPTA é uma plataforma para coletar, acompanhar e analisar dados de florestas plantadas. A equipe de campo registra as medições de cada árvore por parcela. Quem acompanha o inventário consulta o progresso da coleta e usa os resultados volumétricos para apoiar decisões de manejo florestal.

Este repositório contém a API do GLUPTA. Ela autentica usuários, armazena os dados do inventário, fornece indicadores e executa o processamento volumétrico. O front-end oferece a interface de coleta, os dashboards e os relatórios. [Repositório do front-end](https://github.com/coleta-florestal/Front-End)

## Sumário

- [Visão geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Mapa da API](#mapa-da-api)
- [Como rodar localmente](#como-rodar-localmente)
- [Scripts e verificações](#scripts-e-verificações)
- [Build e Docker](#build-e-docker)
- [Solução de problemas](#solução-de-problemas)
- [Contribuição e releases](#contribuição-e-releases)
- [Licença](#licença)

## Visão geral

### Hierarquia do inventário

**Fazenda → Talhão → Parcela → Árvore**

Uma fazenda reúne talhões. Cada talhão contém parcelas de amostragem, nas quais são registradas as árvores. As rotas dos recursos filhos incluem os identificadores dos pais.

| Entidade | Nome na API | O que representa                                                                                                                         |
| -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Fazenda  | `farm`      | Unidade do inventário que reúne talhões e tem um usuário responsável.                                                                    |
| Talhão   | `plot`      | Área da fazenda, medida em hectares (ha), que agrupa parcelas.                                                                           |
| Parcela  | `subPlot`   | Unidade de amostragem, com área em metros quadrados (m²), meta de árvores e estado de coleta.                                            |
| Árvore   | `tree`      | Registro com identificador, diâmetro à altura do peito (DAP) em centímetros, altura em metros quando informada, qualidade e observações. |

### Funcionalidades

- **Acesso e perfil** — solicitação de cadastro, aprovação, login, recuperação de senha por e-mail e atualização do perfil.
- **Coleta de campo** — gestão de fazendas, talhões, parcelas e árvores, com busca e acompanhamento da meta de coleta por parcela.
- **Indicadores** — consolidação por fazenda de dados como progresso da coleta, contagem de árvores e distribuição de qualidade.
- **Processamento** — aplicação de equações volumétricas para calcular o volume das árvores e estimar indicadores e estatísticas por parcela, talhão ou fazenda.
- **Administração** — gestão de usuários e seus vínculos com fazendas, equações volumétricas, limites de medição e consulta do histórico de auditoria.

## Arquitetura

| Camada                | Tecnologias e responsabilidades                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| API HTTP              | NestJS 11 com Express e TypeScript. Os controllers recebem requisições e encaminham as operações aos services.                           |
| Validação             | `class-validator` e `class-transformer`. O `ValidationPipe` global transforma entradas e rejeita propriedades extras nos DTOs validados. |
| Autenticação          | Passport e JWT para autenticação e controle por papel. As senhas são armazenadas como hashes bcrypt.                                     |
| Persistência          | PostgreSQL com Prisma 7 e o adaptador `@prisma/adapter-pg`. O schema define os modelos e as migrações versionam as mudanças no banco.    |
| E-mail                | Nodemailer com Gmail para enviar o link de redefinição de senha.                                                                         |
| Qualidade e automação | ESLint, Prettier, Jest, Supertest, Husky, Commitlint e GitHub Actions.                                                                   |

O bootstrap inicializa o NestJS e configura CORS, validação e porta. O módulo raiz carrega a configuração e os módulos de domínio. Em uma requisição protegida, os guards verificam a sessão e as restrições de papel, os pipes validam a entrada, e o controller chama o service. Os services aplicam as regras de negócio e usam o PrismaService para acessar o banco. [Bootstrap](src/main.ts), [módulo raiz](src/app.module.ts), [PrismaService](src/prisma/prisma.service.ts)

### Sessão e permissões

O cadastro cria uma conta com status `PENDING`. Depois da aprovação, o login devolve um JWT no campo `access_token`, com validade de oito horas. Envie o token no cabeçalho `Authorization: Bearer <token>`. A cada requisição protegida, a estratégia JWT consulta o usuário no banco e exige aprovação (`APPROVED`) e conta ativa (`ACTIVE`). O guard de papéis usa o papel atual da conta para verificar as rotas com `@Roles`.

| Papel         | Acesso                                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `USER`        | Operações do inventário e perfil que exigem autenticação. Na listagem de fazendas, vê os projetos aos quais está vinculado via `UserFarm`.                     |
| `ADMIN`       | Administração, processamento volumétrico e operações de escrita em fazendas e talhões. Na aprovação e na alteração de papel de usuários, pode atribuir `USER`. |
| `SUPER_ADMIN` | Acesso administrativo e permissão para atribuir papéis administrativos, conforme as regras do serviço de usuários.                                             |

A recuperação de senha envia um link para `/reset-password` no front-end. O token expira em 15 minutos e pode ser usado uma vez.

### Processamento volumétrico

O serviço de processamento carrega as medições do banco ou recebe as parcelas e árvores no corpo da requisição. A ordem de seleção é a equação personalizada em `equation`, a equação ativa indicada em `equationId` e, por fim, a equação ativa mais recente. Se o cliente omitir a equação e o banco não tiver uma equação ativa, a API responde com `400`. [Serviço de processamento](src/processing/processing.service.ts)

O cálculo usa a área registrada de cada parcela ou a área informada em `defaultParcelaAreaM2`. O serviço valida as medições para o cálculo, aplica a equação às árvores e consolida os volumes em m³, a estimativa em m³/ha e as estatísticas amostrais. É possível informar os limites específicos do processamento em `validationLimits`. [DTO de processamento por inventário](src/processing/dto/process-inventory.dto.ts), [DTO de processamento por payload](src/processing/dto/process-payload.dto.ts)

## Estrutura de pastas

```text
.
├── .github/workflows/       # Lint, checagem de segredos, título de PR e releases
├── .husky/                  # Hooks de commit
├── prisma/
│   ├── migrations/          # Migrações SQL versionadas
│   └── schema.prisma        # Modelos e relações do PostgreSQL
├── src/
│   ├── admin/
│   │   ├── audit/           # Histórico de operações
│   │   ├── equations/       # Equações volumétricas
│   │   ├── projects/        # Vínculos de usuários com fazendas
│   │   ├── users/           # Aprovação, ativação e papéis
│   │   └── validations/     # Limites globais de medição
│   ├── auth/                # Cadastro, login, recuperação de senha e guards
│   ├── dashboard/           # Indicadores por fazenda
│   ├── email/               # Envio de e-mail de recuperação
│   ├── farm/
│   │   ├── farms/           # Fazendas
│   │   ├── plots/           # Talhões
│   │   ├── subplots/        # Parcelas
│   │   └── trees/           # Árvores
│   ├── prisma/              # Serviço de acesso ao banco
│   ├── processing/          # Processamento volumétrico e estatística
│   ├── profile/             # Consulta e edição do perfil
│   ├── app.module.ts        # Módulo raiz
│   ├── health.controller.ts # Endpoint de saúde
│   └── main.ts              # Inicialização da aplicação
├── test/                    # Configuração Jest e cenário E2E legado
├── .env-example             # Modelo das variáveis de ambiente
├── Dockerfile               # Build e execução em contêiner
├── package.json             # Dependências e scripts
└── prisma7.config.ts        # Configuração da CLI e das migrações
```

O Prisma gera o cliente em `src/generated/prisma/` durante a instalação. Essa pasta é gerada localmente e fica fora do controle de versão.

## Mapa da API

Os caminhos abaixo são relativos à URL base. A aplicação usa rotas sem prefixo global. Segmentos como `:farmId` representam identificadores dos recursos. Envie `Content-Type: application/json` nas requisições com corpo JSON.

### Acesso, perfil e saúde

| Método | Rota                    | Acesso  | Finalidade                                                              |
| ------ | ----------------------- | ------- | ----------------------------------------------------------------------- |
| GET    | `/health`               | Público | Informa o estado do processo, o tempo de execução e a data da resposta. |
| POST   | `/auth/signup`          | Público | Solicita cadastro.                                                      |
| POST   | `/auth/signin`          | Público | Autentica e retorna `access_token`.                                     |
| POST   | `/auth/forgot-password` | Público | Solicita o link de redefinição por e-mail.                              |
| POST   | `/auth/reset-password`  | Público | Redefine a senha com o token recebido por e-mail.                       |
| GET    | `/profile`              | JWT     | Consulta o perfil da conta autenticada.                                 |
| PATCH  | `/profile/update`       | JWT     | Atualiza o perfil da conta autenticada.                                 |

### Inventário e indicadores

| Métodos       | Rota                                                             | Acesso             | Finalidade                                                            |
| ------------- | ---------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------- |
| GET           | `/farms`                                                         | JWT                | Lista fazendas, com filtro opcional `search`.                         |
| GET           | `/farms/admin_owners`                                            | JWT                | Lista usuários com papel administrativo para seleção de responsável.  |
| POST          | `/farms`                                                         | ADMIN, SUPER_ADMIN | Cria uma fazenda.                                                     |
| PATCH, DELETE | `/farms/:farmId`                                                 | ADMIN, SUPER_ADMIN | Atualiza ou remove uma fazenda.                                       |
| GET           | `/farms/:farmId/plots`                                           | JWT                | Lista os talhões de uma fazenda.                                      |
| POST          | `/farms/:farmId/plots`                                           | ADMIN, SUPER_ADMIN | Cria um talhão.                                                       |
| PATCH, DELETE | `/farms/:farmId/plots/:plotId`                                   | ADMIN, SUPER_ADMIN | Atualiza ou remove um talhão.                                         |
| GET, POST     | `/farms/:farmId/plots/:plotId/subplots`                          | JWT                | Lista ou cria parcelas. A listagem aceita `search`.                   |
| PATCH, DELETE | `/farms/:farmId/plots/:plotId/subplots/:subPlotId`               | JWT                | Atualiza ou remove uma parcela.                                       |
| PATCH         | `/farms/:farmId/plots/:plotId/subplots/:subPlotId/status`        | JWT                | Altera o estado da coleta da parcela.                                 |
| GET, POST     | `/farms/:farmId/plots/:plotId/subplots/:subPlotId/trees`         | JWT                | Lista ou cadastra árvores em uma parcela. A listagem aceita `search`. |
| PATCH, DELETE | `/farms/:farmId/plots/:plotId/subplots/:subPlotId/trees/:treeId` | JWT                | Atualiza ou remove uma árvore.                                        |
| GET           | `/dashboard/:farmId`                                             | JWT                | Consulta os indicadores de uma fazenda.                               |

### Processamento

Todas as rotas abaixo usam `POST` e exigem `ADMIN` ou `SUPER_ADMIN`.

| Rota                                          | Finalidade                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/processing/plots/:plotId`                   | Processa um talhão pelo identificador.                                             |
| `/processing/farms/:farmId/plots/:plotId`     | Processa um talhão dentro da fazenda indicada.                                     |
| `/processing/farms/:farmId`                   | Processa as parcelas da fazenda e consolida os resultados.                         |
| `/processing/payload`, `/processing/simulate` | Calcula volumes e estatísticas a partir dos dados enviados no corpo da requisição. |

### Administração

| Métodos            | Rota                                                                                | Acesso             | Finalidade                                                              |
| ------------------ | ----------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| GET                | `/admin/users`, `/admin/users/pending`, `/admin/users/:identifier`                  | ADMIN, SUPER_ADMIN | Lista usuários aprovados ou pendentes, ou consulta um usuário aprovado. |
| PATCH              | `/admin/users/:id/approve`, `/admin/users/:id/reject`                               | ADMIN, SUPER_ADMIN | Aprova ou rejeita uma solicitação.                                      |
| PATCH              | `/admin/users/:id/role`, `/admin/users/:id/activate`, `/admin/users/:id/deactivate` | ADMIN, SUPER_ADMIN | Altera papel ou estado da conta.                                        |
| DELETE             | `/admin/users/:id`                                                                  | ADMIN, SUPER_ADMIN | Remove um usuário conforme as regras do serviço.                        |
| GET                | `/admin/projects`, `/admin/projects/users`                                          | JWT                | Lista fazendas com seus vínculos ou usuários aprovados.                 |
| POST, DELETE       | `/admin/projects/:farmId/users/:userId`                                             | JWT                | Cria ou remove o vínculo entre uma fazenda e um usuário.                |
| GET, POST          | `/admin/equations`                                                                  | ADMIN, SUPER_ADMIN | Lista ou cria equações volumétricas.                                    |
| GET, PATCH, DELETE | `/admin/equations/:id`                                                              | ADMIN, SUPER_ADMIN | Consulta, atualiza ou remove uma equação.                               |
| PATCH              | `/admin/equations/:id/status`                                                       | ADMIN, SUPER_ADMIN | Altera a disponibilidade de uma equação.                                |
| GET, PUT           | `/admin/validations`                                                                | ADMIN, SUPER_ADMIN | Consulta ou substitui os limites globais de medição.                    |
| GET                | `/admin/audit`                                                                      | ADMIN, SUPER_ADMIN | Consulta o histórico de auditoria.                                      |

### Limites de coleta

As migrações inicializam os limites de DAP em 5–300 cm e os de altura em 1–60 m. Os extremos são inclusivos. A API aplica esses limites ao DAP e à altura informados no cadastro ou na edição de árvores. Em uma edição parcial, a validação considera os campos enviados.

O `PUT /admin/validations` recebe os quatro limites de uma vez. Todos devem ser numéricos, positivos e finitos, e cada mínimo deve ser menor que seu máximo. O exemplo usa os valores iniciais.

```json
{
  "minDapCm": 5,
  "maxDapCm": 300,
  "minHeightM": 1,
  "maxHeightM": 60
}
```

A API retorna os limites com o identificador `1` e as datas de criação e atualização. A consulta retorna `404` se o registro de configuração estiver ausente.

## Como rodar localmente

Use Git, Node.js 24, npm e uma instância acessível do PostgreSQL. Use um banco de desenvolvimento separado e um usuário com permissões para aplicar as migrações nesse banco. O exemplo usa o banco `glupta` e um usuário do mesmo nome. Se precisar criá-los, abra o `psql` com uma conta administrativa do PostgreSQL local e execute os comandos abaixo.

```sql
CREATE ROLE glupta LOGIN;
\password glupta
CREATE DATABASE glupta OWNER glupta;
```

1. Clone o repositório e instale as dependências pelo lockfile.

   ```bash
   git clone https://github.com/coleta-florestal/Back-End.git
   cd Back-End
   npm ci
   ```

2. Copie o modelo de configuração e ajuste a conexão e as credenciais.

   ```bash
   cp .env-example .env
   ```

   ```dotenv
   DATABASE_URL="postgresql://glupta:senha-local@localhost:5432/glupta?schema=public"
   DIRECT_URL="postgresql://glupta:senha-local@localhost:5432/glupta?schema=public"
   JWT_SECRET="substitua-por-um-segredo-local"
   PORT=3333
   SMTP_USER="conta-de-teste@example.com"
   SMTP_PASSWORD="senha-ilustrativa"
   MAIL_FROM="GLUPTA <conta-de-teste@example.com>"
   FRONTEND_URL="http://localhost:3000"
   ```

   | Variável                     | Uso                                                                                                                              |
   | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
   | `DATABASE_URL`               | Conexão da API com o PostgreSQL.                                                                                                 |
   | `DIRECT_URL`                 | Conexão direta usada pela CLI do Prisma para aplicar migrações. Em um PostgreSQL local pode ter o mesmo valor de `DATABASE_URL`. |
   | `JWT_SECRET`                 | Segredo de assinatura e verificação do JWT. Gere um valor próprio, por exemplo, com `openssl rand -hex 32`.                      |
   | `PORT`                       | Porta HTTP da API. O bootstrap usa `3333` quando a variável está ausente.                                                        |
   | `SMTP_USER`, `SMTP_PASSWORD` | Variáveis lidas na inicialização do serviço de e-mail. Para testar o envio, configure uma conta Gmail e uma senha de app válida. |
   | `MAIL_FROM`                  | Remetente da mensagem de recuperação de senha.                                                                                   |
   | `FRONTEND_URL`               | URL base que o link de recuperação usa para abrir o front-end.                                                                   |

   Use a senha definida para o usuário `glupta` nas duas URLs do banco. Os valores de SMTP acima servem para subir a API e testar o fluxo sem envio de e-mail. Mantenha o arquivo `.env` fora do Git.

3. Aplique as migrações e inicie o servidor.

   ```bash
   npm run db:deploy
   npm run start:dev
   ```

4. Consulte o endpoint de saúde em outro terminal.

   ```bash
   curl -fsS http://localhost:3333/health
   ```

   A resposta inclui `status: "ok"`. Para usar a interface web, configure `NEXT_PUBLIC_API_URL=http://localhost:3333` no ambiente do front-end e inicie o front-end pelo procedimento do seu README. O front-end usa a porta `3000` por padrão.

### Cadastro, login e perfil

Cadastre uma conta de teste com um e-mail exclusivo no banco local. Use a mesma senha nos campos `password` e `confirmPassword`.

```bash
curl -fsS http://localhost:3333/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"userName":"Conta Local","email":"admin.local@example.com","password":"Glup7a!Local","confirmPassword":"Glup7a!Local"}'
```

Se já houver um administrador, ele pode aprovar a solicitação na interface ou pela API com `PATCH /admin/users/:id/approve` e um corpo como `{"role":"USER"}`. Em um banco de desenvolvimento recém-criado, provisione o primeiro administrador local pelo `psql`.

```bash
psql -h localhost -U glupta -d glupta
```

No `psql`, aprove a conta que acabou de cadastrar. Se estiver usando outro esquema, ajuste `public`. Confira se o comando atualiza uma linha.

```sql
UPDATE public.users
SET role = 'ADMIN',
    status = 'APPROVED',
    account_status = 'ACTIVE',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin.local@example.com'
  AND status = 'PENDING'
RETURNING id, email, role, status, account_status;
```

Faça login e copie o valor de `access_token` da resposta.

```bash
curl -fsS http://localhost:3333/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin.local@example.com","password":"Glup7a!Local"}'
```

Use o token para consultar o perfil.

```bash
TOKEN='cole-o-access-token-aqui'
curl -fsS http://localhost:3333/profile \
  -H "Authorization: Bearer $TOKEN"
```

## Scripts e verificações

| Comando                                                        | Finalidade                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| `npm ci`                                                       | Instala as dependências e gera o cliente Prisma no `postinstall`. |
| `npm start`                                                    | Inicia a API pelo Nest CLI.                                       |
| `npm run start:dev`                                            | Inicia a API e recompila quando os arquivos mudam.                |
| `npm run start:debug`                                          | Inicia o modo de depuração com recompilação automática.           |
| `npm run build`                                                | Compila a API para `dist/`.                                       |
| `npm run start:prod`                                           | Executa `dist/src/main.js` após o build.                          |
| `npm run db:deploy`                                            | Aplica migrações pendentes pelo Prisma usando `DIRECT_URL`.       |
| `npx prisma validate`                                          | Valida o schema do Prisma.                                        |
| `npm run lint`                                                 | Executa o ESLint.                                                 |
| `npm run format`                                               | Formata os arquivos TypeScript em `src/` e `test/` com Prettier.  |
| `npm test`                                                     | Procura testes unitários em `src/`.                               |
| `npm run test:watch`, `npm run test:cov`, `npm run test:debug` | Executam o Jest em modo contínuo, com cobertura ou com depurador. |
| `npm run test:e2e`                                             | Executa testes com a configuração em `test/jest-e2e.json`.        |
| `npm run prepare`                                              | Configura os hooks do Husky.                                      |

### Testes de ponta a ponta

O repositório ainda não tem testes unitários em `src/`. O cenário E2E legado carrega o módulo completo e espera a resposta `Hello World!` em `GET /`. A rota pública de saúde atual é `GET /health`. Para verificar a API em execução, use o fluxo de cadastro, login e perfil acima com um banco isolado de desenvolvimento. [Cenário E2E](test/app.e2e-spec.ts)

## Build e Docker

Com as variáveis de ambiente configuradas e as migrações aplicadas, use os comandos abaixo para compilar e iniciar a API em modo de produção.

```bash
npm run build
npm run start:prod
```

O Dockerfile compila a aplicação em uma imagem Node.js 24 Alpine e executa o resultado com o usuário `node`. A imagem usa a porta interna `3000` por padrão. O exemplo publica a API na porta local `3333` configurada no front-end. [Dockerfile](Dockerfile)

```bash
docker build -t glupta-back .
docker run --rm --name glupta-back \
  --env-file .env -e PORT=3000 \
  -p 3333:3000 glupta-back
```

Configure `DATABASE_URL` com um host acessível a partir do contêiner. Se o banco estiver em outro contêiner, use uma rede compartilhada. Se estiver na máquina anfitriã, use o endereço do host a partir do contêiner, como `host.docker.internal` no Docker Desktop. `localhost` dentro do contêiner aponta para o próprio contêiner.

Aplique as migrações a partir do checkout com dependências de desenvolvimento instaladas antes de iniciar a API. A imagem final executa apenas com as dependências de produção, e a CLI do Prisma está em `devDependencies`. O healthcheck do contêiner consulta `/health` e verifica a resposta HTTP do processo.

## Solução de problemas

| Sintoma                                               | O que verificar                                                                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A instalação ou o build não encontra o cliente Prisma | Use Node.js 24 e execute `npm ci`. Para regenerar o cliente após uma mudança no schema, execute `npx prisma generate`.                                      |
| A migração falha ou a API não conecta ao banco        | Confira `DIRECT_URL` para a migração e `DATABASE_URL` para a API. Confirme host, porta, banco, esquema e permissões no ambiente em uso.                     |
| A aplicação encerra ao iniciar                        | Confira `JWT_SECRET`, `SMTP_USER` e `SMTP_PASSWORD` e verifique se a porta escolhida está livre.                                                            |
| A conta continua pendente ou a API retorna `401`      | Confira a aprovação, o estado ativo da conta e o cabeçalho Bearer. Se o token expirou, faça login novamente.                                                |
| O front-end não consegue chamar a API                 | Verifique `NEXT_PUBLIC_API_URL` no front-end, a porta publicada e a resposta de `GET /health` nesse endereço.                                               |
| A recuperação de senha falha                          | Confira a conta Gmail, a senha de app e `MAIL_FROM`. Use a URL do front-end em `FRONTEND_URL` para que o e-mail aponte para a tela correta.                 |
| O processamento rejeita o talhão                      | Confira se há uma equação ativa ou forneça uma no corpo da requisição. Verifique se cada parcela tem área ou se a requisição inclui `defaultParcelaAreaM2`. |

## Contribuição e releases

1. Crie uma branch para a alteração.
2. Execute `npm run lint` e as verificações aplicáveis. Para mudanças que afetam a API ou o banco, use um ambiente de desenvolvimento isolado.
3. Use Conventional Commits no commit e no título do pull request, por exemplo, `docs: documenta a API do inventário`.
4. Abra o pull request com a descrição da mudança e as verificações realizadas.

O Husky roda o lint-staged no pre-commit e o Commitlint ao validar a mensagem do commit. Nos pull requests, o GitHub Actions verifica o título, executa lint e faz a checagem de segredos.

Quando há commits que geram uma nova versão, o semantic-release publica releases estáveis na branch `main` e pré-releases `rc` na `stage`. [Histórico de versões](CHANGELOG.md)

## Licença

Distribuído sob a licença MIT. [LICENSE](LICENSE)
