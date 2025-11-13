# CRM Multi-Tenant Estilo Kanban

Sistema SaaS de CRM com interface Kanban (similar ao Trello) para gerenciamento de leads e processos comerciais, com arquitetura multi-tenant.

![Status](https://img.shields.io/badge/status-MVP%20v1.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Arquitetura](#arquitetura)
- [API](#api)
- [Credenciais de Teste](#credenciais-de-teste)
- [Roadmap](#roadmap)

## 🎯 Sobre o Projeto

CRM Multi-Tenant desenvolvido para ser vendido como solução white-label para clientes B2B. Permite que empresas gerenciem seus leads em um board Kanban intuitivo, com sistema completo de permissões e isolamento de dados.

### ✨ Funcionalidades Principais (FASE 1 - MVP)

✅ **Autenticação e Permissões**
- Login com JWT + refresh tokens
- Três níveis de acesso: Super Admin, Admin Cliente, Usuário
- Sistema de permissões granular

✅ **Multi-Tenancy**
- Isolamento completo de dados entre clientes
- Schema isolado no PostgreSQL por tenant
- Gerenciamento de limites (usuários, leads, pipelines)

✅ **Painel Super Admin**
- CRUD completo de clientes (tenants)
- Visualização de métricas globais
- Gerenciamento de planos e limites

✅ **Kanban Board**
- Interface drag & drop intuitiva
- Colunas personalizáveis com cores e ícones
- Contadores em tempo real

✅ **Gestão de Leads**
- CRUD completo com validações
- Campos customizáveis (preparado para extensão)
- Tags e categorização
- Atribuição de responsáveis
- Histórico de movimentações
- Sistema de atividades

✅ **API REST**
- Documentação completa
- Rate limiting
- Autenticação via API Key (preparado)
- Suporte a webhooks (preparado)

## 🛠️ Tecnologias

### Backend
- **Node.js** + **TypeScript**
- **Express** - Framework web
- **Prisma** - ORM
- **PostgreSQL** - Banco de dados
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Zod** - Validação de dados

### Frontend
- **React 18** + **TypeScript**
- **Tailwind CSS** - Estilização
- **@dnd-kit** - Drag and Drop
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Roteamento

### DevOps
- **Docker** + **Docker Compose**
- **Prisma Migrations**
- Git para versionamento

## 📦 Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- PostgreSQL 15+ (ou via Docker)
- Git

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd CRM
```

### 2. Configure as variáveis de ambiente

```bash
# Backend
cp backend/.env.example backend/.env
# Edite backend/.env conforme necessário

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Inicie com Docker Compose (Recomendado)

```bash
docker-compose up -d
```

Isso irá:
- Criar o banco de dados PostgreSQL
- Iniciar o Redis
- Executar migrations do Prisma
- Criar o Super Admin e tenant demo
- Iniciar o backend na porta 3001
- Iniciar o frontend na porta 3000

### 4. Ou instale manualmente

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm start
```

## 💻 Como Usar

### Acessando a Aplicação

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Health:** http://localhost:3001/health

### 🔑 Credenciais de Teste

#### Super Admin (Gerenciamento do Sistema)
```
Email: admin@crm.com
Senha: admin123456
URL: http://localhost:3000/super-admin/login
```

#### Cliente Demo - Admin
```
Email: admin@demo.com
Senha: demo123456
URL: http://localhost:3000/login
```

#### Cliente Demo - Usuário
```
Email: user@demo.com
Senha: user123456
URL: http://localhost:3000/login
```

### Fluxo Básico de Uso

1. **Super Admin:**
   - Login em `/super-admin/login`
   - Criar novo cliente (tenant)
   - Copiar link de convite do admin
   - Configurar limites e plano

2. **Admin do Cliente:**
   - Aceitar convite e definir senha
   - Convidar usuários da equipe
   - Configurar colunas do Kanban
   - Gerenciar permissões

3. **Usuário:**
   - Login com credenciais
   - Criar e movimentar leads no Kanban
   - Adicionar atividades e comentários
   - Gerenciar leads conforme permissões

## 🏗️ Arquitetura

### Estrutura de Pastas

```
CRM/
├── backend/
│   ├── src/
│   │   ├── config/          # Configurações (DB, env)
│   │   ├── middlewares/     # Auth, rate-limit, tenant
│   │   ├── modules/         # Módulos da aplicação
│   │   │   ├── auth/        # Autenticação
│   │   │   ├── tenants/     # Super Admin - Tenants
│   │   │   ├── users/       # Gestão de usuários
│   │   │   ├── leads/       # CRUD de leads
│   │   │   ├── columns/     # Colunas do Kanban
│   │   │   └── ...
│   │   ├── shared/          # Utils, types, errors
│   │   └── server.ts        # Servidor Express
│   ├── prisma/
│   │   ├── schema.prisma    # Schema do banco
│   │   └── seed.ts          # Seeds iniciais
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   │   ├── ui/          # Botões, inputs
│   │   │   ├── layout/      # Header, Sidebar
│   │   │   └── kanban/      # Board, Column, Card
│   │   ├── pages/           # Páginas
│   │   ├── services/        # API client
│   │   ├── store/           # Zustand stores
│   │   └── App.tsx
│   └── package.json
│
└── docker-compose.yml
```

### Multi-Tenancy

O sistema implementa **multi-tenancy por schema** no PostgreSQL:

- Cada tenant tem um `schemaName` único
- Dados completamente isolados
- Migrations automáticas para novos tenants
- Middleware identifica tenant pelo token JWT

### Fluxo de Autenticação

```
1. Login → POST /api/v1/auth/login
2. Backend valida credenciais
3. Retorna accessToken (15min) + refreshToken (7d)
4. Frontend armazena tokens no localStorage
5. Todas requisições incluem: Authorization: Bearer {token}
6. Token expira → /auth/refresh com refreshToken
```

## 🌐 API

### Base URL

```
http://localhost:3001/api/v1
```

### Endpoints Principais

#### Autenticação

```http
POST   /auth/login                    # Login de usuário
POST   /auth/super-admin/login        # Login de super admin
POST   /auth/refresh                  # Renovar token
POST   /auth/logout                   # Logout
GET    /auth/me                       # Dados do usuário atual
POST   /auth/password/request-reset   # Solicitar reset de senha
POST   /auth/password/reset           # Resetar senha
```

#### Super Admin - Tenants

```http
GET    /super-admin/tenants           # Listar tenants
GET    /super-admin/tenants/:id       # Detalhes do tenant
POST   /super-admin/tenants           # Criar tenant
PATCH  /super-admin/tenants/:id       # Atualizar tenant
DELETE /super-admin/tenants/:id       # Deletar tenant
GET    /super-admin/tenants/stats     # Estatísticas globais
```

#### Leads

```http
GET    /leads                         # Listar leads (com filtros)
GET    /leads/kanban                  # Board Kanban completo
GET    /leads/:id                     # Detalhes do lead
POST   /leads                         # Criar lead
PATCH  /leads/:id                     # Atualizar lead
DELETE /leads/:id                     # Deletar lead
POST   /leads/:id/move                # Mover lead entre colunas
GET    /leads/:id/activities          # Atividades do lead
POST   /leads/:id/activities          # Adicionar atividade
GET    /leads/:id/history             # Histórico de mudanças
```

#### Colunas

```http
GET    /columns                       # Listar colunas
POST   /columns                       # Criar coluna (admin)
PATCH  /columns/:id                   # Atualizar coluna (admin)
DELETE /columns/:id                   # Deletar coluna (admin)
POST   /columns/reorder               # Reordenar colunas (admin)
```

#### Usuários

```http
GET    /users                         # Listar usuários (admin)
POST   /users                         # Convidar usuário (admin)
PATCH  /users/:id                     # Atualizar usuário (admin)
DELETE /users/:id                     # Deletar usuário (admin)
POST   /users/:id/resend-invite       # Reenviar convite (admin)
```

### Exemplo de Request

```bash
# Criar Lead
curl -X POST http://localhost:3001/api/v1/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(62) 99999-9999",
    "company": "Empresa XYZ",
    "estimatedValue": 5000,
    "columnId": "uuid-da-coluna",
    "tags": ["urgente", "vip"]
  }'
```

### Formato de Resposta

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "João Silva",
    ...
  }
}
```

### Erros

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email inválido",
    "details": { ... }
  }
}
```

## 🗄️ Banco de Dados

### Principais Tabelas

- **tenants** - Clientes do sistema
- **super_admins** - Super administradores
- **users** - Usuários dos tenants
- **columns** - Colunas do Kanban
- **leads** - Leads (cards)
- **activities** - Atividades nos leads
- **lead_history** - Histórico de mudanças
- **audit_logs** - Logs de auditoria
- **api_keys** - Chaves de API

### Migrations

```bash
# Criar nova migration
npm run prisma:migrate

# Aplicar migrations
npx prisma migrate deploy

# Reset database (desenvolvimento)
npx prisma migrate reset
```

## 🔐 Segurança

- ✅ Senhas hasheadas com bcrypt (12 rounds)
- ✅ JWT com expiração curta + refresh tokens
- ✅ Rate limiting (100 req/min por IP)
- ✅ CORS configurado
- ✅ Helmet.js para headers de segurança
- ✅ Validação de input com Zod
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Isolamento completo de dados entre tenants

## 📊 Logs e Auditoria

Todas as ações importantes são logadas na tabela `audit_logs`:

- Login/Logout
- CRUD de leads, colunas, usuários
- Movimentação de leads
- Alterações de configuração

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🚀 Deploy

### Docker (Produção)

```bash
# Build
docker-compose -f docker-compose.prod.yml build

# Run
docker-compose -f docker-compose.prod.yml up -d
```

### Variáveis de Ambiente (Produção)

Lembre-se de alterar:
- `JWT_SECRET` (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET` (mínimo 32 caracteres)
- `DATABASE_URL` (conexão segura)
- `SUPER_ADMIN_PASSWORD` (senha forte)
- `FRONTEND_URL` (URL de produção)
- Configurações de SMTP para emails

## 📈 Roadmap

### ✅ FASE 1 - MVP (Concluído)
- [x] Setup do projeto
- [x] Autenticação
- [x] Multi-tenancy
- [x] Painel Super Admin
- [x] Kanban básico com drag & drop
- [x] CRUD de Leads e Colunas

### 🔄 FASE 2 - Features Essenciais (Próximo)
- [ ] Campos customizados do lead
- [ ] Modal de detalhes completo
- [ ] Sistema de atividades/comentários
- [ ] Filtros e busca avançada

### 🔮 FASE 3 - Integrações
- [ ] API REST completa com API Keys
- [ ] Webhooks de saída
- [ ] Documentação Swagger

### 🌟 FASE 4 - Automações e Analytics
- [ ] Sistema de automações
- [ ] Dashboard de métricas
- [ ] Relatórios e funil de vendas

### 💎 Futuro (V2)
- [ ] Importação CSV
- [ ] Integração com WhatsApp
- [ ] Integração com email (IMAP/SMTP)
- [ ] Campos de fórmula
- [ ] Visualização em lista/tabela
- [ ] Multi-idioma (i18n)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autores

Desenvolvido com ❤️ para empresas que precisam gerenciar seus leads de forma eficiente.

## 📞 Suporte

Para dúvidas ou suporte:
- Abra uma issue no GitHub
- Entre em contato via email

---

**Nota:** Este é um MVP da FASE 1. Novas funcionalidades serão adicionadas nas próximas fases conforme o roadmap.
