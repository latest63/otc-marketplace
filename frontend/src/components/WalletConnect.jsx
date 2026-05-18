import { useState } from 'react';

export default function WalletConnect({ onCreate, onImport }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'import'
  const [nametag, setNametag] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const handleCreate = async () => {
    setBusy(true); setMsg('');
    try {
      const mnem = await onCreate(nametag.trim() || undefined);
      setMsg(`Wallet created! ${mnem ? 'Backup your mnemonic: ' + mnem.substring(0, 20) + '...' : ''}`);
    } catch (e) {
      setMsg(e.message || 'Failed to create wallet');
    }
    setBusy(false);
  };

  const handleImport = async () => {
    if (!mnemonic.trim()) return;
    setBusy(true); setMsg('');
    try {
      await onImport(mnemonic.trim(), nametag.trim() || undefined);
      setMsg('Wallet imported!');
    } catch (e) {
      setMsg(e.message || 'Invalid mnemonic');
    }
    setBusy(false);
  };

  return (
    <div style={{ maxWidth: 480, margin: '3rem auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.02em',
        textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--text-primary)' }}>
        Connect <span style={{ color: 'var(--orange)' }}>Wallet</span>
      </h2>
      {!mode && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => setMode('create')}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🆕</div>
            <h3>New Wallet</h3>
            <div className="meta" style={{ justifyContent: 'center' }}>Auto-create on this device</div>
          </div>
          <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => setMode('import')}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔑</div>
            <h3>Import</h3>
            <div className="meta" style={{ justifyContent: 'center' }}>Use existing mnemonic</div>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="form-card">
          <div className="form-group">
            <label>Nametag (optional)</label>
            <input value={nametag} onChange={e => setNametag(e.target.value)}
              placeholder="@username" />
          </div>
          <button className="btn" onClick={handleCreate} disabled={busy}>
            {busy ? 'Creating...' : 'Create Wallet'}
          </button>
          <button className="btn btn-sm btn-outline" style={{ marginTop: '0.5rem' }}
            onClick={() => setMode(null)}>Back</button>
          {msg && <div className="msg msg-ok" style={{ marginTop: '0.5rem', fontSize: '0.8rem', wordBreak: 'break-all' }}>{msg}</div>}
        </div>
      )}

      {mode === 'import' && (
        <div className="form-card">
          <div className="form-group">
            <label>Mnemonic</label>
            <textarea value={mnemonic} onChange={e => setMnemonic(e.target.value)}
              placeholder="Enter your 12 or 24 word mnemonic..." rows={3} />
          </div>
          <div className="form-group">
            <label>Nametag (optional)</label>
            <input value={nametag} onChange={e => setNametag(e.target.value)}
              placeholder="@username" />
          </div>
          <button className="btn" onClick={handleImport} disabled={busy || !mnemonic.trim()}>
            {busy ? 'Importing...' : 'Import Wallet'}
          </button>
          <button className="btn btn-sm btn-outline" style={{ marginTop: '0.5rem' }}
            onClick={() => setMode(null)}>Back</button>
          {msg && <div className="msg msg-ok" style={{ marginTop: '0.5rem' }}>{msg}</div>}
        </div>
      )}
    </div>
  );
}
