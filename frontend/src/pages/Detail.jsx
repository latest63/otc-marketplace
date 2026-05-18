import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getListing, buyListing } from '../api';

export default function Detail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nametag, setNametag] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getListing(id)
      .then(l => { setListing(l); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading</div>;
  if (!listing) return (
    <div className="empty">
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✕</div>
      Listing not found
    </div>
  );

  const handleBuy = async () => {
    if (!nametag.trim()) return;
    setSending(true); setMsg(''); setErr('');
    try {
      const res = await buyListing(id, nametag.trim());
      if (res.error) {
        setErr(res.detail || res.error);
      } else {
        setMsg(res.message || 'Payment request sent!');
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  };

  const available = listing.status === 'active';

  return (
    <div className="detail">
      <Link to="/" className="back-link">← Back to board</Link>
      <h1>{listing.title}</h1>
      <div className="meta">
        <span className="badge badge-orange">{listing.category}</span>
        <span>{listing.seller_nametag}</span>
        <span>·</span>
        <span>{new Date(listing.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        })}</span>
        {!available && (
          <>
            <span>·</span>
            <span className="badge" style={{
              background: listing.status === 'sold'
                ? 'rgba(0,212,170,0.1)' : 'rgba(255,71,87,0.1)',
              color: listing.status === 'sold' ? 'var(--green)' : 'var(--red)',
              borderColor: listing.status === 'sold'
                ? 'rgba(0,212,170,0.2)' : 'rgba(255,71,87,0.2)',
            }}>{listing.status}</span>
          </>
        )}
      </div>

      <div className="desc">{listing.description || 'No description provided.'}</div>
      <div className="price-hero">{Number(listing.price_amount).toLocaleString()} {listing.price_coin}</div>

      {available ? (
        <div className="buy-card">
          <h3>Purchase</h3>
          {msg && <div className="msg msg-ok">{msg}</div>}
          {err && <div className="msg msg-err">{err}</div>}
          <label>Your Sphere Nametag</label>
          <input
            type="text"
            placeholder="@username"
            value={nametag}
            onChange={e => setNametag(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              className="btn"
              onClick={handleBuy}
              disabled={!nametag.trim() || sending}
              style={{ flex: 1 }}
            >
              {sending ? 'Sending...' : 'Send Payment Request'}
            </button>
            <Link to={`/chat?dm=${encodeURIComponent(listing.seller_nametag)}`}
              className="btn btn-outline">
              Message Seller
            </Link>
          </div>
        </div>
      ) : (
        <div className="msg msg-err" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
          This listing is no longer available
        </div>
      )}
    </div>
  );
}
