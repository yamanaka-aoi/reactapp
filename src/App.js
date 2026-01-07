import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Login from './Login';
import Start from './Start';
import Level from './Level';
import Game from './Game';
import Result from './Result';
import Teacher from './Teacher';
import Create from './Create';
import TeacherResults from './TeacherResults';
import TeacherResultDetail from './TeacherResultDetail';
import ClassStudent from './ClassStudent';
import ClassTeacher from './ClassTeacher';
import ClassBoard from './ClassBoard';



import './App.css';

function App() {
  const [user, setUser] = useState(null);

  // 🔁 ログイン状態を復元
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  // 🔐 ログイン
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

  // ❌ 未ログインなら必ずログイン画面
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Routes>
      {/* =====================
          共通（ログイン後）
      ===================== */}
      <Route
        path="/"
        element={<Start user={user} onLogout={handleLogout} />}
      />

      <Route
      path="/class"
      element={user.role === 'student' ? <ClassStudent user={user} /> : <Navigate to="/" replace />}
      />

      <Route
        path="/class/teacher"
        element={user.role === 'teacher' ? <ClassTeacher user={user} /> : <Navigate to="/" replace />}
      />

      <Route
        path="/class/board/:sessionId" 
        element={<ClassBoard />}
      />



      {/* =====================
          生徒のみ
      ===================== */}
      <Route
        path="/level"
        element={
          user.role === 'student'
            ? <Level user={user} />
            : <Navigate to="/" replace />
        }
      />

      <Route
        path="/game"
        element={
          user.role === 'student'
            ? <Game user={user} />
            : <Navigate to="/" replace />
        }
      />

      {/* =====================
          教師のみ
      ===================== */}
      <Route
        path="/teacher"
        element={
          user.role === 'teacher'
            ? <Teacher onLogout={handleLogout} />
            : <Navigate to="/" replace />
        }
      />

      <Route
        path="/create"
        element={
          user.role === 'teacher'
            ? <Create />
            : <Navigate to="/" replace />
        }
      />

      <Route
        path="/teacher/results"
        element={
          user.role === 'teacher'
            ? <TeacherResults />
            : <Navigate to="/" replace />
        }
      />

      <Route
        path="/teacher/results/:resultId"
        element={
          user.role === 'teacher'
            ? <TeacherResultDetail />
            : <Navigate to="/" replace />
        }
      />

      <Route
       path="/result"
        element={
          user.role === 'student' 
          ? <Result /> 
          : <Navigate to="/" replace />
        }
      />

      {/* =====================
          それ以外はスタートへ
      ===================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
