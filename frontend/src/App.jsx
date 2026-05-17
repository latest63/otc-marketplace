import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Board from './pages/Board';
import Detail from './pages/Detail';
import Create from './pages/Create';
import MyListings from './pages/MyListings';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <header className="header">
        <Link to="/" className="logo">🔄 OTC Market</Link>
        <nav>
          <Link to="/">Board</Link>
          <Link to="/create">Sell</Link>
          <Link to="/my">My Listings</Link>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/listings/:id" element={<Detail />} />
          <Route path="/create" element={<Create />} />
          <Route path="/my" element={<MyListings />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
