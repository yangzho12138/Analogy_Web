import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Search from './Search';

function App() {
 
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<Search />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
