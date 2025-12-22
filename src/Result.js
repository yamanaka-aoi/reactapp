import { useLocation, useNavigate } from 'react-router-dom';

const Result = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ state が無い場合でも落ちない
  const results = location.state?.results || [];

  // ✅ results が空なら案内して戻す
  if (!Array.isArray(results) || results.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <h1>結果</h1>
        <p>結果データがありません。ゲームを開始してください。</p>
        <button onClick={() => navigate('/')}>スタートへ戻る</button>
      </div>
    );
  }

  const correctCount = results.filter((r) => r.correct).length;

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto' }}>
      <h1 style={{ textAlign: 'center' }}>結果発表</h1>

      {results.map((r, i) => (
        <div
          key={i}
          style={{
            border: '1px solid #ccc',
            padding: '12px',
            marginBottom: '12px'
          }}
        >
          <p><strong>問題 {i + 1}</strong></p>
          <p>{r.question}</p>

          <p>
            あなたの答え：<strong>{r.userAnswer}</strong>
          </p>

          <p>
            正解：<strong>{r.correctAnswer}</strong> {' '}
            {r.correct ? '〇' : '✕'}
          </p>
        </div>
      ))}

      <h3 style={{ textAlign: 'center' }}>
        正答数：{correctCount} / {results.length}
      </h3>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={() => navigate('/')}>スタートに戻る</button>
      </div>
    </div>
  );
};

export default Result;
