# NutriVision Backend

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your keys
```

4. Run server:
```bash
uvicorn app.main:app --reload
```

## API Endpoints

- POST /auth/register - Register new user
- POST /auth/login - Login user
- GET /profile - Get user profile
- POST /profile - Update user profile
- POST /meals/upload-image - Upload meal image
- POST /meals/{meal_id}/analyze - Start analysis
- POST /meals/{meal_id}/answers - Submit answers
- GET /meals - List meals
- GET /meals/{meal_id} - Get meal details
- DELETE /meals/{meal_id} - Delete meal
- GET /jobs/{job_id} - Get job status
- POST /billing/create-credit-checkout - Create credit checkout
- POST /billing/create-pro-subscription-checkout - Create pro checkout
- POST /billing/webhook - Stripe webhook
- GET /billing/status - Get billing status
- GET /billing/packages - Get credit packages
- GET /credits/balance - Get credit balance
