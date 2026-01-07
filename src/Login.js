import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const Login = ({ onLogin }) => {
  const navigate = useNavigate(); // 追加
  const [id, setId] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const userId = id.trim();

    if (!/^\d+$/.test(userId)) {
      alert('IDは数字のみ（半角）');
      return;
    }

    // 教師
    if (role === 'teacher') {
      if (userId !== '9999') {
        alert('教師IDが違います（例：9999）');
        return;
      }
      onLogin(userId, 'teacher');
      navigate('/teacher'); // ← 教師は教師画面へ
      return;
    }

    // 生徒（DB確認）
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    setLoading(false);

    if (error) {
      alert('ログイン確認に失敗: ' + error.message);
      return;
    }
    if (!data) {
      alert('その生徒IDは登録されていません');
      return;
    }

    onLogin(userId, 'student');
    navigate('/'); // ← 生徒はスタート画面へ（2枚目）
  };

  return (
    <div style={{ maxWidth: '360px', margin: '40px auto' }}>
      <h1 style={{ textAlign: 'center' }}>ログイン</h1>

      <div style={{ marginBottom: '12px' }}>
        <label>役割：</label>{' '}
        <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading}>
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

      <button onClick={handleLogin} style={{ marginTop: '12px', width: '100%' }} disabled={loading}>
        {loading ? '確認中...' : 'ログイン'}
      </button>
    </div>
  );
};

export default Login;
