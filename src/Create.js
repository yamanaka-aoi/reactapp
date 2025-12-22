import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Create = () => {
  const navigate = useNavigate();

  // 生徒ID一覧
  const [studentIds, setStudentIds] = useState([]);
  const [studentId, setStudentId] = useState('');

  // 難易度
  const [difficulty, setDifficulty] = useState('easy');

  // 問題＋正解（5問）
  const [questions, setQuestions] = useState(
    Array(5).fill({ text: '', answer: '' })
  );

  // 🔁 生徒ID読み込み
  useEffect(() => {
    const saved = localStorage.getItem('studentIds');
    if (saved) {
      setStudentIds(JSON.parse(saved));
    }
  }, []);

  // ✏️ 問題 or 正解の変更
  const handleChange = (index, key, value) => {
    const copy = [...questions];
    copy[index] = { ...copy[index], [key]: value };
    setQuestions(copy);
  };

  // 💾 保存処理
  const saveProblems = () => {
    if (!studentId) {
      alert('生徒IDを選択してください');
      return;
    }

    if (
      questions.some(
        (q) => q.text.trim() === '' || q.answer.trim() === ''
      )
    ) {
      alert('問題文と正解をすべて入力してください');
      return;
    }

    const newProblemSet = {
      studentId,
      difficulty,
      questions
    };

    const saved =
      JSON.parse(localStorage.getItem('problems')) || [];

    localStorage.setItem(
      'problems',
      JSON.stringify([...saved, newProblemSet])
    );

    alert('問題を保存しました');
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto' }}>
      <h1 style={{ textAlign: 'center' }}>問題作成（教師）</h1>

      {/* 生徒ID選択 */}
      <div>
        <label>生徒ID：</label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          <option value="">選択してください</option>
          {studentIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      {/* 難易度選択 */}
      <div style={{ marginTop: '16px' }}>
        <label>難易度：</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">かんたん</option>
          <option value="normal">ふつう</option>
          <option value="hard">むずかしい</option>
        </select>
      </div>

      {/* 問題入力 */}
      <h3 style={{ marginTop: '24px' }}>文章問題（5問）</h3>

      {questions.map((q, i) => (
        <div
          key={i}
          style={{
            marginBottom: '16px',
            padding: '12px',
            border: '1px solid #ccc'
          }}
        >
          <p>問題 {i + 1}</p>

          <textarea
            rows={3}
            style={{ width: '100%' }}
            placeholder="問題文を入力"
            value={q.text}
            onChange={(e) =>
              handleChange(i, 'text', e.target.value)
            }
          />

          <input
            type="text"
            placeholder="正解"
            style={{ width: '100%', marginTop: '8px' }}
            value={q.answer}
            onChange={(e) =>
              handleChange(i, 'answer', e.target.value)
            }
          />
        </div>
      ))}

      {/* ボタン */}
      <button onClick={saveProblems}>保存</button>
      <button
        onClick={() => navigate('/')}
        style={{ marginLeft: '12px' }}
      >
        戻る
      </button>
    </div>
  );
};

export default Create;
