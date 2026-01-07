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

  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState([]);

  const [startTimeMs, setStartTimeMs] = useState(null);

  // 画像表示（あなたの仕様：A/Cクリック後、B/Dクリックで枚数表示）
  const [leftItem, setLeftItem] = useState(null);
  const [rightItem, setRightItem] = useState(null);
  const [leftCount, setLeftCount] = useState(0);
  const [rightCount, setRightCount] = useState(0);

  const imageStyle = { width: '120px', height: '120px', objectFit: 'contain' };

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
        alert('問題セット取得に失敗: ' + setErr.message);
        navigate('/');
        return;
      }

      if (!sets || sets.length === 0) {
        alert('この難易度の問題がありません');
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
        alert('問題取得に失敗: ' + qErr.message);
        navigate('/');
        return;
      }

      setQuestions(qs || []);
      setCurrent(0);
      setInput('');
      setAnswers([]);
      setStartTimeMs(Date.now());

      setLeftItem(null);
      setRightItem(null);
      setLeftCount(0);
      setRightCount(0);
    })();
  }, [user, difficulty, navigate]);

  if (!user) return <p>ログイン情報がありません…</p>;
  if (!difficulty) return <p>難易度が選択されていません。戻って選択してください。</p>;
  if (questions.length === 0) return <p>問題を読み込み中...</p>;

  const q = questions[current];
  const A = q.a;
  const B = q.b;
  const C = q.c;
  const D = q.d;

  const questionText = `${A}が${B}こ、${C}が${D}こあります。ぜんぶでなんこ？`;
  const correctAnswer = String(B + D);

  const leftSrc = leftItem ? ITEM_IMAGE[leftItem] : null;
  const rightSrc = rightItem ? ITEM_IMAGE[rightItem] : null;

  const handleClickA = () => {
    setLeftItem(A);
    setLeftCount(1);
  };
  const handleClickC = () => {
    setRightItem(C);
    setRightCount(1);
  };
  const handleClickB = () => {
    if (!leftItem) return;
    setLeftCount(Number(B));
  };
  const handleClickD = () => {
    if (!rightItem) return;
    setRightCount(Number(D));
  };

  const saveResultToDb = async (nextResults, durationMs, endTimeMs) => {
    // results 1件 insert → id 取得
    const { data: resRow, error: resErr } = await supabase
      .from('results')
      .insert([{
        student_id: user.id,
        difficulty,
        correct_count: nextResults.filter(r => r.correct).length,
        total: nextResults.length,
        duration_ms: durationMs ?? null,
      }])
      .select('id')
      .single();

    if (resErr) {
      alert('結果の保存に失敗: ' + resErr.message);
      return;
    }

    const resultId = resRow.id;

    // result_items をまとめて insert
    const items = nextResults.map(r => ({
      result_id: resultId,
      question_text: r.question,
      correct_answer: r.correctAnswer,
      user_answer: r.userAnswer,
      is_correct: r.correct,
    }));

    const { error: itemErr } = await supabase.from('result_items').insert(items);
    if (itemErr) {
      alert('回答詳細の保存に失敗: ' + itemErr.message);
      return;
    }
  };

  const submitAnswer = async () => {
    if (!input.trim()) return;

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
      setLeftItem(null); setRightItem(null);
      setLeftCount(0); setRightCount(0);
      return;
    }

    // 最後：時間測ってDB保存して結果画面へ
    const endTimeMs = Date.now();
    const durationMs = startTimeMs != null ? endTimeMs - startTimeMs : null;

    await saveResultToDb(nextResults, durationMs, endTimeMs);

    navigate('/result', {
      state: { results: nextResults, durationMs, difficulty },
    });
  };

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto' }}>
      <h2>問題 {current + 1} / {questions.length}</h2>

      {/* 問題文：A/Cクリック→画像、B/Dクリック→枚数表示 */}
      <div style={{ fontSize: '18px', lineHeight: 1.8 }}>
        <span
          onClick={handleClickA}
          style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
        >
          {A}
        </span>
        <span>が</span>
        <span
          onClick={handleClickB}
          style={{
            cursor: leftItem ? 'pointer' : 'not-allowed',
            textDecoration: leftItem ? 'underline' : 'none',
            fontWeight: 'bold'
          }}
          title={leftItem ? 'クリックで左を枚数表示' : '先にAをクリック'}
        >
          {B}
        </span>
        <span>こ、</span>

        <span
          onClick={handleClickC}
          style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
        >
          {C}
        </span>
        <span>が</span>
        <span
          onClick={handleClickD}
          style={{
            cursor: rightItem ? 'pointer' : 'not-allowed',
            textDecoration: rightItem ? 'underline' : 'none',
            fontWeight: 'bold'
          }}
          title={rightItem ? 'クリックで右を枚数表示' : '先にCをクリック'}
        >
          {D}
        </span>
        <span>こあります。ぜんぶでなんこ？</span>
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="答えを入力"
        style={{ width: '100%', fontSize: '16px', marginTop: '16px' }}
      />

      <div style={{ marginTop: 16 }}>
        <button onClick={submitAnswer}>次へ</button>
        <button onClick={() => navigate('/')} style={{ marginLeft: 12 }}>戻る</button>
      </div>

      {/* 画像（枠・ラベル無し） */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {leftSrc && Array.from({ length: leftCount }, (_, i) => (
              <img key={i} src={leftSrc} alt={leftItem} style={imageStyle} />
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {rightSrc && Array.from({ length: rightCount }, (_, i) => (
              <img key={i} src={rightSrc} alt={rightItem} style={imageStyle} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
