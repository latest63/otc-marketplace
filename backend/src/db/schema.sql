CREATE TABLE IF NOT EXISTS categories (
  slug  TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_nametag  TEXT NOT NULL,
  seller_pubkey   TEXT NOT NULL,
  category_slug   TEXT REFERENCES categories(slug),
  title           TEXT NOT NULL,
  description     TEXT DEFAULT '',
  price_amount    NUMERIC(20,2) NOT NULL,
  price_coin      TEXT NOT NULL DEFAULT 'UCT',
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','reserved','sold','cancelled')),
  escrow_id       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_slug);
