import { useState, useEffect } from 'react';

const KEY_STORAGE = 'admin_key';

export default function Admin() {
  const [key, setKey] = useState(localStorage.getItem(KEY_STORAGE) || '');
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [cats, setCats] = useState([]);
  const [tab, setTab] = useState('stats');
  const [newCat, setNewCat] = useState({ slug: '', label: '' });
  const [msg, setMsg] = useState('');

  const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-key': key });
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const show = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const login = () => {
    localStorage.setItem(KEY_STORAGE, key);
    setAuthed(true);
  };

  useEffect(() => {
    if (!authed || !key) return;
    fetch(`${BASE}/admin/stats`, { headers: headers() })
      .then(r => r.json()).then(d => { setStats(d); if (d.error) setAuthed(false); }).catch(() => setAuthed(false));
    fetch(`${BASE}/admin/listings`, { headers: headers() })
      .then(r => r.json()).then(setListings);
    fetch(`${BASE}/admin/categories`, { headers: headers() })
      .then(r => r.json()).then(setCats);
  }, [authed]);

  const refreshListings = () =>
    fetch(`${BASE}/admin/listings`, { headers: headers() }).then(r => r.json()).then(setListings);

  const refreshCats = () =>
    fetch(`${BASE}/admin/categories`, { headers: headers() }).then(r => r.json()).then(setCats);

  const deleteListing = async (id) => {
    if (!confirm('Delete this listing permanently?')) return;
    await fetch(`${BASE}/admin/listings/${id}`, { method: 'DELETE', headers: headers() });
    refreshListings();
    show('Listing deleted');
  };

  const updateStatus = async (id, status) => {
    await fetch(`${BASE}/admin/listings/${id}`, {
      method: 'PATCH', headers: headers(), body: JSON.stringify({ status }),
    });
    refreshListings();
    show(`Status → ${status}`);
  };

  const createCat = async (e) => {
    e.preventDefault();
    const r = await fetch(`${BASE}/admin/categories`, {
      method: 'POST', headers: headers(), body: JSON.stringify(newCat),
    });
    if (!r.ok) return show('Failed to create category');
    setNewCat({ slug: '', label: '' });
    refreshCats();
    show('Category created');
  };

  const deleteCat = async (slug) => {
    if (!confirm(`Delete "${slug}"?`)) return;
    await fetch(`${BASE}/admin/categories/${slug}`, { method: 'DELETE', headers: headers() });
    refreshCats();
    show('Category deleted');
  };

  if (!authed) {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Admin <span style={{ color: 'var(--orange)' }}>Access</span>
        </h2>
        <div className="form-card">
          <div className="form-group">
            <label>Admin Key</label>
            <input type="password" value={key} onChange={e => setKey(e.target.value)}
              placeholder="Enter admin key" onKeyDown={e => e.key === 'Enter' && login()} />
          </div>
          <button className="btn" onClick={login}>Login</button>
        </div>
      </div>
    );
  }

  const statusColor = (s) =>
    s === 'active' ? 'var(--green)' : s === 'sold' ? 'var(--orange)' : 'var(--text-tertiary)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          Admin <span style={{ color: 'var(--orange)' }}>Dashboard</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['stats','listings','categories'].map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? '' : 'btn-outline'}`}
              onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
          <button className="btn btn-sm btn-outline" onClick={() => { setAuthed(false); localStorage.removeItem(KEY_STORAGE); }}
            style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>Logout</button>
        </div>
      </div>

      {msg && <div className="msg msg-ok">{msg}</div>}

      {/* ─── STATS ─── */}
      {tab === 'stats' && stats && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <div className="card" style={{ cursor: 'default' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Listings</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--orange)' }}>{stats.listCount}</div>
          </div>
          <div className="card" style={{ cursor: 'default' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Active</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--green)' }}>{stats.byStatus?.active || 0}</div>
          </div>
          <div className="card" style={{ cursor: 'default' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Sold</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--green)' }}>{stats.byStatus?.sold || 0}</div>
          </div>
          <div className="card" style={{ cursor: 'default' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Volume (sold)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--orange)' }}>{Number(stats.volumeSold).toLocaleString()} UCT</div>
          </div>
          <div className="card" style={{ cursor: 'default', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Categories</div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {stats.categories?.map(c => (
                <div key={c.label} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="badge badge-orange">{c.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── LISTINGS ─── */}
      {tab === 'listings' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
          {listings.map(l => (
            <div key={l.id} className="card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3>{l.title}</h3>
                  <div className="meta" style={{ marginBottom: 0 }}>
                    <span className="badge">{l.category}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{l.seller_nametag}</span>
                    <span className="badge status-badge" style={{
                      background: statusColor(l.status) + '15',
                      color: statusColor(l.status),
                      borderColor: statusColor(l.status) + '30',
                    }}>{l.status}</span>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--orange)' }}>
                  {Number(l.price_amount).toLocaleString()} {l.price_coin}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                {l.status !== 'sold' && (
                  <button className="btn btn-sm btn-outline" onClick={() => updateStatus(l.id, 'sold')}
                    style={{ borderColor: 'rgba(0,212,170,0.3)', color: 'var(--green)' }}>Mark Sold</button>
                )}
                {l.status === 'active' && (
                  <button className="btn btn-sm btn-outline" onClick={() => updateStatus(l.id, 'cancelled')}>Cancel</button>
                )}
                <button className="btn btn-sm btn-danger" onClick={() => deleteListing(l.id)}>Delete</button>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                  {new Date(l.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {listings.length === 0 && <div className="empty">No listings</div>}
        </div>
      )}

      {/* ─── CATEGORIES ─── */}
      {tab === 'categories' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="card" style={{ cursor: 'default' }}>
            <h3 style={{ marginBottom: '1rem' }}>Create Category</h3>
            <form onSubmit={createCat} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input placeholder="slug (e.g. 'music')" value={newCat.slug}
                onChange={e => setNewCat(f => ({ ...f, slug: e.target.value }))}
                style={{ flex: 1, minWidth: 140, background: 'var(--bg-deep)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none' }}
                required />
              <input placeholder="Label (e.g. 'Music')" value={newCat.label}
                onChange={e => setNewCat(f => ({ ...f, label: e.target.value }))}
                style={{ flex: 1, minWidth: 140, background: 'var(--bg-deep)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none' }}
                required />
              <button className="btn btn-sm" type="submit">Create</button>
            </form>
          </div>
          <div className="card" style={{ cursor: 'default' }}>
            <h3 style={{ marginBottom: '1rem' }}>All Categories ({cats.length})</h3>
            {cats.length === 0 ? (
              <div className="empty">No categories</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {cats.map(c => (
                  <div key={c.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span className="badge badge-orange">{c.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{c.slug}</span>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteCat(c.slug)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
