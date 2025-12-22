import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Game = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Level画面から渡された難易度
  const difficulty = location.state?.difficulty;

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  // 🔁 問題読み込み
  useEffect(() => {
    const allProblems =
      JSON.parse(localStorage.getItem('problems')) || [];

    const myProblemSet = allProblems.find(
      (p) =>
        p.studentId === user.id &&
        p.difficulty === difficulty
    );

    if (!myProblemSet) {
      alert('この難易度の問題がありません');
      navigate('/');
      return;
    }

    setQuestions(myProblemSet.questions);
  }, [user.id, difficulty, navigate]);

  // ✅ 回答チェック
  const submitAnswer = () => {
    if (answer.trim() === '') return;

    if (
      answer.trim() === questions[index].answer.trim()
    ) {
      setCorrectCount((c) => c + 1);
    }

    setAnswer('');

    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      setFinished(true);
    }
  };

  // 🎉 終了画面
  if (finished) {
    return (
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <h1>結果</h1>
        <p>
          {questions.length}問中 {correctCount}問 正解！
        </p>
        <button onClick={() => navigate('/')}>
          スタートに戻る
        </button>
      </div>
    );
  }

  // 📝 問題表示
  return (
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h2>
        問題 {index + 1} / {questions.length}
      </h2>

      <p style={{ fontSize: '18px' }}>
        {questions[index]?.text}
      </p>

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
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
