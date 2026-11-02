# FinançasApp — Backend

API REST do FinançasApp, feita com **NestJS**, **Prisma**, **PostgreSQL** e **Redis**. Ela conecta contas bancárias pelo Open Finance usando a **Pluggy**.

## Tecnologias

- [NestJS](https://nestjs.com/) + TypeScript
- [Prisma ORM](https://www.prisma.io/) + PostgreSQL
- Redis (sessões e refresh tokens)
- JWT + Passport (autenticação)
- [Pluggy](https://pluggy.ai/) (Open Finance)

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16 (porta `5432`)
- Redis 7 (porta `6379`)
- Conta na Pluggy (Client ID e Client Secret)

## Como rodar

### 1. Clonar e instalar

```bash
git clone https://github.com/julialaitharth/financas-app.git
cd financas-app
npm install
```

### 2. Subir o banco e o Redis (Docker)

```bash
docker run -d --name financas-db -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=financas \
  postgres:16

docker run -d --name financas-redis -p 6379:6379 redis:7
```

### 3. Configurar o `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/financas"
REDIS_URL="redis://localhost:6379"

JWT_SECRET="troque-isto"
JWT_REFRESH_SECRET="troque-isto-tambem"

PLUGGY_CLIENT_ID="seu-client-id"
PLUGGY_CLIENT_SECRET="seu-client-secret"
```

### 4. Rodar as migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Iniciar

```bash
npm run start:dev
```

## Endpoints

### Auth: `/auth`
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/cadastro` | Cria um usuário |
| POST | `/auth/login` | Faz login e retorna os tokens |
| POST | `/auth/refresh` | Renova o access token |
| POST | `/auth/esqueci-senha` | Envia o link de recuperação de senha |
| POST | `/auth/redefinir-senha` | Redefine a senha |
| POST | `/auth/logout` | Encerra a sessão |
| PATCH | `/auth/biometria` | Ativa ou desativa a biometria |

### Usuários: `/usuarios`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/usuarios/me` | Dados do usuário logado |

### Pluggy: `/pluggy`
| Método | Rota | Descrição |
|---|---|---|
| POST | `/pluggy/connect-token` | Gera o token do Pluggy Connect |
| POST | `/pluggy/items` | Registra uma conexão bancária |
| POST | `/pluggy/consentimentos/:id/sync` | Sincroniza os dados de uma conexão |
| GET | `/pluggy/contas` | Lista as contas conectadas |
| GET | `/pluggy/transacoes` | Lista as transações |

## 📁 Estrutura

```
src/
├── main.ts
├── app.module.ts
├── prisma/          # PrismaService
├── redis/           # RedisModule
└── modules/
    ├── auth/
    ├── usuarios/
    └── pluggy/
prisma/
├── schema.prisma
└── migrations/
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run start:dev` | Modo desenvolvimento (watch) |
| `npm run build` | Gera o build de produção |
| `npm run start:prod` | Roda o build |
| `npx prisma studio` | Abre a interface visual do banco |

## Licença

MIT
