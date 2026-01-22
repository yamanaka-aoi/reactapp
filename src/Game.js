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

  // ✅ キーパッド入力（手入力なし）
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState([]);

  // ✅ 経過時間
  const [startTimeMs, setStartTimeMs] = useState(null);

  // ✅ 画像表示（A/C タップ→表示、B/D タップ→枚数）
  const [leftItem, setLeftItem] = useState(null);
  const [rightItem, setRightItem] = useState(null);
  const [leftCount, setLeftCount] = useState(0);
  const [rightCount, setRightCount] = useState(0);

  // 画像サイズ
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
      setStartTimeMs(Date.now());

      setLeftItem(null);
      setRightItem(null);
      setLeftCount(0);
      setRightCount(0);
    })();
  }, [user, difficulty, navigate]);

  // ===== ガード =====
  if (!user) return <p>ログイン してください…</p>;
  if (!difficulty) return <p>なんいど を えらんでください</p>;
  if (questions.length === 0) return <p>もんだいを よみこみちゅう…</p>;

  // ===== 今の問題 =====
  const q = questions[current];
  const A = q.a;
  const B = q.b;
  const C = q.c;
  const D = q.d;

  const questionText = `${A}が${B}こ、${C}が${D}こあります。ぜんぶでなんこ？`;
  const correctAnswer = String(Number(B) + Number(D)); // 0もOK / 2けた以上OK

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
    if (!leftItem) return;
    setLeftCount(Number(B));
  };
  const handleTapD = () => {
    if (!rightItem) return;
    setRightCount(Number(D));
  };

  // ===== キーパッド =====
  const appendDigit = (d) => {
    setInput((prev) => {
      // 先頭 0 のときは置き換え（0 だけもOK）
      if (prev === '0') return String(d);
      return prev + String(d);
    });
  };
  const backspace = () => setInput((prev) => prev.slice(0, -1));
  const clearInput = () => setInput('');

  // ✅ 結果をDBへ保存（results + result_items）
  const saveResultToDb = async (nextResults) => {
    const endTimeMs = Date.now();
    const durationMs = startTimeMs != null ? endTimeMs - startTimeMs : null;

    const correctCount = nextResults.filter((r) => r.correct).length;

    // results 1件 insert
    const { data: resRow, error: resErr } = await supabase
      .from('results')
      .insert([
        {
          student_id: user.id,
          difficulty,
          correct_count: correctCount,
          total: nextResults.length,
          duration_ms: durationMs,
        },
      ])
      .select('id')
      .single();

    if (resErr) {
      alert('けっかの ほぞんに しっぱい: ' + resErr.message);
      return { ok: false, durationMs };
    }

    const resultId = resRow.id;

    // result_items insert
    const items = nextResults.map((r) => ({
      result_id: resultId,
      question_text: r.question,
      correct_answer: r.correctAnswer,
      user_answer: r.userAnswer,
      is_correct: r.correct,
    }));

    const { error: itemErr } = await supabase.from('result_items').insert(items);
    if (itemErr) {
      alert('かいとうの ほぞんに しっぱい: ' + itemErr.message);
      return { ok: false, durationMs };
    }

    return { ok: true, durationMs, resultId };
  };

  const submitAnswer = async () => {
    if (input === '') return;

    // 数字以外は入らない想定だけど念のため
    if (!/^\d+$/.test(input)) {
      alert('すうじだけ いれてください');
      return;
    }

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
      setLeftItem(null);
      setRightItem(null);
      setLeftCount(0);
      setRightCount(0);
      return;
    }

    // ✅ 最後：DB保存 → 結果へ
    const saved = await saveResultToDb(nextResults);

    navigate('/result', {
      state: {
        results: nextResults,
        durationMs: saved.durationMs ?? null,
        difficulty,
      },
    });
  };

  // PC向け（Enter=OK）
  const onKeyDown = (e) => {
    if (e.key === 'Enter') submitAnswer();
    if (e.key === 'Backspace') backspace();
    if (e.key === 'Escape') clearInput();
  };

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto', padding: '0 12px' }}>
      <h2 style={{ fontSize: 28 }}>
        もんだい {current + 1} / {questions.length}
      </h2>

      {/* ✅ 問題文（大きめ＆タップ可能） */}
      <div style={{ fontSize: 30, lineHeight: 1.8, marginTop: 10 }}>
        <span
          onClick={handleTapA}
          style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 900 }}
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
            fontWeight: 900,
          }}
          title={leftItem ? 'B を タップ（ひだりを たくさん だす）' : 'さきに A を タップ'}
        >
          {B}
        </span>

        <span>こ、</span>

        <span
          onClick={handleTapC}
          style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 900 }}
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
            fontWeight: 900,
          }}
          title={rightItem ? 'D を タップ（みぎを たくさん だす）' : 'さきに C を タップ'}
        >
          {D}
        </span>

        <span>こあります。ぜんぶでなんこ？</span>
      </div>

      {/* ✅ 入力表示（readOnly） */}
      <input
        value={input}
        readOnly
        onKeyDown={onKeyDown}
        placeholder="こたえ"
        style={{
          width: '100%',
          fontSize: 30,
          padding: 12,
          textAlign: 'center',
          marginTop: 16,
          letterSpacing: '2px',
        }}
      />

      {/* ✅ キーパッド（左） + OK/もどる（右） */}
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {/* 🔢 キーパッド（左） */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 80px)',
            gap: 8,
            alignContent: 'start',
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

        {/* 🟢 OK / もどる（右） */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: 180,
          }}
        >
          <button
            onClick={submitAnswer}
            disabled={input === ''}
            style={{
              flex: 1,
              padding: '18px 0',
              fontSize: 28,
              fontWeight: 900,
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

          <button
            onClick={() => navigate('/')}
            style={{
              padding: '14px 0',
              fontSize: 18,
              borderRadius: 10,
            }}
          >
            もどる
          </button>
        </div>
      </div>

      {/* 🖼 画像（枠なし） */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {leftSrc &&
              Array.from({ length: leftCount }, (_, i) => (
                <img key={i} src={leftSrc} alt={leftItem} style={imageStyle} />
              ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
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
