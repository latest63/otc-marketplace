import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getListings } from '../api';
import ListingCard from '../components/ListingCard';

export default function Board() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    const f = {};
    if (filters.q) f.q = filters.q;
    if (filters.category) f.category = filters.category;
    getListings(f).then(setListings).finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <div className="board-header">
        <h2>All Listings</h2>
        <div className="filters">
          <input type="text" placeholder="Search..." value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} />
          <select value={filters.category}
            onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="">All</option>
            {categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="loading">Loading...</div> :
       listings.length === 0 ? <div className="empty">No listings yet</div> :
       <div className="grid">
         {listings.map(l => <ListingCard key={l.id} listing={l} />)}
       </div>}
    </div>
  );
}
