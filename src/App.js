import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Login from './Login';
import Start from './Start';
import Level from './Level';
import Game from './Game';
import Teacher from './Teacher';
import Create from './Create';
import TeacherResults from './TeacherResults';
import TeacherResultDetail from './TeacherResultDetail';

import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (id, role) => {
    const u = { id, role };
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <Routes>
      <Route path="/" element={<Start user={user} onLogout={handleLogout} />} />
      <Route path="/level" element={<Level user={user} />} />
      <Route path="/game" element={<Game user={user} />} />

      <Route path="/teacher" element={<Teacher onLogout={handleLogout} />} />
      <Route path="/create" element={<Create />} />
      <Route path="/teacher/results" element={<TeacherResults />} />
      <Route path="/teacher/results/:resultId" element={<TeacherResultDetail />} />
    </Routes>
  );
}

export default App;
