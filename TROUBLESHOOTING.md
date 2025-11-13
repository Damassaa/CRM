# Troubleshooting Guide - CRM Kanban

## 🔧 Problemas Comuns e Soluções

### Backend não inicia - Erro de Prisma JSON

**Sintoma:**
```
Could not parse schema engine response: SyntaxError: Unexpected token 'E', "Error load"... is not valid JSON
```

**Causa:** Prisma tentando migrar antes do PostgreSQL estar completamente pronto.

**Solução Aplicada:**
1. ✅ Adicionado OpenSSL ao Dockerfile: `RUN apk add --no-cache openssl openssl-dev libc6-compat`
2. ✅ Criado script robusto `start.sh` com retries e fallback para `db push`
3. ✅ Implementado `depends_on` com `condition: service_healthy` no docker-compose
4. ✅ Adicionado wait adicional de 5s no script de start

**Como Testar:**
```bash
docker-compose down -v
docker-compose up --build
```

---

### Frontend não inicia - Erro ajv/dist/compile/codegen

**Sintoma:**
```
Cannot find module 'ajv/dist/compile/codegen'
require stack:
- /app/node_modules/ajv-keywords/dist/definitions/typeof.js
```

**Causa:** Conflito entre versões de `ajv` e `ajv-keywords` após usar `--legacy-peer-deps`.

**Solução Aplicada:**
1. ✅ Adicionado `resolutions` e `overrides` no package.json:
   ```json
   "resolutions": {
     "ajv": "^8.12.0",
     "ajv-keywords": "^5.1.0"
   }
   ```
2. ✅ Atualizado Dockerfile para instalar versões específicas:
   ```dockerfile
   RUN npm install ajv@^8.12.0 ajv-keywords@^5.1.0 --save-dev --legacy-peer-deps
   ```
3. ✅ Limpeza de node_modules no build

**Como Testar:**
```bash
docker-compose down
docker-compose build frontend --no-cache
docker-compose up frontend
```

---

### Aviso OpenSSL no Backend

**Sintoma:**
```
prisma:warn Prisma failed to detect the libssl/openssl version to use
```

**Causa:** Alpine Linux não vem com OpenSSL instalado por padrão.

**Solução Aplicada:**
✅ Adicionado ao backend/Dockerfile:
```dockerfile
RUN apk add --no-cache openssl openssl-dev libc6-compat
```

---

### Containers em Loop de Restart

**Sintomas:**
- Backend reinicia constantemente
- Logs mostram erros repetidos de conexão
- Frontend não consegue conectar ao backend

**Soluções:**

#### 1. Limpar Tudo e Reconstruir
```bash
# Parar e remover tudo
docker-compose down -v

# Limpar cache do Docker
docker system prune -a --volumes

# Reconstruir sem cache
docker-compose build --no-cache

# Iniciar
docker-compose up
```

#### 2. Verificar Logs Individuais
```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# PostgreSQL
docker-compose logs -f postgres
```

#### 3. Testar Conexão com Banco
```bash
# Conectar ao PostgreSQL
docker-compose exec postgres psql -U postgres -d crm_kanban

# Verificar tabelas
\dt

# Sair
\q
```

---

### Porta Já em Uso

**Sintoma:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Solução:**
```bash
# Encontrar processo usando a porta
lsof -ti:3000  # ou 3001, 5432, 6379

# Matar o processo
kill -9 <PID>

# Ou alterar portas no docker-compose.yml
```

---

### Erro de Permissão em Scripts

**Sintoma:**
```
sh: /app/start.sh: Permission denied
```

**Solução:**
```bash
# Tornar scripts executáveis
chmod +x backend/start.sh backend/wait-for-db.sh

# Reconstruir
docker-compose build backend
docker-compose up backend
```

---

### Frontend com "Module not found"

**Sintoma:**
```
Module not found: Error: Can't resolve 'date-fns/locale'
```

**Solução:**
```bash
# Entrar no container
docker-compose exec frontend sh

# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Ou reconstruir o container
docker-compose build frontend --no-cache
```

---

### Banco de Dados Corrompido

**Sintoma:**
- Erros de constraint violation
- Dados inconsistentes
- Migrations falhando

