#!/bin/bash

echo "🚀 CRM Kanban - Setup Script"
echo "================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker e Docker Compose detectados"
echo ""

# Check if .env files exist
if [ ! -f backend/.env ]; then
    echo "📝 Criando arquivo backend/.env..."
    cp backend/.env.example backend/.env
    echo "⚠️  Por favor, edite backend/.env com suas configurações"
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Criando arquivo frontend/.env..."
    cp frontend/.env.example frontend/.env
fi

echo ""
echo "🐳 Iniciando containers Docker..."
docker-compose up -d

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 5

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📍 Acessos:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/health"
echo ""
echo "🔑 Credenciais de teste:"
echo "   Super Admin: admin@crm.com / admin123456"
echo "   Cliente Admin: admin@demo.com / demo123456"
echo "   Cliente User: user@demo.com / user123456"
echo ""
echo "📚 Para mais informações, leia o README.md"
