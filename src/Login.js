import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login({ onLogin }) {
  const [id, setId] = useState('');
  const [role, setRole] = useState('student'); // student / teacher
  const [loading, setLoading] = useState(false);

  // ===== キーパッド操作 =====
  const appendDigit = (d) => {
    const digit = String(d);
    setId((prev) => {
      // 最大10桁（必要なら変更OK）
      if (prev.length >= 10) return prev;
      return prev + digit;
    });
  };

  const backspace = () => setId((prev) => prev.slice(0, -1));
  const clear = () => setId('');

  // ===== ログイン処理 =====
  const handleLogin = async () => {
    const userId = id.trim();

    // 数字だけ（空もNG）
    if (!/^\d+$/.test(userId)) {
      alert('ID は すうじ だけです');
      return;
    }

    // せんせい（ID固定：9999）
    if (role === 'teacher') {
      if (userId !== '9999') {
        alert('せんせい の ID が ちがいます');
        return;
      }
      onLogin(userId, 'teacher');
      return;
    }

    // ===== せいと：Supabase で登録済みチェック =====
    setLoading(true);

    // students.id が「数値型」の場合に備えて Number にする
    const idNum = Number(userId);

    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('id', idNum) // id が text 型なら、ここを .eq('id', userId) に変更
      .maybeSingle();

    setLoading(false);

    if (error) {
      alert('ログイン チェックに しっぱい：' + error.message);
      return;
    }

    if (!data) {
      alert('その せいとID は とうろく されていません（せんせいが ついか してください）');
      return;
    }

    onLogin(userId, 'student');
  };

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: '0 12px' }}>
      <h1 style={{ textAlign: 'center' }}>ログイン</h1>

      <div style={{ marginBottom: 12 }}>
        <label>やくわり：</label>{' '}
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">せいと</option>
          <option value="teacher">せんせい</option>
        </select>
      </div>

      {/* ✅ 表示だけ（手入力NG） */}
      <input
        value={id}
        readOnly
        placeholder="すうじID を いれてね"
        style={{
          width: '100%',
          fontSize: 22,
          padding: 10,
          textAlign: 'center',
          letterSpacing: '2px',
        }}
      />

      {/* ✅ キーパッド */}
      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => appendDigit(n)}
            style={{ padding: '16px 0', fontSize: 20 }}
            disabled={loading}
          >
            {n}
          </button>
        ))}

        <button onClick={clear} style={{ padding: '16px 0', fontSize: 18 }} disabled={loading}>
          C
        </button>
        <button onClick={() => appendDigit(0)} style={{ padding: '16px 0', fontSize: 20 }} disabled={loading}>
          0
        </button>
        <button onClick={backspace} style={{ padding: '16px 0', fontSize: 18 }} disabled={loading}>
          ⌫
        </button>
      </div>

      <button
        onClick={handleLogin}
        style={{ marginTop: 12, width: '100%' }}
        disabled={loading}
      >
        {loading ? 'チェックちゅう…' : 'ログイン'}
      </button>

      <p style={{ marginTop: 12, opacity: 0.7 }}>
        ※ せいとID は せんせい が ついか したものだけ つかえます
      </p>
    </div>
  );
}
