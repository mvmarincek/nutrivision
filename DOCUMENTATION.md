# NUTRI-VISION WEB - Documentação Técnica Completa

## Visão Geral

**Nutri-Vision Web** é um SaaS de análise nutricional de refeições por IA. O usuário fotografa sua refeição e recebe análise completa de calorias, macronutrientes, benefícios, pontos de atenção e sugestões de melhoria.

### URLs de Produção
- **Frontend (Vercel):** https://nutrivision.ai8hub.com
- **Backend (Render):** https://nutrivision-api-dcr0.onrender.com
- **Repositório:** https://github.com/mvmarincek/nutrivision.git

---

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   PostgreSQL    │
│   Next.js 14    │     │   FastAPI       │     │   (Render)      │
│   (Vercel)      │     │   (Render)      │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                │
                        ┌───────┴───────┐
                        │               │
                        ▼               ▼
               ┌─────────────┐  ┌─────────────┐
               │  OpenAI API │  │   ASAAS     │
               │  GPT-4o     │  │  Pagamentos │
               │  DALL-E 3   │  │             │
               └─────────────┘  └─────────────┘
```

---

## Stack Tecnológica

### Backend
- **Python 3.11** (obrigatório - versões superiores causam incompatibilidade)
- **FastAPI** - Framework web assíncrono
- **SQLAlchemy 2.0** - ORM com suporte async
- **asyncpg** - Driver PostgreSQL assíncrono
- **OpenAI SDK** - Chamadas para GPT-4o e DALL-E 3
- **bcrypt** - Hash de senhas
- **python-jose** - JWT tokens
- **Pillow** - Processamento de imagens
- **ASAAS** - Gateway de pagamentos (PIX, Cartão, Boleto)

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **browser-image-compression** - Compressão de imagens no cliente
- **Google AdSense** - Monetização com anúncios (apenas usuários FREE)

---

## Estrutura de Diretórios

```
nutrivision/
├── backend/
│   ├── app/
│   │   ├── agents/                 # Sistema multiagente IA
│   │   │   ├── food_recognizer.py  # GPT-4o - identifica alimentos (focado por tipo)
│   │   │   ├── portion_estimator.py # GPT-4o - estima porções
│   │   │   ├── nutrition_calculator.py # Calcula calorias/macros
│   │   │   ├── health_advisor.py   # GPT-4o-mini - orientações
│   │   │   ├── meal_optimizer.py   # GPT-4o-mini - versão melhorada (focado por tipo)
│   │   │   ├── image_generator.py  # DALL-E 3 - imagem sugerida
│   │   │   ├── orchestrator.py     # Coordena todos os agentes
│   │   │   └── json_utils.py       # Utilitário para parse seguro de JSON
│   │   ├── api/routes/
│   │   │   ├── auth.py             # Registro, login, verificação email
│   │   │   ├── profile.py          # CRUD perfil do usuário + avatar
│   │   │   ├── meals.py            # Upload, análise, histórico
│   │   │   ├── jobs.py             # Status de jobs assíncronos
│   │   │   ├── billing.py          # ASAAS pagamentos (PIX, cartão, boleto)
│   │   │   ├── credits.py          # Saldo de créditos
│   │   │   └── feedback.py         # Sugestões dos usuários
│   │   ├── core/
│   │   │   ├── config.py           # Configurações e variáveis de ambiente
│   │   │   └── security.py         # JWT e bcrypt
│   │   ├── db/
│   │   │   └── database.py         # Conexão PostgreSQL async
│   │   ├── models/
│   │   │   └── models.py           # Modelos SQLAlchemy
│   │   ├── schemas/
│   │   │   └── schemas.py          # Schemas Pydantic
│   │   ├── utils/
│   │   │   ├── nutrition_database.json # Base nutricional 50+ alimentos
│   │   │   └── nutrition_lookup.py # Busca por nome/sinônimo
│   │   └── main.py                 # App FastAPI + endpoints de migração
│   ├── requirements.txt
│   ├── migrate_db.py               # Script de migração standalone
│   ├── Procfile                    # Comando de deploy Render
│   └── runtime.txt                 # python-3.11.11
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── verify-email/page.tsx
│   │   ├── (main)/
│   │   │   ├── home/page.tsx       # Nova análise + campos opcionais
│   │   │   ├── processing/page.tsx # Polling de job + perguntas
│   │   │   ├── result/page.tsx     # Resultado da análise
│   │   │   ├── history/page.tsx    # Histórico com ads espaçados
│   │   │   ├── billing/page.tsx    # Créditos + Assinatura PRO
│   │   │   ├── profile/page.tsx    # Perfil + indicação + sugestões
│   │   │   └── layout.tsx          # Layout com navegação
│   │   ├── page.tsx                # Landing page
│   │   ├── layout.tsx              # Root layout + AdSense script
│   │   └── globals.css             # Estilos globais + gradientes
│   ├── components/
│   │   ├── AdSenseAd.tsx           # Componente de anúncio Google
│   │   ├── PageAds.tsx             # Wrapper de ads (só FREE)
│   │   └── FeedbackModal.tsx       # Modal de feedback global
│   ├── lib/
│   │   ├── api.ts                  # Cliente API tipado
│   │   ├── auth.tsx                # Context de autenticação
│   │   ├── feedback.tsx            # Context de feedback/notificações
│   │   └── image-utils.ts          # Normalização de orientação EXIF
│   ├── public/
│   │   └── manifest.json           # PWA manifest
│   ├── next.config.js
│   └── package.json
│
├── DOCUMENTATION.md                # Este arquivo
└── README.md                       # Quick start
```

---

## Sistema Multiagente

### Fluxo de Análise

```
1. FoodRecognizerAgent (GPT-4o com visão)
   └── Recebe imagem base64 + tipo (prato/sobremesa/bebida)
   └── FOCA SOMENTE no tipo selecionado (ignora outros itens)
   └── Considera observações do usuário (user_notes)
   └── Considera peso/volume informado (weight_grams/volume_ml)
   └── Retorna: itens_identificados, alternativas

