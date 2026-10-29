# Patrify · Gestão patrimonial inteligente

Plataforma web para controlar o ciclo de vida dos bens de uma empresa: cadastro, inventário,
indicadores, descarte responsável e segurança da conta. O projeto nasceu como TCC em Análise e
Desenvolvimento de Sistemas e foi evoluído para uma arquitetura modular, tipada e pronta para
implantação.

---

## Principais recursos

- **Dashboard executivo** com total de bens, valor ativo, valor ocioso, descartados, evolução
  mensal, distribuição por categoria e por status.
- **Inventário completo** com busca, filtros por categoria/status/conservação, ordenação,
  paginação configurável, exportação CSV e upload de imagem por patrimônio.
- **Cadastro automático de empresa** a partir do CNPJ via BrasilAPI, com razão social, endereço,
  telefone e atividade econômica preenchidos no servidor.
- **Descarte inteligente** com geolocalização do navegador, coordenadas manuais, raio de busca e
  pontos de coleta retornados pelo Google Places.
- **Conta e segurança**: login por CNPJ, JWT, troca de senha, recuperação por token de uso único,
  perfil editável e sessão com expiração.
- **Experiência consistente**: layout responsivo, estados de carregamento, vazio e erro, toasts,
  diálogo de confirmação e acessibilidade básica.

## Stack

| Camada        | Tecnologias                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| Front-end     | Angular 16, TypeScript, RxJS, Reactive Forms, Tailwind CSS, Chart.js   |
| Back-end      | Node.js 20, Express, Zod, JWT, bcryptjs, Pino, Helmet, express-rate-limit    |
| Banco         | MongoDB, índices automáticos e seed idempotente                              |
| Infra         | Docker, Docker Compose, Nginx, Vercel                                        |
| Qualidade     | Mocha + Chai + Supertest, ESLint, Prettier, build de produção do Angular      |

## Arquitetura

```text
patrify-frontend (Angular)
        │  HTTP /api  (JWT Bearer)
        ▼
patrify-backend (Express)
  ├── middleware   auth, validação Zod, rate limit, erros, upload
  ├── modules      auth · users · patrimony · discard
  ├── shared       tokens, senhas, paginação, CNPJ, dinheiro, serial
  └── database     cliente MongoDB, índices, seed
        │
        ▼
     MongoDB
```

Detalhes de decisões, fluxo de requisição e modelo de dados em
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Contrato completo da API em
[`docs/API.md`](docs/API.md).

## Estrutura do repositório

```text
Patrify-main/
├── patrify-backend/
│   ├── src/
│   │   ├── config/          # env, logger, cliente do MongoDB
│   │   ├── database/        # migrate.js (índices), seed.js
│   │   ├── middleware/      # auth, validate, rateLimit, upload, errorHandler
│   │   ├── modules/         # auth, users, patrimony, discard
│   │   ├── shared/          # erros, tokens, utils, mailer
│   │   ├── app.js           # composição do Express
│   │   └── server.js        # bootstrap e shutdown gracioso
│   └── tests/               # testes de integração HTTP
├── patrify-frontend/
│   ├── src/app/core/        # models, services, guards, interceptors
│   ├── src/app/pages/       # dashboard, inventário, descarte, perfil, config
│   ├── src/app/shared/      # layout, diretivas, diálogo, utilitários
│   └── nginx/               # configuração de produção
├── docs/
├── docker-compose.yml
└── README.md
```

## Rodando localmente

### Pré-requisitos

- Node.js 20+
- MongoDB 6+ (ou Docker)
- Angular CLI 16 (opcional; os scripts usam o CLI local)

### 1. Banco de dados

Configure a conexão do banco `patrify` e crie os índices/dados iniciais:

```bash
cd patrify-backend
npm install
cp .env.example .env
# edite MONGODB_URI e JWT_SECRET
npm run db:migrate
npm run db:seed
```

### 2. Back-end

```bash
cd patrify-backend
npm run dev
```

API disponível em `http://localhost:3000/api`. Verifique `GET /api/health`.

> Se a porta 3000 já estiver em uso, altere `PORT` no `.env` e o `apiUrl` em
> `patrify-frontend/src/environments/environment.ts` para a mesma porta.

### 3. Front-end

```bash
cd patrify-frontend
npm install
npm start
```

Aplicação disponível em `http://localhost:4300`.

### Credenciais de demonstração

| Campo | Valor                  |
| ----- | ---------------------- |
| CNPJ  | `11.222.333/0001-81`   |
| E-mail | `demo@patrify.app`    |
| Senha | `Patrify@2024`         |

> O seed é idempotente: pode ser executado novamente sem duplicar o usuário ou os patrimônios.

## Variáveis de ambiente

As variáveis do back-end estão documentadas em
[`patrify-backend/.env.example`](patrify-backend/.env.example). As principais:

