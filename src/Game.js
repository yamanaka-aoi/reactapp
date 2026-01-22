import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const ITEM_IMAGE = {
  'りんご': '/images/apple.png',
  'みかん': '/images/orange.png',
  'バナナ': '/images/banana.png',
};

export default function Game({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const difficulty = location.state?.difficulty;

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);

  // キーパッド入力（手入力なし）
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState([]);


  // 画像表示（A/Cタップ→表示、B/Dタップ→枚数）
  const [leftItem, setLeftItem] = useState(null);
  const [rightItem, setRightItem] = useState(null);
  const [leftCount, setLeftCount] = useState(0);
  const [rightCount, setRightCount] = useState(0);

  // 画像サイズ（少し小さく統一）
  const imageStyle = { width: '96px', height: '96px', objectFit: 'contain' };

  // 未ログイン
  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  // DBから問題を読み込み
  useEffect(() => {
    if (!user || !difficulty) return;

    (async () => {
      // ① set を探す（最新1件）
      const { data: sets, error: setErr } = await supabase
        .from('problem_sets')
        .select('id, created_at')
        .eq('student_id', user.id)
        .eq('difficulty', difficulty)
        .order('created_at', { ascending: false })
        .limit(1);

      if (setErr) {
        alert('もんだいセット しゅとくに しっぱい: ' + setErr.message);
        navigate('/');
        return;
      }

      if (!sets || sets.length === 0) {
        alert('この なんいど の もんだいは ありません');
        navigate('/');
        return;
      }

      const setId = sets[0].id;

      // ② questions を取得
      const { data: qs, error: qErr } = await supabase
        .from('questions')
        .select('id, a, b, c, d')
        .eq('set_id', setId)
        .order('id');

      if (qErr) {
        alert('もんだい しゅとくに しっぱい: ' + qErr.message);
        navigate('/');
        return;
      }

      setQuestions(qs || []);
      setCurrent(0);
      setInput('');
      setAnswers([]);

      setLeftItem(null);
      setRightItem(null);
      setLeftCount(0);
      setRightCount(0);
    })();
  }, [user, difficulty, navigate]);

  if (!user) return <p>ログイン してください…</p>;
  if (!difficulty) return <p>なんいど を えらんでください</p>;
  if (questions.length === 0) return <p>もんだいを よみこみちゅう…</p>;

  const q = questions[current];
  const A = q.a;
  const B = q.b;
  const C = q.c;
  const D = q.d;

  const questionText = `${A}が${B}こ、${C}が${D}こあります。ぜんぶでなんこ？`;
  const correctAnswer = String(Number(B) + Number(D)); // 0もOK、2けた以上もOK

  const leftSrc = leftItem ? ITEM_IMAGE[leftItem] : null;
  const rightSrc = rightItem ? ITEM_IMAGE[rightItem] : null;

  // ===== タップ操作（A/C→表示、B/D→枚数） =====
  const handleTapA = () => {
    setLeftItem(A);
    setLeftCount(1);
  };
  const handleTapC = () => {
    setRightItem(C);
    setRightCount(1);
  };
  const handleTapB = () => {
    if (!leftItem) return;     // 先にAをタップ
    setLeftCount(Number(B));   // B枚表示
  };
  const handleTapD = () => {
    if (!rightItem) return;    // 先にCをタップ
    setRightCount(Number(D));  // D枚表示
  };

  // ===== キーパッド（小さめ） =====
  const appendDigit = (d) => {
    setInput((prev) => (prev === '0' ? String(d) : prev + String(d)));
  };
  const backspace = () => setInput((prev) => prev.slice(0, -1));
  const clearInput = () => setInput('');

  const submitAnswer = async () => {
    if (input === '') return;

    const correct = input.trim() === correctAnswer.trim();

    const currentResult = {
      question: questionText,
      correctAnswer,
      userAnswer: input.trim(),
      correct,
    };

    const nextResults = [...answers, currentResult];

    setAnswers(nextResults);
    setInput('');

    if (current + 1 < questions.length) {
      setCurrent(current + 1);

      // 次の問題に行ったら画像リセット（残したいならここ消してOK）
      setLeftItem(null);
      setRightItem(null);
      setLeftCount(0);
      setRightCount(0);
      return;
    }

    // 最後：結果へ
    navigate('/result', { state: { results: nextResults } });
  };

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto', padding: '0 12px' }}>
      <h2 style={{ fontSize: 28 }}>
        もんだい {current + 1} / {questions.length}
      </h2>

      {/* ✅ 問題文：A/C/B/D タップできる（文字大きめ） */}
      <div style={{ fontSize: 30, lineHeight: 1.8, marginTop: 10 }}>
        <span
          onClick={handleTapA}
          style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: '900' }}
          title="A を タップ"
        >
          {A}
        </span>
        <span>が</span>

        <span
          onClick={handleTapB}
          style={{
            cursor: leftItem ? 'pointer' : 'not-allowed',
            textDecoration: leftItem ? 'underline' : 'none',
            fontWeight: '900',
          }}
          title={leftItem ? 'B を タップ（ひだりを たくさん だす）' : 'さきに A を タップ'}
        >
          {B}
        </span>

        <span>こ、</span>

        <span
          onClick={handleTapC}
          style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: '900' }}
          title="C を タップ"
        >
          {C}
        </span>
        <span>が</span>

        <span
          onClick={handleTapD}
          style={{
            cursor: rightItem ? 'pointer' : 'not-allowed',
            textDecoration: rightItem ? 'underline' : 'none',
            fontWeight: '900',
          }}
          title={rightItem ? 'D を タップ（みぎを たくさん だす）' : 'さきに C を タップ'}
        >
          {D}
        </span>

        <span>こあります。ぜんぶでなんこ？</span>
      </div>

      {/* 入力表示（readOnly） */}
      <input
        value={input}
        readOnly
        placeholder="こたえ"
        style={{
          width: '100%',
          fontSize: 30,
          padding: 12,
          textAlign: 'center',
          marginTop: 16,
        }}
      />

      {/* 🔢 キーパッド（小さめ） */}
      <div
      style={{
        marginTop: 12,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 80px)', // ← 横幅を固定
        justifyContent: 'center',
        gap: 8,
      }}
    >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => appendDigit(n)}
            style={{ padding: '10px 0', fontSize: 18 }}
          >
            {n}
          </button>
        ))}
        <button onClick={clearInput} style={{ padding: '10px 0', fontSize: 16 }}>
          C
        </button>
        <button onClick={() => appendDigit(0)} style={{ padding: '10px 0', fontSize: 18 }}>
          0
        </button>
        <button onClick={backspace} style={{ padding: '10px 0', fontSize: 16 }}>
          ⌫
        </button>
      </div>

      {/* 🟢 OKボタン（大きく） */}
      <button
        onClick={submitAnswer}
        disabled={input === ''}
        style={{
          marginTop: 18,
          width: '100%',
          padding: '18px 0',
          fontSize: 28,
          fontWeight: '900',
          backgroundColor: '#4caf50',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          cursor: input === '' ? 'not-allowed' : 'pointer',
          opacity: input === '' ? 0.6 : 1,
        }}
      >
        OK
      </button>

      {/* もどる */}
      <button onClick={() => navigate('/')} style={{ marginTop: 12 }}>
        もどる
      </button>

      {/* 🖼 画像（枠なし・ラベルなし） */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {leftSrc &&
              Array.from({ length: leftCount }, (_, i) => (
                <img key={i} src={leftSrc} alt={leftItem} style={imageStyle} />
              ))}
          </div>

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
}
