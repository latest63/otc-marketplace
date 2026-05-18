import { Link } from 'react-router-dom';

export default function ListingCard({ listing }) {
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <Link to={`/listings/${listing.id}`} className="card">
      <h3>{listing.title}</h3>
      <div className="meta">
        <span className="badge badge-orange">{listing.category}</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
          {listing.seller_nametag}
        </span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginLeft: 'auto' }}>
          {timeAgo(listing.created_at)}
        </span>
      </div>
      <div className="price">{Number(listing.price_amount).toLocaleString()} {listing.price_coin}</div>
    </Link>
  );
}