2. PortionEstimatorAgent (GPT-4o com visão)
   └── Recebe imagem + alimentos identificados
   └── Estima peso/volume de cada item
   └── Pode gerar perguntas se incerteza alta
   └── Retorna: porcoes, questions (opcional)

3. NutritionCalculatorAgent (local, sem IA)
   └── Recebe porções estimadas
   └── Consulta nutrition_database.json
   └── Calcula calorias e macros totais
   └── Retorna: calorias{central,min,max}, macros

4. HealthAdvisorAgent (GPT-4o-mini)
   └── Recebe valores nutricionais + perfil usuário
   └── Analisa benefícios e pontos de atenção
   └── Gera recomendações práticas motivacionais
   └── Retorna: beneficios, pontos_de_atencao, recomendacoes

5. MealOptimizerAgent (GPT-4o-mini) - APENAS modo full
   └── Recebe análise completa + perfil + meal_type
   └── GERA SUGESTÃO SOMENTE DO TIPO SELECIONADO
   └── Gera prompt para imagem
   └── Retorna: sugestao_texto, mudancas, novos_valores

6. ImageGenerationManager (DALL-E 3) - APENAS modo full
   └── Recebe prompt do MealOptimizer
   └── Gera imagem fotorrealista
   └── Retorna: URL da imagem
