import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, createListing } from '../api';

export default function Create() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    seller_nametag: '', seller_pubkey: '', title: '', description: '',
    category_slug: '', price_amount: '', price_coin: 'UCT',
  });
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setErr(''); setSending(true);
    try {
      const res = await createListing({
        ...form,
        price_amount: parseFloat(form.price_amount),
      });
      navigate(`/listings/${res.id}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
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
        Create <span style={{ color: 'var(--orange)' }}>Listing</span>
      </h2>

      {err && <div className="msg msg-err">{err}</div>}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Your Sphere Nametag</label>
          <input
            name="seller_nametag" value={form.seller_nametag}
            onChange={handleChange} required placeholder="@you"
          />
        </div>
        <div className="form-group">
          <label>Your Sphere Public Key</label>
          <input
            name="seller_pubkey" value={form.seller_pubkey}
            onChange={handleChange} required placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label>Title</label>
          <input
            name="title" value={form.title}
            onChange={handleChange} required
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select
            name="category_slug" value={form.category_slug}
            onChange={handleChange} required
          >
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description" value={form.description}
            onChange={handleChange} placeholder="Describe what you're selling..."
          />
        </div>
        <div className="form-group">
          <label>Price</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              name="price_amount" type="number" step="0.01" min="0"
              value={form.price_amount} onChange={handleChange}
              required placeholder="0.00" style={{ flex: 1 }}
            />
            <select
              name="price_coin" value={form.price_coin}
              onChange={handleChange} style={{ width: 100 }}
            >
              <option>UCT</option>
              <option>USDU</option>
            </select>
          </div>
        </div>
        <button className="btn" type="submit" disabled={sending}>
          {sending ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}
