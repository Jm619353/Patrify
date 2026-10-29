# API do Patrify

API REST em Express. Todas as rotas de domínio ficam sob `/api` e usam JSON.

- **Base local:** `http://localhost:3000/api`
- **Produção:** configurada no proxy reverso (`/api`)
- **Autenticação:** `Authorization: Bearer <token>`
- **Idioma:** mensagens em português

## Convenções

### Sucesso

```json
{
  "data": {},
  "meta": {}
}
```

`meta` aparece em listagens e buscas paginadas.

### Erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos na requisição.",
    "details": [{ "field": "email", "message": "E-mail inválido." }]
  },
  "requestId": "8f2c1a9e-..."
}
```

O `requestId` também é devolvido no header de resposta e é útil para correlacionar logs.

### Paginação

Parâmetros aceitos em listagens:

| Parâmetro  | Padrão | Limite | Descrição                  |
| ---------- | ------ | ------ | -------------------------- |
| `page`     | 1      | —      | Página a partir de 1       |
| `pageSize` | 10     | 100    | Itens por página           |

Resposta:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Rate limit

| Escopo                 | Janela | Limite |
| ---------------------- | ------ | ------ |
| Global                 | 15 min | 300    |
| Login                  | 15 min | 10     |
| Recuperação de senha   | 60 min | 5      |

Ao exceder, a API responde `429` com `RATE_LIMITED`, `LOGIN_RATE_LIMITED` ou
`RECOVERY_RATE_LIMITED`.

---

## Saúde

### `GET /api/health`

Sem autenticação. Verifica a conexão com o banco.

```json
{
  "data": {
    "status": "ok",
    "uptime": 128,
    "timestamp": "2026-01-01T12:00:00.000Z",
    "database": "connected"
  }
}
```

Em falha de banco: `503` com `status: "degraded"` e `database: "unavailable"`.

### `GET /`

Metadados básicos da API (nome, versão, ambiente).

---

## Autenticação

### `POST /api/auth/register`

Cria a conta da empresa. A API consulta a BrasilAPI para preencher razão social, endereço,
telefones e atividade econômica. O CNPJ é validado pelo dígito verificador.

**Body**

```json
{
  "cnpj": "11222333000181",
  "email": "financeiro@empresa.com.br",
  "password": "SenhaForte123",
  "name": "Empresa Exemplo",
  "phone1": "11999990000",
  "phone2": "1133334444",
  "legalName": "Empresa Exemplo LTDA",
  "address": "Av. Paulista, 1000, São Paulo - SP",
  "economicActivity": "Comércio varejista"
}
```

Apenas `cnpj`, `email` e `password` são obrigatórios. Campos opcionais sobrescrevem os dados
retornados pela Receita.

**Resposta `201`**

```json
{
  "data": {
    "user": {
      "id": "671f8a9c4f1a2b3c4d5e6f70",
      "name": "Empresa Exemplo",
      "email": "financeiro@empresa.com.br",
      "cnpj": "11222333000181",
      "legalName": "EMPRESA EXEMPLO LTDA",
      "phone1": "11999990000",
      "phone2": null,
      "address": "AV PAULISTA, 1000, Bela Vista, São Paulo - SP, 01310-100",
      "economicActivity": "Comércio varejista...",
      "branchType": null,
      "companySize": null,
      "createdAt": "2026-01-01T12:00:00.000Z",
      "updatedAt": "2026-01-01T12:00:00.000Z",
      "lastLoginAt": "2026-01-01T12:00:00.000Z"
    },
    "token": "eyJhbGciOi..."
  }
}
```

**Erros comuns**

| Status | Código                      | Quando                                      |
| ------ | --------------------------- | ------------------------------------------- |
| 409    | `CNPJ_ALREADY_REGISTERED`   | CNPJ já cadastrado                          |
| 409    | `EMAIL_ALREADY_REGISTERED`  | E-mail já cadastrado                        |
| 422    | `COMPANY_DATA_UNAVAILABLE`  | BrasilAPI indisponível e sem razão social   |
| 422    | `VALIDATION_ERROR`          | CNPJ/e-mail/senha inválidos                 |

### `POST /api/auth/login`

**Body**

```json
{ "cnpj": "11222333000181", "password": "Patrify@2024" }
```

**Resposta `200`**

```json
{
  "data": {
    "user": { "id": "671f8a9c4f1a2b3c4d5e6f70", "name": "Empresa Demonstração", "...": "..." },
    "token": "eyJhbGciOi..."
  }
}
```

Credenciais inválidas: `401 INVALID_CREDENTIALS` com a mesma mensagem para CNPJ inexistente e senha
errada.

### `GET /api/auth/me`

Requer token. Retorna o usuário autenticado no formato acima.

### `POST /api/auth/forgot-password`

**Body**

```json
{ "cnpj": "11222333000181", "email": "demo@patrify.app" }
```

**Resposta `200`** (sempre genérica)

```json
{
  "data": {
    "message": "Se os dados informados estiverem corretos, enviaremos um link de recuperação para o e-mail cadastrado."
  }
}
```

O link enviado aponta para `FRONTEND_URL/recsenha?token=...` e expira em 15 minutos.

### `POST /api/auth/reset-password`

**Body**

```json
{ "token": "eyJhbGciOi...", "password": "NovaSenha123" }
```

**Resposta `200`**

```json
{ "data": { "message": "Senha redefinida com sucesso." } }
```

Erros: `401 TOKEN_EXPIRED`, `401 INVALID_TOKEN`, `400 INVALID_RESET_TOKEN`,
`400 RESET_TOKEN_USED`.

### `PATCH /api/auth/change-password`

Requer token.

**Body**

```json
{ "currentPassword": "SenhaAtual123", "newPassword": "NovaSenha456" }
```

Erros: `401 INVALID_CURRENT_PASSWORD`, `422 WEAK_PASSWORD`, `422 SAME_PASSWORD`.

---

## Usuário

### `GET /api/users/me`

Requer token. Retorna o perfil corporativo completo.

### `PATCH /api/users/me`

Requer token. Atualiza somente os campos enviados.

```json
{
  "name": "Novo nome fantasia",
  "email": "novo@empresa.com.br",
  "phone1": "11988887777",
  "phone2": "",
  "branchType": "Matriz",
  "companySize": "Médio porte"
}
```

Campos aceitos: `name`, `email`, `phone1`, `phone2`, `branchType`, `companySize`.
`cnpj`, `legalName`, `address` e `economicActivity` são somente leitura.

---

## Patrimônios

Todas as rotas exigem token e operam apenas sobre os bens do usuário autenticado.

### `GET /api/patrimonies`

**Query**

| Parâmetro  | Valores                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `page`     | inteiro ≥ 1                                                             |
| `pageSize` | inteiro 1–100                                                           |
| `search`   | nome, serial ou localização (busca case-insensitive)                    |
| `status`   | `Ativo`, `Não ativo`                                                    |
| `category` | `Tecnologia`, `Mobiliário`, `Industrial`, `Transporte`, `Logística`, `Segurança`, `Laboratorial`, `Produção` |
| `condition`| `Novo`, `Excelente`, `Regular`, `Com defeitos`, `Obsoleto`, `Descartado` |
| `minValue` | número ≥ 0                                                              |
| `maxValue` | número ≥ 0                                                              |
| `from`     | data `AAAA-MM-DD`                                                       |
| `to`       | data `AAAA-MM-DD`                                                       |
| `sort`     | `name`, `value`, `purchaseDate`, `createdAt`, `category`, `status`, `condition` |
| `order`    | `asc`, `desc`                                                           |

**Resposta `200`**

```json
{
  "data": [
    {
      "id": "671f8a9c4f1a2b3c4d5e6f71",
      "name": "Notebook Dell Latitude 5440",
      "value": 5899.9,
      "purchaseDate": "2024-01-15",
      "location": "Matriz - TI",
      "status": "Ativo",
      "condition": "Excelente",
      "category": "Tecnologia",
      "serialNumber": "TECHABCD2345",
      "quantity": 1,
      "imageUrl": "http://localhost:3000/uploads/patrimony-1-10-1720000000000.jpg",
      "createdAt": "2026-01-01T12:00:00.000Z",
      "updatedAt": "2026-01-01T12:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 1, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false }
}
```

### `GET /api/patrimonies/summary`

Agrega os indicadores do dashboard.

```json
{
  "data": {
    "totals": {
      "items": 8,
      "active": 5,
      "inactive": 2,
      "discarded": 1,
      "totalValue": 162000,
      "activeValue": 120000,
      "inactiveValue": 27000,
      "discardedValue": 15000
    },
    "byCategory": [{ "category": "Tecnologia", "items": 4, "value": 75000 }],
    "byCondition": [{ "condition": "Excelente", "items": 3 }],
    "valueHistory": [{ "month": "2024-01", "value": 5899.9 }],
    "recent": []
  }
}
```

`valueHistory` é o valor ativo acumulado por mês de aquisição.

### `GET /api/patrimonies/metadata`

Lista categorias, status, condições e campos de ordenação aceitos.

### `POST /api/patrimonies`

**Body**

```json
{
  "name": "Notebook Dell Latitude 5440",
  "value": 5899.9,
  "purchaseDate": "2024-01-15",
  "location": "Matriz - TI",
  "status": "Ativo",
  "condition": "Excelente",
  "category": "Tecnologia",
  "quantity": 1
}
```

`serialNumber` é gerado pelo servidor (prefixo por categoria + 12 caracteres).

**Resposta `201`** com o patrimônio criado.

### `GET /api/patrimonies/:id`

Retorna um patrimônio do usuário ou `404 PATRIMONY_NOT_FOUND`.

### `PATCH /api/patrimonies/:id`

Atualiza apenas os campos enviados. Mesmos tipos do create.

### `DELETE /api/patrimonies/:id`

Soft delete. Resposta `204` sem corpo.

### `POST /api/patrimonies/:id/image`

`multipart/form-data` com o campo `image`.

- Formatos: JPEG, PNG, WEBP
- Tamanho máximo: `MAX_UPLOAD_MB` (padrão 5 MB)
- Com `BLOB_READ_WRITE_TOKEN`, usa Vercel Blob; sem ele, grava em `uploads/` e devolve
  `${BASE_URL}/uploads/...` (URL absoluta; ajuste `BASE_URL` em produção).
- Erros: `400 MISSING_IMAGE`, `400 UNSUPPORTED_IMAGE_TYPE`, `400 FILE_TOO_LARGE`,
  `503 IMAGE_STORAGE_UNAVAILABLE`.

**Resposta `200`** com o patrimônio atualizado (incluindo `imageUrl`).

---

## Descarte

### `POST /api/discard-points/search`

Requer token. Consulta o Google Places com cache de 5 minutos.

**Body**

```json
{
  "material": "eletrônicos",
  "latitude": -23.55052,
  "longitude": -46.633308,
  "radius": 5000
}
```

| Campo       | Regra                          |
| ----------- | ------------------------------ |
| `material`  | 2–80 caracteres                |
| `latitude`  | -90 a 90                       |
| `longitude` | -180 a 180                     |
| `radius`    | 500 a 50.000 (metros), padrão 5000 |

**Resposta `200`**

```json
{
  "data": [
    {
      "id": "ChIJ...",
      "name": "Ecoponto Central",
      "address": "Rua Exemplo, 123 - São Paulo, SP",
      "phone": "(11) 3333-4444",
      "website": "https://ecoponto.exemplo",
      "mapsUrl": "https://maps.google.com/?cid=...",
      "latitude": -23.55,
      "longitude": -46.63,
      "rating": 4.5,
      "userRatingsTotal": 120,
      "openNow": true
    }
  ],
  "meta": { "total": 1, "cached": false }
}
```

Erros: `503 GOOGLE_MAPS_NOT_CONFIGURED`, `503 GOOGLE_MAPS_UNAVAILABLE`,
`503 GOOGLE_MAPS_ERROR`.

---

## Códigos de erro

| Código                      | Status | Significado                                      |
| --------------------------- | ------ | ------------------------------------------------ |
| `VALIDATION_ERROR`          | 422    | Body/query/params inválidos                      |
| `INVALID_CREDENTIALS`       | 401    | CNPJ ou senha incorretos                         |
| `MISSING_TOKEN`             | 401    | Header Authorization ausente                     |
| `INVALID_TOKEN`             | 401    | Token inválido ou propósito incorreto            |
| `TOKEN_EXPIRED`             | 401    | Token expirado                                   |
| `INVALID_CURRENT_PASSWORD`  | 401    | Senha atual incorreta                            |
| `WEAK_PASSWORD`             | 422    | Nova senha fora da política                      |
| `SAME_PASSWORD`             | 422    | Nova senha igual à atual                         |
| `INVALID_RESET_TOKEN`       | 400    | Token de reset não corresponde ao usuário        |
| `RESET_TOKEN_USED`          | 400    | Token de reset já utilizado                      |
| `CNPJ_ALREADY_REGISTERED`   | 409    | CNPJ já cadastrado                               |
| `EMAIL_ALREADY_REGISTERED`  | 409    | E-mail já cadastrado                             |
| `COMPANY_DATA_UNAVAILABLE`  | 422    | Dados do CNPJ indisponíveis                      |
| `PATRIMONY_NOT_FOUND`       | 404    | Patrimônio inexistente ou de outro usuário       |
| `USER_NOT_FOUND`            | 404    | Usuário inexistente                              |
| `DUPLICATE_RESOURCE`        | 409    | Violação de unicidade no banco                   |
| `FOREIGN_KEY_VIOLATION`     | 409    | Violação de vínculo                              |
| `INVALID_INPUT_SYNTAX`      | 400    | Formato inválido no banco                        |
| `MISSING_IMAGE`             | 400    | Upload sem arquivo `image`                       |
| `UNSUPPORTED_IMAGE_TYPE`    | 400    | Arquivo não é JPEG, PNG ou WEBP                  |
| `IMAGE_STORAGE_UNAVAILABLE` | 503    | Falha ao gravar a imagem no Vercel Blob          |
| `FILE_TOO_LARGE`            | 400    | Upload acima do limite                           |
| `INVALID_JSON`              | 400    | Corpo JSON malformado                            |
| `ROUTE_NOT_FOUND`           | 404    | Rota inexistente                                 |
| `RATE_LIMITED`              | 429    | Limite global excedido                           |
| `LOGIN_RATE_LIMITED`        | 429    | Muitas tentativas de login                       |
| `RECOVERY_RATE_LIMITED`     | 429    | Muitas recuperações de senha                     |
| `GOOGLE_MAPS_NOT_CONFIGURED`| 503    | Falta `GOOGLE_MAPS_API_KEY`                      |
| `GOOGLE_MAPS_UNAVAILABLE`   | 503    | Falha de rede na Places API                      |
| `GOOGLE_MAPS_ERROR`         | 503    | Resposta inesperada da Places API                |
| `INTERNAL_ERROR`            | 500    | Erro não tratado                                 |