```

### Análise Focada por Tipo

O sistema analisa **somente** o tipo de item selecionado pelo usuário:

- **Prato**: Analisa apenas o prato de comida, ignora bebidas e sobremesas
- **Sobremesa**: Analisa apenas a sobremesa, ignora pratos e bebidas  
- **Bebida**: Analisa apenas a bebida, ignora pratos e sobremesas

### Campos Opcionais para Maior Precisão

O usuário pode fornecer informações adicionais:

- **Observações** (todos os tipos): Descrição textual dos ingredientes
- **Peso em gramas** (prato/sobremesa): Peso aproximado da refeição
- **Volume em ml** (bebida): Volume máximo do copo/recipiente

---

## Modelo de Dados

### User
```python
id: int (PK)
email: str (unique)
hashed_password: str
plan: str = "free"  # free, pro
credit_balance: int = 0
pro_analyses_remaining: int = 0
referral_code: str (unique, auto-generated)
referred_by: int (nullable)
email_verified: bool = False
email_verification_token: str (nullable)
asaas_customer_id: str (nullable)
asaas_subscription_id: str (nullable)
created_at: datetime
```

### Profile
```python
id: int (PK)
user_id: int (FK -> User, unique)
objetivo: str  # emagrecer, manter, ganhar_massa, saude_geral
restricoes: List[str]  # vegetariano, vegano, sem_lactose, sem_gluten, low_carb, sem_acucar
alergias: List[str]
avatar_url: str (nullable)
created_at: datetime
```

### Meal
```python
id: int (PK)
user_id: int (FK -> User)
image_url: str  # /uploads/uuid.jpg
meal_type: str  # prato, sobremesa, bebida
status: str  # pending, analyzing, completed, failed
mode: str  # simple, full
user_notes: str (nullable)  # Observações do usuário
weight_grams: float (nullable)  # Peso informado
volume_ml: float (nullable)  # Volume informado (bebidas)
created_at: datetime
```

### MealAnalysis
```python
id: int (PK)
meal_id: int (FK -> Meal, unique)
itens_identificados: JSON
porcoes_estimadas: JSON
calorias_central, calorias_min, calorias_max: float
proteina_g, carbo_g, gordura_g, fibra_g: float
confianca: str
incertezas: JSON
beneficios: JSON
pontos_de_atencao: JSON
recomendacoes_praticas: JSON
sugestao_melhorada_texto: str (nullable)
sugestao_melhorada_imagem_url: str (nullable)
mudancas_sugeridas: JSON (nullable)
calorias_nova_versao: JSON (nullable)
macros_nova_versao: JSON (nullable)
created_at: datetime
```

### Job
```python
id: int (PK)
user_id: int (FK -> User)
meal_id: int (FK -> Meal)
tipo: str  # analyze_meal
status: str  # received, running, waiting_user, completed, failed
etapa_atual: str  # descrição da etapa atual
questions: JSON  # perguntas para o usuário
answers: JSON  # respostas do usuário
resultado_final: JSON
erro: str (nullable)
created_at: datetime
```

### CreditTransaction
```python
id: int (PK)
user_id: int (FK -> User)
credits_added: int
credits_used: int = 0
payment_id: str (nullable)  # ID do pagamento ASAAS
description: str (nullable)
created_at: datetime
```

### Referral
```python
id: int (PK)
referrer_id: int (FK -> User)
referred_id: int (FK -> User, unique)
credits_awarded: int = 12
created_at: datetime
```

---

## Sistema de Créditos e Monetização

### Custos por Análise
- **Análise Simples (Rápida):** GRÁTIS para usuários FREE, 5 créditos para outros
- **Análise Completa:** 12 créditos (inclui sugestão visual com DALL-E)

### Pacotes de Créditos (ASAAS)
| Pacote | Créditos | Preço |
|--------|----------|-------|
| Inicial | 12 | R$ 4,90 |
| Básico | 36 | R$ 12,90 |
| Avançado | 60 | R$ 19,90 |
| Pro | 120 | R$ 34,90 |

### Assinatura PRO
- **Preço:** R$ 49,90/mês
- **Benefícios:**
  - Análises simples ilimitadas
  - 60 análises completas por mês
  - Sem propagandas no app
  - Suporte prioritário

### Sistema de Indicação
- Cada usuário tem um código de indicação único
- Quem indica ganha **12 créditos** quando o indicado se cadastra
- Link de indicação: `https://nutrivision.ai8hub.com/register?ref=CODIGO`

### Propagandas (Google AdSense)
- Exibidas apenas para usuários do plano **FREE**
- Posicionamento estratégico:
  - **Home:** Entre tipos de análise e campos opcionais
  - **Billing:** Entre saldo e card do Plano PRO
  - **Profile:** Entre info do usuário e objetivos
  - **History:** A cada 3 itens do histórico + topo e rodapé

---

## Variáveis de Ambiente

### Backend (Render)
```env
DATABASE_URL=postgresql://nutrivision_db_user:xxx@dpg-xxx-a/nutrivision_db
SECRET_KEY=chave-secreta-jwt-256-bits
OPENAI_API_KEY=sk-proj-xxx
ASAAS_API_KEY=xxx
ASAAS_ENVIRONMENT=production  # ou sandbox
FRONTEND_URL=https://nutrivision.ai8hub.com
BACKEND_URL=https://nutrivision-api-dcr0.onrender.com
RESEND_API_KEY=re_xxx  # para envio de emails
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://nutrivision-api-dcr0.onrender.com
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxx
```

---

## Endpoints de Migração

O backend possui endpoints para executar migrações via navegador:

### Migração Geral
```
GET https://nutrivision-api-dcr0.onrender.com/run-migration
```

Executa todas as migrações pendentes:
- Adiciona colunas de referral (referral_code, referred_by)
- Adiciona verificação de email
- Adiciona campos ASAAS
- Adiciona avatar no perfil
- Adiciona campos opcionais na Meal (user_notes, weight_grams, volume_ml)

### Corrigir Códigos de Indicação
```
GET https://nutrivision-api-dcr0.onrender.com/fix-referral-codes
```

