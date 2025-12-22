import { useState } from 'react';

const Login = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('student');

  const handleLogin = () => {
    // 数字チェック
    if (!/^\d+$/.test(userId)) {
      alert('IDは数字のみで入力してください');
      return;
    }

    // 👨‍🎓 生徒の場合：登録チェック
    if (role === 'student') {
      const saved = localStorage.getItem('students');
      const students = saved ? JSON.parse(saved) : [];

      if (!students.includes(userId)) {
        alert('このIDは登録されていません');
        return;
      }
    }

    // 👨‍🏫 教師 or 登録済み生徒 → ログインOK
    onLogin(userId, role);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '80px' }}>
      <h1>ログイン</h1>

      <input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="数字ID"
      />

      <br /><br />

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="student">生徒</option>
        <option value="teacher">教師</option>
      </select>

      <br /><br />

      <button onClick={handleLogin}>ログイン</button>
    </div>
  );
};

export default Login;
