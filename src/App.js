import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './Login';
import Start from './Start';
import Level from './Level';
import Game from './Game';
import Teacher from './Teacher';
import Create from './Create';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  // ログイン保持
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  // ログイン
  const handleLogin = (id, role) => {
    const u = { id, role };
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  // 🔓 ログアウト
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // 未ログイン
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // ログイン後
  return (
    <Routes>
      <Route
        path="/"
        element={<Start user={user} onLogout={handleLogout} />}
      />
      <Route path="/level" element={<Level />} />
      <Route path="/game" element={<Game />} />
      <Route path="/teacher" element={<Teacher onLogout={handleLogout} />} />
      <Route path="/create" element={<Create />} />

    </Routes>
  );
}

export default App;
