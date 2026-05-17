import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_KEY || '',
  sphereMnemonic: process.env.SPHERE_MNEMONIC || '',
  sphereNametag: process.env.SPHERE_NAMETAG || '@otcmarket',
  network: process.env.NETWORK || 'testnet',
};
