import { useState } from 'react';

const Login = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [role, setRole] = useState('student'); // student / teacher

  const handleLogin = () => {
    const userId = id.trim();

    // 数字だけ
    if (!/^\d+$/.test(userId)) {
      alert('IDは数字のみです');
      return;
    }

    // 教師ログイン（教師IDは固定例：9999）
    if (role === 'teacher') {
      if (userId !== '9999') {
        alert('教師IDが違います（例：9999）');
        return;
      }
      onLogin(userId, 'teacher');
      return;
    }

    // 生徒ログイン：登録済みIDかチェック
    const studentIds = JSON.parse(localStorage.getItem('studentIds')) || [];
    if (!studentIds.includes(userId)) {
      alert('その生徒IDは登録されていません（教師が追加してください）');
      return;
    }

    onLogin(userId, 'student');
  };

  return (
    <div style={{ maxWidth: '360px', margin: '40px auto' }}>
      <h1 style={{ textAlign: 'center' }}>ログイン</h1>

      <div style={{ marginBottom: '12px' }}>
        <label>役割：</label>{' '}
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">生徒</option>
          <option value="teacher">教師</option>
        </select>
      </div>

      <input
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="数字IDを入力"
        style={{ width: '100%', fontSize: '16px' }}
      />

      <button onClick={handleLogin} style={{ marginTop: '12px', width: '100%' }}>
        ログイン
      </button>

      <p style={{ marginTop: '12px', opacity: 0.7 }}>
        ※ 生徒IDは教師が「生徒ID管理」で追加したものだけ使えます
      </p>
    </div>
  );
};

export default Login;
