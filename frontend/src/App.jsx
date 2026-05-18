import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import Board from './pages/Board';
import Detail from './pages/Detail';
import Create from './pages/Create';
import MyListings from './pages/MyListings';
import Admin from './pages/Admin';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <header className="header">
        <Link to="/" className="logo">
          OTC<span>Marketplace</span>
        </Link>
        <nav>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>Board</NavLink>
          <NavLink to="/create" className={({ isActive }) => isActive ? 'active' : ''}>Sell</NavLink>
          <NavLink to="/my" className={({ isActive }) => isActive ? 'active' : ''}>My Listings</NavLink>
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>Admin</NavLink>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/listings/:id" element={<Detail />} />
          <Route path="/create" element={<Create />} />
          <Route path="/my" element={<MyListings />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
