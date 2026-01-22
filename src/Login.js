import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login({ onLogin }) {
  const [id, setId] = useState('');
  const [role, setRole] = useState('student'); // student / teacher
  const [loading, setLoading] = useState(false);

  /* =========================
     キーパッド
  ========================= */
  const appendDigit = (d) => {
    setId((prev) => {
      if (prev.length >= 10) return prev; // 最大桁数（必要なら変更）
      if (prev === '0') return String(d); // 先頭0の置き換え
      return prev + String(d);
    });
  };

  const backspace = () => setId((prev) => prev.slice(0, -1));
  const clear = () => setId('');

  /* =========================
     ログイン
  ========================= */
  const handleLogin = async () => {
    const userId = id.trim();

    // 数字だけ
    if (!/^\d+$/.test(userId)) {
      alert('ID は すうじ だけです');
      return;
    }

    // せんせい（固定ID）
    if (role === 'teacher') {
      if (userId !== '9999') {
        alert('せんせい の ID が ちがいます');
        return;
      }
      onLogin(userId, 'teacher');
      return;
    }

    // せいと：Supabaseで登録チェック
    setLoading(true);

    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('id', Number(userId)) // id が text 型なら Number() を外す
      .maybeSingle();

    setLoading(false);

    if (error) {
      alert('ログイン しっぱい：' + error.message);
      return;
    }

    if (!data) {
      alert('その せいとID は とうろく されていません');
      return;
    }

    onLogin(userId, 'student');
  };

  return (
    <div style={{ maxWidth: 520, margin: '30px auto', padding: '0 12px' }}>
      <h1 style={{ textAlign: 'center' }}>ログイン</h1>

      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <label>やくわり：</label>{' '}
        <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading}>
          <option value="student">せいと</option>
          <option value="teacher">せんせい</option>
        </select>
      </div>

      {/* 表示のみ（直接入力不可） */}
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

      {/* キーパッド（左）＋ログイン（右） */}
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {/* キーパッド */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 80px)',
            gap: 8,
            opacity: loading ? 0.6 : 1,
            pointerEvents: loading ? 'none' : 'auto',
          }}
        >
          {[1,2,3,4,5,6,7,8,9].map((n) => (
            <button key={n} onClick={() => appendDigit(n)} style={{ padding: '10px 0', fontSize: 18 }}>
              {n}
            </button>
          ))}
          <button onClick={clear} style={{ padding: '10px 0', fontSize: 16 }}>C</button>
          <button onClick={() => appendDigit(0)} style={{ padding: '10px 0', fontSize: 18 }}>0</button>
          <button onClick={backspace} style={{ padding: '10px 0', fontSize: 16 }}>⌫</button>
        </div>

        {/* ログイン */}
        <div style={{ width: 180 }}>
          <button
            onClick={handleLogin}
            disabled={loading || id.trim() === ''}
            style={{
              width: '100%',
              height: '100%',
              padding: '18px 0',
              fontSize: 26,
              fontWeight: 900,
              backgroundColor: '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: loading || id.trim() === '' ? 'not-allowed' : 'pointer',
              opacity: loading || id.trim() === '' ? 0.6 : 1,
            }}
          >
            {loading ? 'チェックちゅう…' : 'ログイン'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 12, opacity: 0.7, textAlign: 'center' }}>
        ※ せいとID は せんせい が ついか したものだけ つかえます
      </p>
    </div>
  );
}
