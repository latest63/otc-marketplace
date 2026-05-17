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

  useEffect(() => {
    getListing(id).then(l => { setListing(l); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!listing) return <div className="empty">Listing not found</div>;

  const handleBuy = async () => {
    if (!nametag) return;
    setMsg(''); setErr('');
    try {
      const res = await buyListing(id, nametag);
      setMsg(res.message || 'Payment request sent!');
    } catch (e) {
      setErr(e.message);
    }
  };

  const available = listing.status === 'active';

  return (
    <div className="detail">
      <Link to="/" style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem', display: 'block' }}>← Back</Link>
      <h1>{listing.title}</h1>
      <div className="meta">
        <span className="badge">{listing.category}</span>
        <span> by {listing.seller_nametag}</span>
        <span> · {new Date(listing.created_at).toLocaleDateString()}</span>
      </div>
      <div className="desc">{listing.description || 'No description.'}</div>
      <div className="price">{listing.price_amount} {listing.price_coin}</div>

      {available ? (
        <div className="buy-card">
          <h3 style={{ marginBottom: '0.75rem' }}>Buy this</h3>
          {msg && <div className="msg msg-ok">{msg}</div>}
          {err && <div className="msg msg-err">{err}</div>}
          <label>Your Sphere nametag</label>
          <input type="text" placeholder="@you" value={nametag} onChange={e => setNametag(e.target.value)} />
          <button className="btn" onClick={handleBuy} disabled={!nametag.trim()}>Request Purchase</button>
        </div>
      ) : (
        <div className="msg msg-err">This listing is {listing.status}.</div>
      )}
    </div>
  );
}
