import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getListings, cancelListing } from '../api';

export default function MyListings() {
  const [nametag, setNametag] = useState(localStorage.getItem('my_nametag') || '');
  const [pubkey, setPubkey] = useState(localStorage.getItem('my_pubkey') || '');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchMine = async () => {
    if (!nametag) return;
    setLoading(true);
    const res = await getListings({ seller: nametag });
    setListings(Array.isArray(res) ? res : []);
    setLoading(false);
    localStorage.setItem('my_nametag', nametag);
    localStorage.setItem('my_pubkey', pubkey);
  };

  useEffect(() => { if (nametag) fetchMine(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this listing?')) return;
    await cancelListing(id, pubkey);
    fetchMine();
    setMsg('Listing cancelled');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.5rem',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        marginBottom: '1.5rem',
      }}>
        My <span style={{ color: 'var(--orange)' }}>Listings</span>
      </h2>

      <div className="my-input-group">
        <input
          placeholder="Your nametag"
          value={nametag}
          onChange={e => setNametag(e.target.value)}
        />
        <input
          placeholder="Your pubkey"
          value={pubkey}
          onChange={e => setPubkey(e.target.value)}
        />
        <button className="btn btn-sm" onClick={fetchMine}>Load</button>
      </div>

      {msg && <div className="msg msg-ok">{msg}</div>}

      {loading ? (
        <div className="loading">Loading</div>
      ) : listings.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>○</div>
          {nametag ? 'No listings found for this nametag' : 'Enter your nametag above'}
        </div>
      ) : (
        <div className="grid">
          {listings.map(l => {
            const statusColor = l.status === 'active' ? 'var(--green)'
              : l.status === 'sold' ? 'var(--orange)' : 'var(--text-tertiary)';
            const statusBg = l.status === 'active' ? 'rgba(0,212,170,0.08)'
              : l.status === 'sold' ? 'rgba(255,111,0,0.08)' : 'rgba(107,107,117,0.08)';
            const statusBorder = l.status === 'active' ? 'rgba(0,212,170,0.2)'
              : l.status === 'sold' ? 'rgba(255,111,0,0.2)' : 'rgba(107,107,117,0.2)';

            return (
              <div key={l.id} className="card" style={{ cursor: 'default' }}>
                <h3>{l.title}</h3>
                <div className="meta">
                  <span className={`badge ${l.status === 'active' ? 'badge-orange' : ''}`}>
                    {l.category}
                  </span>
                  <span
                    className="badge status-badge"
                    style={{ background: statusBg, color: statusColor, borderColor: statusBorder }}
                  >
                    {l.status}
                  </span>
                </div>
                <div className="price">{Number(l.price_amount).toLocaleString()} {l.price_coin}</div>
                <div className="my-actions">
                  <Link to={`/listings/${l.id}`} className="btn btn-sm btn-outline">View</Link>
                  {l.status === 'active' && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleCancel(l.id)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