Gera códigos de indicação para usuários que não têm.

---

## Páginas do Frontend

### Autenticação
- `/login` - Login com email/senha
- `/register` - Cadastro (aceita código de indicação via query param `ref`)
- `/forgot-password` - Solicitar reset de senha
- `/reset-password` - Redefinir senha (com token)
- `/verify-email` - Verificar email (com token)

### Área Logada
- `/home` - Nova análise
  - Seleção de tipo (prato/sobremesa/bebida)
  - Seleção de modo (rápida/completa)
  - Campos opcionais (observações, peso, volume)
  - Botão "Comprar mais créditos"
  - Card "Seja PRO" com vantagens
  - Upload de imagem
  
- `/processing` - Processamento da análise
  - Polling do status do job
  - Exibe perguntas se necessário
  - Redireciona para resultado quando completo

- `/result` - Resultado da análise
  - Itens identificados com confiança
  - Calorias (central, min, max)
  - Macronutrientes (proteína, carboidratos, gordura, fibra)
  - Benefícios e pontos de atenção
  - Recomendações práticas
  - Sugestão melhorada (modo completo)
  - Imagem da sugestão (modo completo)

- `/history` - Histórico de análises
  - Lista de todas as análises
  - Filtro por status
  - Delete de análises
  - Propagandas espaçadas a cada 3 itens

- `/billing` - Créditos e Assinatura
  - Saldo atual de créditos
  - Plano atual
  - Card Plano PRO (para não-assinantes)
  - Pacotes de créditos
  - Pagamento via PIX ou cartão
  - Cancelamento de assinatura (para assinantes)

- `/profile` - Perfil do usuário
  - Foto de perfil (upload)
  - Objetivo nutricional
  - Restrições alimentares
  - Alergias
  - Sistema de indicação (código + link)
  - Envio de sugestões/feedback
  - QR Code do app

---

## Fluxo de Pagamento (ASAAS)

### Compra de Créditos

1. Usuário seleciona pacote
2. Escolhe método: PIX ou Cartão
3. **PIX:**
   - Backend gera cobrança no ASAAS
   - Retorna código PIX copia-cola + QR Code
   - Frontend faz polling a cada 5s para verificar pagamento
   - Quando confirmado, créditos são adicionados
4. **Cartão:**
   - Usuário preenche dados do cartão
   - Backend processa pagamento no ASAAS
   - Se aprovado, créditos são adicionados imediatamente

### Assinatura PRO

1. Usuário clica em "Assinar PRO"
2. Escolhe método: PIX, Cartão ou Boleto
3. Backend cria assinatura no ASAAS
4. Quando confirmado:
   - Plano alterado para "pro"
   - pro_analyses_remaining = 60
5. Renovação automática mensal

---

## Problemas Conhecidos e Soluções

### 1. Pillow incompatível com Python 3.13
**Solução:** Forçar Python 3.11 em `runtime.txt`: `python-3.11.11`

### 2. CORS bloqueando requisições
**Solução:** CORS permissivo no FastAPI com `allow_origins=["*"]`

### 3. PostgreSQL URL incompatível com asyncpg
**Solução:** Converter `postgres://` para `postgresql+asyncpg://`

### 4. Imagem não acessível pelo GPT-4o
**Solução:** Converter imagem para base64 antes de enviar

### 5. Orientação de imagem incorreta (EXIF)
**Solução:** Normalizar orientação no frontend antes do upload (`image-utils.ts`)

---

## Deploy

### Backend (Render)
1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Runtime: Python 3.11 (via runtime.txt)
6. **Após deploy:** Acessar `/run-migration` para criar/atualizar tabelas

### Frontend (Vercel)
1. Conectar repositório GitHub
2. Root Directory: `frontend`
3. Framework Preset: Next.js
4. Configurar variáveis de ambiente

---

## Comandos Úteis

### Desenvolvimento Local
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Deploy
```bash
# Commit e push (trigger deploy automático)
git add .
git commit -m "feat: description"
git push origin main
```

### Verificar Status
```bash
# Backend health check
curl https://nutrivision-api-dcr0.onrender.com/health

# Swagger UI
# https://nutrivision-api-dcr0.onrender.com/docs
```

---

## Usuário de Teste

Para criar/resetar o usuário de teste:

```bash
curl -X POST https://nutrivision-api-dcr0.onrender.com/auth/create-test-user
```

**Credenciais:**
- Email: `teste@nutrivision.com`
- Senha: `teste123`
- Créditos: 100.000
