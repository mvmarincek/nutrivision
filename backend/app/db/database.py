from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.core.config import settings

Base = declarative_base()

_engine = None
_async_session = None

def get_database_url():
    url = settings.DATABASE_URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

def get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            get_database_url(),
            echo=False,
            pool_pre_ping=True,
            pool_recycle=300
        )
    return _engine

def get_session_maker():
    global _async_session
    if _async_session is None:
        _async_session = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False
        )
    return _async_session

def async_session():
    return get_session_maker()()

async def get_db():
    session_maker = get_session_maker()
    async with session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def run_migrations(conn):
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(14)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_started_at TIMESTAMP",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMP",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()",
        "ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS balance_after INTEGER",
        "ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50)",
        """CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            asaas_payment_id VARCHAR(255),
            asaas_subscription_id VARCHAR(255),
            payment_type VARCHAR(50),
            billing_type VARCHAR(20),
            amount FLOAT,
            status VARCHAR(50) DEFAULT 'pending',
            description VARCHAR(255),
            credits_purchased INTEGER,
            pix_code TEXT,
            pix_qr_code_url VARCHAR(500),
            boleto_url VARCHAR(500),
            paid_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )""",
        "UPDATE users SET is_admin = TRUE WHERE email = 'mvmarincek@gmail.com'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_balance FLOAT DEFAULT 0.0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255)",
        """CREATE TABLE IF NOT EXISTS commissions (
            id SERIAL PRIMARY KEY,
            partner_id INTEGER REFERENCES users(id) NOT NULL,
            referred_user_id INTEGER REFERENCES users(id) NOT NULL,
            payment_id INTEGER REFERENCES payments(id) NOT NULL,
            payment_amount FLOAT NOT NULL,
            commission_amount FLOAT NOT NULL,
            commission_rate FLOAT DEFAULT 0.30,
            status VARCHAR(20) DEFAULT 'pending',
            paid_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        )""",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_days_used INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_date DATE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS simple_analyses_used INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_analyses_used INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS analyses_reset_at TIMESTAMP",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS razao_social VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(10) DEFAULT 'pf'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate FLOAT DEFAULT 0.10",
        """CREATE TABLE IF NOT EXISTS motivational_posts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) NOT NULL,
            post_date DATE NOT NULL,
            content TEXT NOT NULL,
            image_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT NOW()
        )""",
        "CREATE INDEX IF NOT EXISTS idx_motivational_posts_user_date ON motivational_posts(user_id, post_date)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_bonus_days INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(64)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS public_share_token VARCHAR(64)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_public_share_token ON users(public_share_token)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_referral_code ON users(referral_code)",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)",
        "ALTER TABLE profiles ALTER COLUMN avatar_url TYPE TEXT",
        "ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_subscription_id VARCHAR(255)",
        "ALTER TABLE meals ADD COLUMN IF NOT EXISTS user_notes TEXT",
        "ALTER TABLE meals ADD COLUMN IF NOT EXISTS weight_grams FLOAT",
        "ALTER TABLE meals ADD COLUMN IF NOT EXISTS volume_ml FLOAT",
        """CREATE TABLE IF NOT EXISTS email_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(100) UNIQUE NOT NULL,
            value TEXT NOT NULL,
            description VARCHAR(255),
            updated_at TIMESTAMP DEFAULT NOW()
        )""",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_email_settings_key ON email_settings(key)",
        "INSERT INTO email_settings (key, value, description) VALUES ('admin_email', 'mvmarincek@gmail.com', 'Email do administrador') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('support_email', 'contato@picnutra.com', 'Email de suporte') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('app_url', 'https://picnutra.vercel.app', 'URL base da aplicacao') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('frontend_url', 'https://picnutra.vercel.app', 'URL do frontend') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('from_name', 'PicNutra', 'Nome do remetente') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('from_email', 'noreply@picnutra.com', 'Email do remetente') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('welcome_credits', '36', 'Creditos de bonus para novos usuarios') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('referral_credits', '12', 'Creditos por indicacao') ON CONFLICT (key) DO NOTHING",
        "ALTER TABLE meal_analysis DROP COLUMN IF EXISTS receita",
        """CREATE TABLE IF NOT EXISTS error_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            error_type VARCHAR(50) NOT NULL,
            error_message TEXT NOT NULL,
            error_stack TEXT,
            url VARCHAR(500),
            user_agent VARCHAR(500),
            extra_data JSONB,
            resolved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        )""",
        "CREATE INDEX IF NOT EXISTS ix_error_logs_error_type ON error_logs(error_type)",
        "CREATE INDEX IF NOT EXISTS ix_error_logs_created_at ON error_logs(created_at)",
        """CREATE TABLE IF NOT EXISTS chat_conversations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )""",
        "CREATE INDEX IF NOT EXISTS ix_chat_conversations_user ON chat_conversations(user_id)",
        """CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER REFERENCES chat_conversations(id) NOT NULL,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )""",
        "CREATE INDEX IF NOT EXISTS ix_chat_messages_conversation ON chat_messages(conversation_id)",
    ]
    
    for sql in migrations:
        try:
            await conn.execute(text(sql))
        except Exception as e:
            print(f"Migration warning: {e}")

async def init_db():
    import asyncio
    from app.models import models
    try:
        async with asyncio.timeout(30):
            async with get_engine().begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                await run_migrations(conn)
        print("[DB] Database initialized successfully")
    except asyncio.TimeoutError:
        print("[DB] Database connection timeout - continuing without migrations")
    except Exception as e:
        print(f"[DB] Database initialization error: {e} - continuing anyway")
