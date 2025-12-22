import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const labelDifficulty = (d) => {
  if (d === 'easy') return 'かんたん';
  if (d === 'normal') return 'ふつう';
  if (d === 'hard') return 'むずかしい';
  return d;
};

// ✅ ミリ秒 → mm:ss 形式に変換
const formatDuration = (ms) => {
  if (ms == null || Number.isNaN(ms)) return '—';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
};

const TeacherResults = () => {
  const navigate = useNavigate();

  const [histories, setHistories] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('all');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('results')) || [];
    setHistories(saved);
  }, []);

  const studentIds = useMemo(() => {
    const set = new Set(histories.map((h) => h.studentId));
    return Array.from(set);
  }, [histories]);

  const filtered = useMemo(() => {
    if (selectedStudent === 'all') return histories;
    return histories.filter((h) => h.studentId === selectedStudent);
  }, [histories, selectedStudent]);

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto' }}>
      <h1 style={{ textAlign: 'center' }}>成績一覧（教師）</h1>

      <div style={{ marginBottom: '16px' }}>
        <label>生徒IDで絞り込み：</label>{' '}
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="all">全員</option>
          {studentIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p>まだ成績データがありません。</p>
      ) : (
        filtered.map((h) => (
          <div
            key={h.id}
            style={{
              border: '1px solid #ccc',
              padding: '12px',
              marginBottom: '12px'
            }}
          >
            <p>
              <strong>生徒ID：</strong>
              {h.studentId}
            </p>

            <p>
              <strong>難易度：</strong>
              {labelDifficulty(h.difficulty)}
            </p>

            <p>
              <strong>日時：</strong>
              {h.createdAt}
            </p>

            <p>
              <strong>得点：</strong>
              {h.correctCount} / {h.total}
            </p>

            {/* ✅ 追加：所要時間 */}
            <p>
              <strong>所要時間：</strong>
              {formatDuration(h.durationMs)}
            </p>

            <details>
              <summary>回答の詳細を見る</summary>
              <ol>
                {h.results.map((r, idx) => (
                  <li key={idx} style={{ marginBottom: '10px' }}>
                    <div>
                      <strong>問題：</strong>
                      {r.question}
                    </div>
                    <div>あなたの答え：{r.userAnswer}</div>
                    <div>
                      正解：{r.correctAnswer} {r.correct ? '〇' : '✕'}
                    </div>
                  </li>
                ))}
              </ol>
            </details>
          </div>
        ))
      )}

      <button onClick={() => navigate('/')}>戻る</button>
    </div>
  );
};

export default TeacherResults;
