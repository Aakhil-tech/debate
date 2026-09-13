# Debate & Win — Backend API

FastAPI backend for the **Debate & Win** (Receipts AI Text Strategist) app.

## Stack

| Layer | Tech |
|---|---|
| API | FastAPI + Uvicorn |
| Auth | Supabase Auth + custom JWT |
| DB | Supabase (PostgreSQL) |
| Storage | Supabase Storage (screenshots) |
| AI | Groq `llama-3.3-70b-versatile` |
| Rate Limiting | In-process sliding window (swap Redis/slowapi for prod) |

## Endpoints

```
POST   /auth/register
POST   /auth/login
GET    /auth/me

GET    /credits/balance
POST   /credits/add
GET    /credits/costs

POST   /receipts/upload         (multipart image, costs 3 credits)
POST   /receipts/analyze        (text paste, costs 3 credits)
GET    /receipts/               (list past cases)
GET    /receipts/{id}           (get single case)

POST   /fumble/analyze          (costs 1 credit)

POST   /sparring/start
POST   /sparring/{id}/message   (costs 1 credit/turn)
GET    /sparring/{id}
POST   /sparring/{id}/verdict

GET    /war-room/stats
GET    /war-room/active-case
```

Full interactive docs at `http://localhost:8000/docs`

## Local Setup

### 1. Prerequisites

- Python 3.12+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Groq](https://console.groq.com) API key

### 2. Clone & install

```bash
git clone <this-repo>
cd debate-win-backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, GROQ_API_KEY, SECRET_KEY
```

Generate a SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Set up Supabase

1. Go to your Supabase project → **SQL Editor**
2. Run the migration:

```bash
cat supabase/migrations/001_init.sql
# Paste and run in the SQL editor
```

3. Create a Storage bucket named `receipts` (private):
   - **Storage** → **New bucket** → name: `receipts`, uncheck Public

4. Copy your keys from **Settings → API**:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_SERVICE_KEY` = `service_role` key (secret!)
   - `SUPABASE_ANON_KEY` = `anon` key

### 5. Run

```bash
uvicorn app.main:app --reload --port 8000
```

Or with Docker:
```bash
docker-compose up --build
```

### 6. Test

```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@test.com","password":"testpass123","handle":"overthinker"}'

# Use the returned token for all other calls:
# -H "Authorization: Bearer <token>"
```

## Credits System

| Operation | Cost |
|---|---|
| Forensic receipt analysis | 3 credits |
| Fumble radar analysis | 1 credit |
| Sparring turn (per message) | 1 credit |
| New user bonus | 20 free credits |

Returns HTTP `402` with `{"error": "insufficient_credits"}` when balance is zero.

## Zero Log Retention

Set `ZERO_LOG_RETENTION=true` (default) to never persist raw message content.
Only metadata (scores, lengths, timestamps) is stored.

## Production Checklist

- [ ] Set `ENV=production`
- [ ] Rotate `SECRET_KEY`
- [ ] Set your real frontend URL in `CORS_ORIGINS`
- [ ] Replace in-process rate limiter with Redis + `slowapi`
- [ ] Add Stripe webhook at `POST /credits/stripe-webhook`
- [ ] Deploy to Railway / Render / Fly.io (single Dockerfile)
