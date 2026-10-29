# Arquitetura do Patrify

Este documento descreve como o front-end, a API e o banco se organizam, quais decisões sustentam a
implementação atual e onde evoluir com segurança.

## 1. Visão de contexto

```text
┌──────────────────┐        HTTPS / JSON        ┌──────────────────┐
│  Angular SPA     │ ─────────────────────────▶ │  Express API     │
│  (navegador)     │ ◀───────────────────────── │  (Node.js 20)    │
└──────────────────┘   Authorization: Bearer    └────────┬─────────┘
         │                                                │
         │ assets estáticos                               │ Driver oficial mongodb
         ▼                                                ▼
   Nginx / CDN                                       MongoDB 7+
                                                          │
                          ┌───────────────┬───────────────┼────────────────┐
                          ▼               ▼               ▼                ▼
                     BrasilAPI      Google Places    SMTP          Vercel Blob
                   (dados CNPJ)   (pontos descarte) (reset senha)  (imagens)
```

O sistema é um monorepo com dois projetos independentes:

- `patrify-frontend`: SPA Angular 16, sem renderização no servidor.
- `patrify-backend`: API REST stateless, autenticada por JWT.

## 2. Back-end

### 2.1 Composição

`src/app.js` monta o Express e concentra preocupações transversais:

1. `helmet` e CORS restrito.
2. Parsers JSON/urlencoded com limite de 1 MB.
3. `pino-http` com `requestId` (aceita `x-request-id` do cliente).
4. Rate limit global.
5. Arquivos estáticos de `uploads/`.
6. Health check com ping no banco.
7. Rotas de domínio em `/api`.
8. `notFound` e `errorHandler` centralizados.

`src/server.js` apenas sobe o servidor e implementa shutdown gracioso (SIGTERM/SIGINT), com timeout
de 10 segundos e fechamento do pool.

### 2.2 Camadas por módulo

Cada módulo em `src/modules` segue o mesmo desenho:

| Arquivo             | Responsabilidade                                              |
| ------------------- | ------------------------------------------------------------- |
| `*.routes.js`       | Rotas, middleware de auth, validação e upload                 |
| `*.schemas.js`      | Contratos Zod de body, query e params                         |
| `*.controller.js`   | Tradução HTTP (quando o módulo tem controller dedicado)        |
| `*.service.js`      | Regras de negócio, orquestração e erros de domínio            |
| `*.repository.js`   | Operações no MongoDB e mapeamento documento → DTO             |

Responsabilidades por módulo:

- **auth**: registro com enriquecimento de CNPJ, login, `me`, recuperação e troca de senha.
- **users**: leitura e atualização do perfil corporativo.
- **patrimony**: CRUD com soft delete, serial único, resumo analítico, upload de imagem.
- **discard**: busca de pontos no Google Places com cache em memória de 5 minutos.

### 2.3 Ciclo de uma requisição autenticada

```text
Request
  → CORS / Helmet
  → pino-http (requestId)
  → globalLimiter
  → authenticate (Bearer JWT → req.user = { id, email, cnpj })
  → validate (Zod: body/query/params)
  → asyncHandler → service → repository → MongoDB
  → res.json({ data, meta? })
  → errorHandler (se algo falhar)
```

`authenticate` valida assinatura, issuer, audience e expiração. O `userId` nunca vem do cliente:
toda consulta de patrimônio usa `req.user.id`, o que garante isolamento entre empresas.

### 2.4 Contrato de resposta

Sucesso:

```json
{ "data": { }, "meta": { } }
```

