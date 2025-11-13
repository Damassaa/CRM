# Quick Start - CRM Kanban

## 🚀 Início Rápido (5 minutos)

### Opção 1: Docker (Recomendado)

```bash
# 1. Clone o repositório
git clone <repository-url>
cd CRM

# 2. Execute o script de setup
./setup.sh

# 3. Aguarde os containers iniciarem (30-60 segundos)
# Acompanhe os logs:
docker-compose logs -f

# 4. Acesse a aplicação
# Frontend: http://localhost:3000
# Backend: http://localhost:3001/health
```

### Opção 2: Instalação Manual

```bash
# 1. Clone e entre no diretório
git clone <repository-url>
cd CRM

# 2. Backend
cd backend
npm install
cp .env.example .env
# Edite .env se necessário

# Inicie PostgreSQL e Redis (ou use Docker):
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15-alpine
docker run -d -p 6379:6379 redis:7-alpine

# Execute migrations e seed
npx prisma generate
npx prisma migrate dev
npm run prisma:seed

# Inicie o backend
npm run dev

# 3. Frontend (em outro terminal)
cd ../frontend
npm install
cp .env.example .env
npm start
```

## 🔑 Login

### Credenciais Padrão

**Super Admin:**
- URL: http://localhost:3000/super-admin/login
- Email: `admin@crm.com`
- Senha: `admin123456`

**Cliente Demo - Admin:**
- URL: http://localhost:3000/login
- Email: `admin@demo.com`
- Senha: `demo123456`

**Cliente Demo - Usuário:**
- URL: http://localhost:3000/login
- Email: `user@demo.com`
- Senha: `user123456`

## ✅ Verificação

### 1. Backend está rodando?

```bash
curl http://localhost:3001/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### 2. Frontend está acessível?

Abra http://localhost:3000 no navegador.

### 3. Banco de dados está populado?

```bash
# Via Docker
docker-compose exec backend npx prisma studio

# Ou conecte diretamente ao PostgreSQL:
# Host: localhost
# Port: 5432
# Database: crm_kanban
# User: postgres
# Password: postgres
```

## 📝 Primeiros Passos

### Como Usuário Normal

1. Faça login com `admin@demo.com` / `demo123456`
2. Você verá o board Kanban com colunas e alguns leads de exemplo
3. **Crie um lead:** Clique em "+ Adicionar Lead" em qualquer coluna
4. **Mova um lead:** Arraste e solte um card entre colunas
5. **Veja detalhes:** Clique em um card (em desenvolvimento)

### Como Super Admin

1. Faça login com `admin@crm.com` / `admin123456`
2. Vá para "Gerenciar Clientes"
3. **Criar novo cliente:**
   - Clique em "Criar Cliente"
   - Preencha os dados
   - Copie o link de convite do admin
   - O admin poderá acessar e configurar a conta

## 🛠️ Comandos Úteis

### Docker

```bash
# Ver logs
docker-compose logs -f

# Reiniciar serviços
docker-compose restart

# Parar tudo
docker-compose down

# Limpar tudo (CUIDADO: apaga dados)
docker-compose down -v

# Rebuild
docker-compose up -d --build
```

### Backend

```bash
cd backend

# Desenvolvimento
npm run dev

# Build
npm run build

# Migrations
npm run prisma:migrate
npm run prisma:generate

# Seed (recriar dados de teste)
npm run prisma:seed

# Prisma Studio (GUI)
npm run prisma:studio
```

### Frontend

```bash
cd frontend

# Desenvolvimento
npm start

# Build
npm run build

# Test
npm test
```

## 🔧 Troubleshooting

### Porta já em uso

Se as portas 3000, 3001, 5432 ou 6379 já estão em uso:

```bash
# Encontre o processo
lsof -ti:3000  # ou 3001, 5432, 6379

# Mate o processo
kill -9 <PID>

# Ou altere as portas no docker-compose.yml
```

### Backend não conecta ao banco

```bash
# Verifique se o PostgreSQL está rodando
docker-compose ps

# Verifique a conexão
docker-compose exec postgres psql -U postgres -d crm_kanban -c "SELECT 1;"

# Recrie o banco
docker-compose down -v
docker-compose up -d
```

### Frontend não carrega

```bash
# Limpe cache do npm
cd frontend
rm -rf node_modules package-lock.json
npm install

# Ou via Docker
docker-compose down
docker-compose up -d --build frontend
```

### Prisma errors

```bash
cd backend

# Regenere o cliente
npx prisma generate

# Reset database (CUIDADO: apaga dados)
npx prisma migrate reset

# Sincronize schema
npx prisma db push
```

### Erro de autenticação

- Verifique se o JWT_SECRET no `.env` tem pelo menos 32 caracteres
- Limpe os tokens no localStorage do navegador (F12 → Application → Local Storage)
- Tente fazer logout e login novamente

## 🐛 Debug

### Ver logs detalhados

```bash
# Backend logs
docker-compose logs -f backend

# Ver todas as queries SQL
# Edite backend/.env:
# Descomente a linha de log do Prisma no src/config/database.ts
```

### Testar API diretamente

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"demo123456"}'

# Guardar token
TOKEN="seu_access_token_aqui"

# Listar leads
curl http://localhost:3001/api/v1/leads/kanban \
  -H "Authorization: Bearer $TOKEN"
```

## 📚 Próximos Passos

1. ✅ Explore a interface Kanban
2. ✅ Crie e mova leads
3. ✅ Teste os diferentes níveis de acesso
4. 📖 Leia a [Documentação Completa](README.md)
5. 📖 Explore a [API Documentation](API.md)
6. 🔧 Customize para suas necessidades

## 💡 Dicas

- Use o **Prisma Studio** para visualizar o banco: `npm run prisma:studio`
- Ative **React DevTools** para debugar o frontend
- Use **Postman** ou **Insomnia** para testar a API
- Logs do backend aparecem no terminal/Docker logs
- Erros do frontend aparecem no console do navegador (F12)

## 🆘 Precisa de Ajuda?

- 📖 Leia o [README.md](README.md) completo
- 📖 Consulte a [API.md](API.md)
- 🐛 Abra uma issue no GitHub
- 💬 Entre em contato com o suporte

---

**Pronto para começar?** Execute `./setup.sh` e abra http://localhost:3000! 🚀
