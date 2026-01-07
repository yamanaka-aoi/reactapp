import { useState } from 'react';

export default function Login({ onLogin }) {
  const [id, setId] = useState('');
  const [role, setRole] = useState('student'); // student / teacher

  // ===== キーパッド操作 =====
  const appendDigit = (d) => {
    const digit = String(d);
    setId((prev) => {
      // 先頭0もOK。最大桁数はお好みで（ここは10桁まで）
      if (prev.length >= 10) return prev;
      return prev + digit;
    });
  };

  const backspace = () => {
    setId((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    setId('');
  };

  // ===== ログイン処理 =====
  const handleLogin = () => {
    const userId = id.trim();

    // 数字だけ（空も弾く）
    if (!/^\d+$/.test(userId)) {
      alert('IDは すうじ だけです');
      return;
    }

    // 教師ログイン（教師ID固定：9999）
    if (role === 'teacher') {
      if (userId !== '9999') {
        alert('せんせい の ID が ちがいます（れい：9999）');
        return;
      }
      onLogin(userId, 'teacher');
      return;
    }

    // 生徒ログイン：登録済みIDかチェック
    const studentIds = JSON.parse(localStorage.getItem('studentIds')) || [];
    if (!studentIds.includes(userId)) {
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
          >
            {n}
          </button>
        ))}
        <button onClick={clear} style={{ padding: '16px 0', fontSize: 18 }}>
          C
        </button>
        <button onClick={() => appendDigit(0)} style={{ padding: '16px 0', fontSize: 20 }}>
          0
        </button>
        <button onClick={backspace} style={{ padding: '16px 0', fontSize: 18 }}>
          ⌫
        </button>
      </div>

      <button onClick={handleLogin} style={{ marginTop: 12, width: '100%' }}>
        ログイン
      </button>

      <p style={{ marginTop: 12, opacity: 0.7 }}>
        ※ せいとID は せんせい が ついか したものだけ つかえます
      </p>

     
    </div>
  );
}
