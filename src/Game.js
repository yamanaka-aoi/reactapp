import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 画像対応（3つだけ）
const ITEM_IMAGE = {
  'りんご': '/images/apple.png',
  'みかん': '/images/orange.png',
  'バナナ': '/images/banana.png',
};

const Game = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const difficulty = location.state?.difficulty;

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState([]);
  const [startTimeMs, setStartTimeMs] = useState(null);

  // 左(A)・右(C)に表示する対象
  const [leftItem, setLeftItem] = useState(null);
  const [rightItem, setRightItem] = useState(null);

  // ✅ 追加：表示枚数（合計で何枚出すか）
  const [leftCount, setLeftCount] = useState(0);
  const [rightCount, setRightCount] = useState(0);

  // 画像サイズ（揃えて小さめ）
  const imageStyle = {
    width: '120px',
    height: '120px',
    objectFit: 'contain',
  };

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !difficulty) return;

    const allProblems = JSON.parse(localStorage.getItem('problems')) || [];

    const mySet = allProblems.find(
      (p) => p.studentId === user.id && p.difficulty === difficulty
    );

    if (!mySet) {
      alert('この難易度の問題がありません');
      navigate('/');
      return;
    }

    setQuestions(mySet.questions);
    setCurrent(0);
    setInput('');
    setAnswers([]);
    setStartTimeMs(Date.now());

    // 画像リセット
    setLeftItem(null);
    setRightItem(null);
    setLeftCount(0);
    setRightCount(0);
  }, [user, difficulty, navigate]);

  const saveHistory = (historyItem) => {
    const saved = JSON.parse(localStorage.getItem('results')) || [];
    localStorage.setItem('results', JSON.stringify([historyItem, ...saved]));
  };

  const submitAnswer = () => {
    if (!input.trim()) return;
    if (questions.length === 0) return;

    const correct = input.trim() === questions[current].answer.trim();

    const currentResult = {
      question: questions[current].text,
      correctAnswer: questions[current].answer,
      userAnswer: input,
      correct,
    };

    const nextResults = [...answers, currentResult];

    setAnswers(nextResults);
    setInput('');

    if (current + 1 < questions.length) {
      setCurrent(current + 1);

      // ✅ 次の問題に行ったら画像をリセット
      setLeftItem(null);
      setRightItem(null);
      setLeftCount(0);
      setRightCount(0);
    } else {
      const endTimeMs = Date.now();
      const durationMs = startTimeMs != null ? endTimeMs - startTimeMs : null;

      const correctCount = nextResults.filter((r) => r.correct).length;
      const now = new Date().toISOString();

      saveHistory({
        id: now,
        studentId: user.id,
        difficulty,
        correctCount,
        total: nextResults.length,
        results: nextResults,
        startTimeMs,
        endTimeMs,
        durationMs,
        createdAt: now,
      });

      navigate('/result', { state: { results: nextResults } });
    }
  };
  

  if (!user) return <p>ログイン情報がありません。スタートへ戻ります…</p>;
  if (!difficulty) return <p>難易度が選択されていません。戻って選択してください。</p>;
  if (questions.length === 0) return <p>問題を読み込み中...</p>;

  const q = questions[current];

  // Create.js（新形式）で保存された params を利用
  const A = q.params?.A;
  const B = q.params?.B;
  const C = q.params?.C;
  const D = q.params?.D;

  const leftSrc = leftItem ? ITEM_IMAGE[leftItem] : null;
  const rightSrc = rightItem ? ITEM_IMAGE[rightItem] : null;

  // ✅ Aクリック → 左に1枚出す（対象決定）
  const handleClickA = () => {
    setLeftItem(A);
    setLeftCount(1);
  };

  // ✅ Cクリック → 右に1枚出す（対象決定）
  const handleClickC = () => {
    setRightItem(C);
    setRightCount(1);
  };

  // ✅ Bクリック → 左を「合計B枚」にする（Aが先）
  const handleClickB = () => {
    if (!leftItem) return; // Aがまだなら何もしない
    const n = Number(B);
    if (!Number.isFinite(n) || n < 0) return;
    setLeftCount(n);
  };

  // ✅ Dクリック → 右を「合計D枚」にする（Cが先）
  const handleClickD = () => {
    if (!rightItem) return; // Cがまだなら何もしない
    const n = Number(D);
    if (!Number.isFinite(n) || n < 0) return;
    setRightCount(n);
  };

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto' }}>
      <h2>
        問題 {current + 1} / {questions.length}
      </h2>

      {/* 問題文：A/Cクリック→1枚、B/Dクリック→枚数分 */}
      <div style={{ fontSize: '18px', lineHeight: 1.8 }}>
        {A && C ? (
          <>
            <span
              onClick={handleClickA}
              style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
              title="クリックで左に表示"
            >
              {A}
            </span>

            <span>が</span>

            <span
              onClick={handleClickB}
              style={{ cursor: leftItem ? 'pointer' : 'not-allowed', textDecoration: leftItem ? 'underline' : 'none', fontWeight: 'bold' }}
              title={leftItem ? 'クリックで左を枚数表示' : '先にAをクリック'}
            >
              {B}
            </span>

            <span>こ、</span>

            <span
              onClick={handleClickC}
              style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
              title="クリックで右に表示"
            >
              {C}
            </span>

            <span>が</span>

            <span
              onClick={handleClickD}
              style={{ cursor: rightItem ? 'pointer' : 'not-allowed', textDecoration: rightItem ? 'underline' : 'none', fontWeight: 'bold' }}
              title={rightItem ? 'クリックで右を枚数表示' : '先にCをクリック'}
            >
              {D}
            </span>

            <span>こあります。ぜんぶでなんこ？</span>
          </>
        ) : (
          <p>{q.text}</p>
        )}
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="答えを入力"
        style={{ width: '100%', fontSize: '16px', marginTop: '16px' }}
      />

      <button onClick={submitAnswer} style={{ marginTop: '16px' }}>
        次へ
      </button>

      <button
        onClick={() => navigate('/')}
        style={{ marginTop: '12px', marginLeft: '12px' }}>
          やめる
      </button>


      {/* 画像表示（枠・ラベル・注意文なし） */}
      <div style={{ marginTop: '28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* 左（A） */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {leftSrc &&
              Array.from({ length: leftCount }, (_, i) => (
                <img key={i} src={leftSrc} alt={leftItem} style={imageStyle} />
              ))}
          </div>

          {/* 右（C） */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {rightSrc &&
              Array.from({ length: rightCount }, (_, i) => (
                <img key={i} src={rightSrc} alt={rightItem} style={imageStyle} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
