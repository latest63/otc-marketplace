const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function getCategories() {
  const r = await fetch(`${BASE}/categories`);
  return r.json();
}

export async function getListings(filters = {}) {
  const params = new URLSearchParams(filters);
  const r = await fetch(`${BASE}/listings?${params}`);
  return r.json();
}

export async function getListing(id) {
  const r = await fetch(`${BASE}/listings/${id}`);
  if (!r.ok) throw new Error('Not found');
  return r.json();
}

export async function createListing(body) {
  const r = await fetch(`${BASE}/listings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return r.json();
}

export async function updateListing(id, body) {
  const r = await fetch(`${BASE}/listings/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return r.json();
}

export async function cancelListing(id, seller_nametag) {
  const r = await fetch(`${BASE}/listings/${id}`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seller_nametag }),
  });
  return r.json();
}

export async function buyListing(id, buyer_nametag) {
  const r = await fetch(`${BASE}/listings/${id}/buy`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buyer_nametag }),
  });
  return r.json();
}
