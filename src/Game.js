import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Game = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const difficulty = location.state?.difficulty;

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState([]);

  // ✅ 追加：開始時刻（ミリ秒）
  const [startTimeMs, setStartTimeMs] = useState(null);

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

    // 初期化
    setQuestions(mySet.questions);
    setCurrent(0);
    setInput('');
    setAnswers([]);

    // ✅ 追加：計測開始（問題が読み込めたタイミングでスタート）
    setStartTimeMs(Date.now());
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
      correct
    };

    const nextResults = [...answers, currentResult];

    setAnswers(nextResults);
    setInput('');

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      // ✅ 最後：時間計測して保存
      const endTimeMs = Date.now();
      const durationMs =
        startTimeMs != null ? endTimeMs - startTimeMs : null;

      const correctCount = nextResults.filter((r) => r.correct).length;
      const now = new Date().toISOString();

      const historyItem = {
        id: now, // 簡易ID
        studentId: user.id,
        difficulty,
        correctCount,
        total: nextResults.length,
        results: nextResults,

        // ✅ 追加：時間情報
        startTimeMs,
        endTimeMs,
        durationMs,

        createdAt: now
      };

      saveHistory(historyItem);

      // 表示用に結果画面へ
      navigate('/result', {
        state: { results: nextResults }
      });
    }
  };

  if (!user) return <p>ログイン情報がありません。スタートへ戻ります…</p>;
  if (!difficulty) return <p>難易度が選択されていません。戻って選択してください。</p>;
  if (questions.length === 0) return <p>問題を読み込み中...</p>;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h2>
        問題 {current + 1} / {questions.length}
      </h2>

      <p style={{ fontSize: '18px' }}>{questions[current].text}</p>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="答えを入力"
        style={{ width: '100%', fontSize: '16px' }}
      />

      <button onClick={submitAnswer} style={{ marginTop: '16px' }}>
        次へ
      </button>
    </div>
  );
};

export default Game;
