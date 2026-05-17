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
    setListings(res);
    setLoading(false);
    localStorage.setItem('my_nametag', nametag);
    localStorage.setItem('my_pubkey', pubkey);
  };

  useEffect(() => { if (nametag) fetchMine(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this listing?')) return;
    await cancelListing(id, pubkey);
    fetchMine();
    setMsg('Listing cancelled');
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>My Listings</h2>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', maxWidth: 500 }}>
        <input placeholder="Your nametag" value={nametag}
          onChange={e => setNametag(e.target.value)} style={{ flex: 1 }}
          className="filters input" />
        <input placeholder="Your pubkey" value={pubkey}
          onChange={e => setPubkey(e.target.value)} style={{ flex: 1 }}
          className="filters input" />
        <button className="btn btn-sm" onClick={fetchMine}>Load</button>
      </div>

      {msg && <div className="msg msg-ok">{msg}</div>}

      {loading ? <div className="loading">Loading...</div> :
       listings.length === 0 ? <div className="empty">No listings yet</div> :
       <div className="grid">
         {listings.map(l => (
           <div key={l.id} className="card" style={{ cursor: 'default' }}>
             <h3>{l.title}</h3>
             <div className="meta">
               <span className="badge">{l.category}</span>
               <span className="badge" style={{
                 color: l.status === 'active' ? '#00D4AA' : l.status === 'sold' ? '#ff9800' : '#666'
               }}>{l.status}</span>
             </div>
             <div className="price">{l.price_amount} {l.price_coin}</div>
             <div className="my-actions">
               <Link to={`/listings/${l.id}`} className="btn btn-sm btn-outline">View</Link>
               {l.status === 'active' && (
                 <button className="btn btn-sm btn-danger" onClick={() => handleCancel(l.id)}>Cancel</button>
               )}
             </div>
           </div>
         ))}
       </div>}
    </div>
  );
}
