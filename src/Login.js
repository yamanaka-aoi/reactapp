import { useState } from 'react';
import { supabase } from './supabaseClient';

const Login = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [role, setRole] = useState('student'); // student / teacher
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const userId = id.trim();

    // 数字だけ
    if (!/^\d+$/.test(userId)) {
      alert('IDは数字のみです（半角）');
      return;
    }

    // 教師ログイン（固定ID）
    if (role === 'teacher') {
      if (userId !== '9999') {
        alert('教師IDが違います（例：9999）');
        return;
      }
      onLogin(userId, 'teacher');
      return;
    }

    // 生徒ログイン：DBで登録済みチェック
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    setLoading(false);

    if (error) {
      console.error(error);
      alert('ログイン確認に失敗しました: ' + error.message);
      return;
    }

    if (!data) {
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
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={loading}
        >
          <option value="student">生徒</option>
          <option value="teacher">教師</option>
        </select>
      </div>

      <input
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="数字IDを入力"
        style={{ width: '100%', fontSize: '16px' }}
        disabled={loading}
      />

      <button
        onClick={handleLogin}
        style={{ marginTop: '12px', width: '100%' }}
        disabled={loading}
      >
        {loading ? '確認中...' : 'ログイン'}
      </button>

      <p style={{ marginTop: '12px', opacity: 0.7 }}>
        ※ 生徒IDは教師がDBに登録したものだけ使えます
      </p>
    </div>
  );
};

export default Login;
