# Nutri-Vision Web

SaaS de análise nutricional de refeições por IA. Fotografe sua refeição e receba análise completa de calorias, macronutrientes e sugestões de melhoria.

## URLs de Produção

- **App:** https://nutrivision.ai8hub.com
- **API:** https://nutrivision-api-dcr0.onrender.com
- **Docs:** https://nutrivision-api-dcr0.onrender.com/docs

## Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, PostgreSQL, OpenAI GPT-4o/DALL-E 3
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Pagamentos:** ASAAS (PIX, Cartão, Boleto)
- **Monetização:** Google AdSense (usuários FREE)

## Configuração Local

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Configurar .env com as variáveis necessárias
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
# Configurar .env.local
npm run dev
```

## Variáveis de Ambiente

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host/db
SECRET_KEY=chave-secreta-jwt
OPENAI_API_KEY=sk-xxx
ASAAS_API_KEY=xxx
ASAAS_ENVIRONMENT=production
FRONTEND_URL=https://nutrivision.ai8hub.com
BACKEND_URL=https://nutrivision-api-dcr0.onrender.com
RESEND_API_KEY=re_xxx
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://nutrivision-api-dcr0.onrender.com
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxx
```

## Deploy

### Backend (Render)
1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Runtime: Python 3.11 (via runtime.txt)
4. **Após deploy:** Acessar `/run-migration` para criar tabelas

### Frontend (Vercel)
1. Conectar repositório GitHub
2. Root Directory: `frontend`
3. Configurar variáveis de ambiente

## Funcionalidades

### Tipos de Análise
- **Rápida (Grátis):** Calorias, macros e observações
- **Completa (12 créditos):** + Sugestão visual balanceada com imagem gerada por IA

### Tipos de Refeição
- **Prato:** Analisa apenas a comida (ignora bebidas/sobremesas)
- **Sobremesa:** Analisa apenas a sobremesa
- **Bebida:** Analisa apenas a bebida

### Campos Opcionais
- **Observações:** Descrição dos ingredientes
- **Peso (g):** Para pratos e sobremesas
- **Volume (ml):** Para bebidas

### Monetização
- **Pacotes de Créditos:** 12, 36, 60 ou 120 créditos
- **Assinatura PRO:** R$ 49,90/mês (sem ads, análises ilimitadas)
- **AdSense:** Propagandas para usuários FREE

### Sistema de Indicação
- Código único por usuário
- 12 créditos para quem indica

## Documentação Completa

Ver [DOCUMENTATION.md](./DOCUMENTATION.md) para documentação técnica detalhada.

## Usuário de Teste

```bash
curl -X POST https://nutrivision-api-dcr0.onrender.com/auth/create-test-user
```

- Email: `teste@nutrivision.com`
- Senha: `teste123`
- Créditos: 100.000
