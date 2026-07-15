-- PostgreSQL Schema for Benjamin Platform
-- Run this file to initialize the database

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_picture_url TEXT,
  date_of_birth DATE,
  nationality VARCHAR(100),
  phone_number VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_verified_at TIMESTAMP,
  kyc_completed BOOLEAN DEFAULT FALSE,
  kyc_level INT DEFAULT 0,
  kyc_completed_at TIMESTAMP,
  account_status VARCHAR(50) DEFAULT 'active',
  suspension_reason TEXT,
  suspension_until TIMESTAMP,
  self_excluded BOOLEAN DEFAULT FALSE,
  self_excluded_until TIMESTAMP,
  time_out_active BOOLEAN DEFAULT FALSE,
  time_out_until TIMESTAMP,
  deposit_limit_daily DECIMAL(15,2),
  deposit_limit_weekly DECIMAL(15,2),
  deposit_limit_monthly DECIMAL(15,2),
  loss_limit_daily DECIMAL(15,2),
  loss_limit_weekly DECIMAL(15,2),
  loss_limit_monthly DECIMAL(15,2),
  session_limit_minutes INT,
  last_login TIMESTAMP,
  last_ip_address VARCHAR(45),
  last_country VARCHAR(100),
  device_fingerprint VARCHAR(255),
  language VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(3) DEFAULT 'USD',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (email),
  INDEX (username),
  INDEX (account_status),
  INDEX (kyc_level)
);

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(15,2) DEFAULT 0,
  pending_bets_amount DECIMAL(15,2) DEFAULT 0,
  bonus_balance DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id),
  INDEX (user_id)
);

CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport VARCHAR(50) NOT NULL,
  league VARCHAR(100),
  event_name VARCHAR(255),
  event_id VARCHAR(255) UNIQUE,
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  event_date TIMESTAMP NOT NULL,
  closing_date TIMESTAMP NOT NULL,
  initial_odds JSONB,
  current_odds JSONB NOT NULL,
  last_odds_update TIMESTAMP,
  live_score JSONB,
  last_score_update TIMESTAMP,
  live_status VARCHAR(50),
  live_period VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  result JSONB,
  resolved_at TIMESTAMP,
  volume DECIMAL(15,2) DEFAULT 0,
  total_bets INT DEFAULT 0,
  total_liability DECIMAL(15,2) DEFAULT 0,
  affected_players TEXT[] DEFAULT ARRAY[]::TEXT[],
  suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  is_live_streaming BOOLEAN DEFAULT FALSE,
  is_in_play BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (sport, league),
  INDEX (event_date),
  INDEX (status)
);

CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  resolution_criteria TEXT,
  start_date TIMESTAMP,
  resolution_date TIMESTAMP NOT NULL,
  closing_date TIMESTAMP NOT NULL,
  initial_probability JSONB,
  current_probability JSONB,
  last_probability_update TIMESTAMP,
  update_source VARCHAR(100),
  outcomes JSONB NOT NULL,
  result VARCHAR(100),
  resolved_at TIMESTAMP,
  volume DECIMAL(15,2) DEFAULT 0,
  total_bets INT DEFAULT 0,
  liquidity_pool DECIMAL(15,2),
  yes_liquidity DECIMAL(15,2) DEFAULT 0,
  no_liquidity DECIMAL(15,2) DEFAULT 0,
  participants INT DEFAULT 0,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (category),
  INDEX (resolution_date),
  INDEX (status)
);

CREATE TABLE casino_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  description TEXT,
  thumbnail_url TEXT,
  min_bet DECIMAL(10,2) NOT NULL,
  max_bet DECIMAL(15,2) NOT NULL,
  rtp DECIMAL(5,2),
  house_edge DECIMAL(5,2),
  volatility VARCHAR(50),
  provider VARCHAR(100),
  popularity INT,
  is_live BOOLEAN DEFAULT FALSE,
  has_progressive BOOLEAN DEFAULT FALSE,
  max_payout DECIMAL(15,2),
  theme VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (category),
  INDEX (status)
);

CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID REFERENCES markets(id),
  prediction_id UUID REFERENCES predictions(id),
  game_id UUID REFERENCES casino_games(id),
  bet_type VARCHAR(100),
  bet_amount DECIMAL(15,2) NOT NULL,
  odds DECIMAL(10,4) NOT NULL,
  prediction VARCHAR(255),
  potential_winnings DECIMAL(15,2),
  actual_winnings DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'pending',
  result VARCHAR(100),
  fraud_score INT DEFAULT 0,
  fraud_status VARCHAR(50),
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP,
  INDEX (user_id),
  INDEX (market_id),
  INDEX (prediction_id),
  INDEX (status)
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  balance_before DECIMAL(15,2),
  balance_after DECIMAL(15,2),
  market_id UUID,
  bet_id UUID,
  payment_method VARCHAR(100),
  payment_provider VARCHAR(100),
  reference_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  status_reason TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX (user_id),
  INDEX (transaction_type),
  INDEX (status)
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255) UNIQUE,
  device_type VARCHAR(50),
  device_os VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP,
  logout_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX (user_id),
  INDEX (session_token)
);

CREATE TABLE fraud_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bet_id UUID REFERENCES bets(id) ON DELETE CASCADE,
  investigation_type VARCHAR(100),
  severity VARCHAR(50),
  fraud_score INT,
  signals JSONB,
  status VARCHAR(50) DEFAULT 'open',
  review_notes TEXT,
  assigned_to UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  INDEX (user_id),
  INDEX (status),
  INDEX (severity)
);

CREATE TABLE user_risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  pg_risk_level VARCHAR(50),
  pg_risk_score INT,
  pg_last_assessment TIMESTAMP,
  pg_alerts TEXT[],
  avg_daily_bets DECIMAL(10,2),
  avg_bet_size DECIMAL(15,2),
  win_rate DECIMAL(5,2),
  loss_streak INT,
  total_deposits DECIMAL(15,2) DEFAULT 0,
  total_withdrawals DECIMAL(15,2) DEFAULT 0,
  last_deposit_date DATE,
  last_withdrawal_date DATE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id),
  INDEX (pg_risk_level)
);

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type VARCHAR(100),
  severity VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  details JSONB,
  affected_users TEXT[],
  affected_markets TEXT[],
  status VARCHAR(50) DEFAULT 'open',
  resolution_notes TEXT,
  assigned_to UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  INDEX (severity),
  INDEX (status)
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