| Variável             | Obrigatória | Descrição                                                        |
| -------------------- | ----------- | ---------------------------------------------------------------- |
| `MONGODB_URI`        | sim         | String de conexão do MongoDB (`DATABASE_URL` também é aceita)    |
| `JWT_SECRET`         | sim         | Segredo com no mínimo 32 caracteres                              |
| `JWT_EXPIRES_IN`     | não         | Validade do access token (padrão `2h`)                           |
| `FRONTEND_URL`       | não         | Base usada no link de recuperação de senha                       |
| `CORS_ORIGINS`       | não         | Origens permitidas, separadas por vírgula                        |
| `SMTP_*` / `EMAIL_*` | não         | Envio do e-mail de recuperação (sem SMTP o link vai para o log)  |
| `GOOGLE_MAPS_API_KEY`| não         | Habilita a busca de pontos de descarte                           |
| `BLOB_READ_WRITE_TOKEN` | não      | Usa Vercel Blob no upload; sem ele grava em `uploads/`            |
| `MAX_UPLOAD_MB`      | não         | Limite de imagem por patrimônio (padrão 5 MB)                    |

O front-end usa `src/environments/environment.ts` em desenvolvimento e
`environment.prod.ts` no build de produção. Por padrão, produção chama `/api` e depende de um
proxy reverso (Nginx no Docker ou `vercel.json` na Vercel).

## Docker

Para subir banco, API e interface com um comando:

```bash
docker compose up --build
```

| Serviço  | URL                     |
| -------- | ----------------------- |
| Front-end| `http://localhost:8080` |
| API      | `http://localhost:3000` |
| MongoDB  | `localhost:27017`       |

Defina `JWT_SECRET`, `GOOGLE_MAPS_API_KEY` e credenciais SMTP no ambiente ou em um `.env` na raiz
antes de subir em produção. O container do back-end configura os índices, executa o seed e inicia o servidor.

## Scripts

### Back-end

| Comando              | Função                                      |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Servidor com nodemon                        |
| `npm start`          | Servidor de produção                        |
| `npm test`           | Testes de integração (Mocha + Supertest)    |
| `npm run lint`       | ESLint em `src` e `tests`                   |
| `npm run format`     | Prettier                                    |
| `npm run db:migrate` | Configura coleções e índices do MongoDB     |
| `npm run db:seed`    | Cria/atualiza usuário e dados de demonstração |

### Front-end

| Comando         | Função                              |
| --------------- | ----------------------------------- |
| `npm start`     | Dev server em `localhost:4300`      |
| `npm run build` | Build de produção em `dist/`        |
| `npm test`      | Testes unitários (Karma + Jasmine)  |
| `npm run test:ci` | Testes em ChromeHeadless, sem watch |

## Segurança

- Senhas com bcrypt (12 rounds) e política mínima de 8 caracteres com letras e números.
- JWT assinado com issuer/audience, expiração e verificação de propósito para reset de senha.
- Login com tempo de resposta equalizado para dificultar enumeração de CNPJ.
- Recuperação de senha com resposta genérica, token de uso único e invalidação após troca.
- Rate limit global, por login e por recuperação de senha.
- Helmet, CORS restrito, `x-powered-by` desabilitado, limite de payload e validação Zod.
- Consultas tipadas no MongoDB, soft delete de patrimônios e isolamento por `userId`.
- Upload restrito a JPEG/PNG/WEBP com limite de tamanho e nome aleatório.

## Testes e qualidade

```bash
# back-end
cd patrify-backend
npm test
npm run lint

# front-end
cd patrify-frontend
npm run test:ci
npm run build
```

O back-end possui testes de integração cobrindo health check, autenticação, isolamento de dados,
CRUD de patrimônios, paginação e respostas de erro. O front-end cobre utilitários de CNPJ e
preferências persistidas, com build de produção validado a cada alteração.

## Deploy

### Vercel

- **Back-end**: projeto com root em `patrify-backend`, usando `vercel.json` e as variáveis de
  ambiente documentadas. Configure um cluster gerenciado (ex.: MongoDB Atlas).
- **Front-end**: projeto com root em `patrify-frontend`. O `vercel.json` encaminha `/api/*` para a
  API. Ajuste o destino caso o domínio do back-end seja diferente.

### Docker / VPS

Use o `docker-compose.yml` como base, troque os segredos, configure HTTPS no proxy e mantenha os
volumes `patrify_mongodata` e `patrify_uploads`.

## Documentação

- [`docs/API.md`](docs/API.md) — endpoints, payloads, códigos de erro e paginação.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — camadas, fluxos, modelo de dados e decisões.

## Equipe

- **Evertom Anderson Santos Godoy** — Analista de Requisitos
- **Guilherme Ferraz Macedo** — QA / Dev Back-end
- **João Miguel Freitas da Silva Santos** — Banco de Dados / Dev Back-end
- **Kevin Willians Monteiro Silva** — Integração de API / Dev Full Stack
- **Maylon Fernandes da Silva** — Designer de Interface / Dev Front-end

---

© Patrify — todos os direitos reservados.