Erro:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos na requisição.",
    "details": [{ "field": "cnpj", "message": "CNPJ inválido." }]
  },
  "requestId": "6f1c..."
}
```

O `errorHandler` normaliza:

- `ZodError` → 422 com `details` por campo.
- `MulterError` → 400 (`FILE_TOO_LARGE` etc.).
- JSON inválido → 400 `INVALID_JSON`.
- `11000` (MongoDB duplicate key) → 409 `DUPLICATE_RESOURCE`.
- `BSONError` / `BSONTypeError` → 400 `INVALID_INPUT_SYNTAX`.
- Erro inesperado → 500 `INTERNAL_ERROR` (stack só fora de produção).

## 3. Autenticação e sessão

1. O usuário informa CNPJ e senha no front-end.
2. A API normaliza o CNPJ, busca o usuário e compara a senha com bcrypt.
3. Se o CNPJ não existe, um hash descartável é comparado para equalizar o tempo de resposta.
4. A API devolve `{ user, token }`; o front-end guarda o token em `localStorage`
   (`patrify.token`) e o usuário em um `BehaviorSubject`.
5. O `AuthInterceptor` adiciona `Authorization: Bearer <token>` em todas as chamadas.
6. O `AuthGuard` valida expiração localmente e, se necessário, chama `GET /auth/me`.
7. O `ErrorInterceptor` trata 401 fora das rotas de auth: limpa a sessão, avisa e redireciona.

Recuperação de senha:

- `POST /auth/forgot-password` responde de forma genérica para evitar enumeração.
- O token tem `purpose=password_reset`, validade curta e link em `FRONTEND_URL/recsenha?token=...`.
- A troca grava `password_changed_at`; tokens emitidos antes dessa data são rejeitados, garantindo
  uso único.
- Sem SMTP configurado, o link é registrado no log para desenvolvimento.

## 4. Modelo de dados (MongoDB)

### Coleção `users`

| Campo                | Uso                                            |
| -------------------- | ---------------------------------------------- |
| `_id`                | `ObjectId` único do documento                  |
| `cnpj`               | CNPJ apenas dígitos, índice único              |
| `email`              | e-mail normalizado em minúsculas, índice único |
| `passwordHash`       | hash bcrypt                                    |
| `name`               | nome fantasia / nome do contato                |
| `legalName`          | razão social vinda da Receita                  |
| `address`            | endereço montado a partir do CNPJ              |
| `economicActivity`   | CNAE descritivo                                |
| `branchType`         | matriz/filial                                  |
| `companySize`        | porte da empresa                               |
| `lastLoginAt`        | último acesso                                  |
| `passwordChangedAt`  | invalidação de tokens de reset                 |
| `createdAt`          | data de criação                                |
| `updatedAt`          | data da última atualização                     |

### Coleção `patrimonies`

| Campo                | Uso                                            |
| -------------------- | ---------------------------------------------- |
| `_id`                | `ObjectId` único do documento                  |
| `userId`             | `ObjectId` de referência para `users._id`      |
| `name`               | nome do bem                                    |
| `value`              | valor numérico do bem                          |
| `purchaseDate`       | data de aquisição (`YYYY-MM-DD`)               |
| `location`           | localização física                             |
| `status`             | `Ativo` ou `Não ativo`                         |
| `condition`          | condição de conservação                        |
| `category`           | categoria                                      |
| `serialNumber`       | serial único gerado pela API                   |
| `quantity`           | quantidade                                     |
| `imageUrl`           | URL absoluta (`BASE_URL/uploads/...`) ou Vercel Blob |
| `deletedAt`          | soft delete (`null` quando ativo)              |
| `createdAt`          | data de criação                                |
| `updatedAt`          | data da última atualização                     |

Índices configurados automaticamente em `ensureIndexes()`: `cnpj` (único), `email` (único),
`serialNumber` (único), `(userId, deletedAt)`, `(userId, status)`, `(userId, category)`,
`purchaseDate` e `name`.

## 5. Front-end

### 5.1 Organização

```text
src/app/
├── core/
│   ├── models/          # contratos tipados da API
│   ├── services/        # ApiService, AuthService, domínio, preferências
│   ├── guards/          # AuthGuard
│   ├── interceptors/    # auth, loading, erros
│   └── page-title.strategy.ts
├── pages/
│   ├── landingpage/     # página pública de apresentação
│   ├── login/           # login, registro e recuperação
│   ├── home/            # dashboard e gráficos
│   ├── inventario/      # CRUD, filtros, CSV e upload
│   ├── descarte/        # geolocalização e busca de pontos
│   ├── userpage/        # perfil e segurança
│   ├── config/          # preferências e sessão
│   └── global/          # sidebar e header
└── shared/
    ├── layout/          # shell autenticado
    ├── components/      # confirm-dialog
    ├── directives/      # máscara de CNPJ
    └── utils/           # validação/formatação de CNPJ
```

### 5.2 Serviços e estado

- `ApiService` centraliza URL base, envelope `{ data }`, parâmetros e upload multipart.
- `AuthService` mantém `user$`, token, expiração e operações de sessão.
- Serviços de domínio (`PatrimonyService`, `UserService`, `DiscardService`) expõem apenas métodos
  tipados.
- `PreferencesService` persiste preferências simples em `localStorage` (itens por página).
- Não há store global: o estado é local às páginas, com RxJS para streams.

### 5.3 UX e resiliência

- Formulários reativos com validação local e mensagens por campo.
- Estados explícitos de carregamento (skeletons/spinners), vazio e erro.
- Toasts globais via `ErrorInterceptor`; as páginas só tratam o que precisa de contexto.
- Layout responsivo com sidebar off-canvas, header sticky e conteúdo em `max-width` fluido.
- Acessibilidade básica: labels associados, `aria-label` em botões de ícone, foco visível e
  contraste adequado.

## 6. Configuração e ambientes

- Desenvolvimento: `environment.ts` → `http://localhost:3000/api`.
- Produção: `environment.prod.ts` → `/api`, resolvido por proxy reverso.
- Docker: Nginx encaminha `/api/` e `/uploads/` para o serviço `backend`.
- Vercel: `patrify-frontend/vercel.json` reescreve `/api/*` para o back-end.

## 7. Decisões e trade-offs

| Decisão                              | Motivo                                                       |
| ------------------------------------ | ------------------------------------------------------------ |
| JWT stateless                        | Simplicidade de deploy e escala horizontal                   |
| Soft delete                          | Preserva histórico e evita perda acidental                   |
| Zod nos limites da API               | Contratos explícitos e mensagens consistentes                |
| Driver nativo `mongodb`              | Pipelines de agregação e controle direto de índices          |
| Cache em memória no descarte         | Reduz custo da Places API; suficiente para instância única   |
| Tailwind + classes de componente     | Consistência visual com baixo custo de manutenção            |
| Módulos Angular (não standalone)     | Compatibilidade com Angular 16 e estrutura existente         |

## 8. Evoluções recomendadas

1. Refresh token e rotação de sessão (hoje o access token expira e exige novo login).
2. Testes E2E do fluxo crítico (login → inventário → descarte) com Playwright.
3. Observabilidade: métricas Prometheus/OpenTelemetry e alertas de erro.
4. Fila/worker para e-mails e chamadas externas, reduzindo latência do request.
5. Cache distribuído (Redis) para descarte e rate limit em múltiplas instâncias.
6. Auditoria de alterações em patrimônios (quem alterou, quando e o quê).
7. Migração para Angular standalone + signals em uma próxima major.