**Solução:**
```bash
# Reset completo do banco (CUIDADO: apaga todos os dados!)
docker-compose down -v

# Remover volume do postgres manualmente
docker volume rm crm_postgres_data

# Recriar tudo
docker-compose up --build
```

---

### Prisma Client Out of Sync

**Sintoma:**
```
Prisma Client could not locate the Query Engine for runtime
```

**Solução:**
```bash
# Regenerar Prisma Client
docker-compose exec backend npx prisma generate

# Ou reconstruir backend
docker-compose build backend --no-cache
```

---

## 🛠️ Comandos Úteis

### Ver Status dos Containers
```bash
docker-compose ps
```

### Ver Logs em Tempo Real
```bash
docker-compose logs -f
```

### Reiniciar Serviço Específico
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Entrar no Container
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec postgres psql -U postgres
```

### Verificar Uso de Recursos
```bash
docker stats
```

### Limpar Tudo (Reset Total)
```bash
# CUIDADO: Apaga TUDO!
docker-compose down -v
docker system prune -a --volumes
rm -rf backend/node_modules frontend/node_modules
docker-compose up --build
```

---

## 🐛 Debug Avançado

### Backend não conecta ao PostgreSQL

```bash
# 1. Verificar se PostgreSQL está rodando
docker-compose ps postgres

# 2. Testar conexão manualmente
docker-compose exec backend sh
nc -zv postgres 5432

# 3. Verificar DATABASE_URL
docker-compose exec backend env | grep DATABASE_URL

# 4. Testar query direta
docker-compose exec postgres psql -U postgres -d crm_kanban -c "SELECT 1;"
```

### Frontend não carrega no Navegador

```bash
# 1. Verificar se está rodando
docker-compose ps frontend

# 2. Ver logs detalhados
docker-compose logs frontend | tail -100

# 3. Testar porta
curl http://localhost:3000

# 4. Verificar variáveis de ambiente
docker-compose exec frontend env | grep REACT_APP
```

### Migrations Falhando

```bash
# 1. Verificar status das migrations
docker-compose exec backend npx prisma migrate status

# 2. Forçar push do schema (desenvolvimento)
docker-compose exec backend npx prisma db push --skip-generate

# 3. Reset migrations (CUIDADO: apaga dados!)
docker-compose exec backend npx prisma migrate reset

# 4. Criar nova migration
docker-compose exec backend npx prisma migrate dev --name fix_schema
```

---

## 📋 Checklist de Verificação

Antes de reportar um problema, verifique:

- [ ] Docker e Docker Compose estão instalados e atualizados
- [ ] Portas 3000, 3001, 5432 e 6379 estão livres
- [ ] Arquivos `.env` existem e estão corretos
- [ ] Você rodou `docker-compose down -v` antes de tentar novamente
- [ ] Você tentou rebuild com `--no-cache`
- [ ] Logs não mostram erros óbvios de sintaxe
- [ ] Há espaço em disco suficiente (mínimo 5GB)
- [ ] Você está na raiz do projeto ao executar comandos

---

## 🆘 Ainda com Problemas?

1. **Colete informações:**
   ```bash
   docker-compose ps > status.txt
   docker-compose logs > logs.txt
   docker version >> logs.txt
   docker-compose version >> logs.txt
   ```

2. **Limpe tudo e tente novamente:**
   ```bash
   ./setup.sh
   ```

3. **Reporte o problema:**
   - Abra uma issue no GitHub
   - Inclua os arquivos de log
   - Descreva o que você tentou
   - Informe seu sistema operacional

---

## 💡 Dicas de Prevenção

1. **Sempre use docker-compose down -v** antes de fazer mudanças grandes
2. **Commit suas mudanças** antes de experimentar
3. **Mantenha backups** do banco de dados em produção
4. **Monitore logs** regularmente com `docker-compose logs -f`
5. **Atualize dependências** com cuidado, testando uma por vez
6. **Use volumes nomeados** (já configurado) para persistência
7. **Configure limites de recursos** no docker-compose para produção

---

**Última atualização:** 2025-01-13
**Versão:** 1.0.1 (Correções aplicadas)
