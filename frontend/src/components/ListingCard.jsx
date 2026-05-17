import { Link } from 'react-router-dom';

export default function ListingCard({ listing }) {
  return (
    <Link to={`/listings/${listing.id}`} className="card">
      <h3>{listing.title}</h3>
      <div className="meta">
        <span className="badge">{listing.category}</span>
        <span>{listing.seller_nametag}</span>
      </div>
      <div className="price">{listing.price_amount} {listing.price_coin}</div>
    </Link>
  );
}
