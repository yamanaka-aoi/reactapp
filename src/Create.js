import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const makeText = (A, B, C, D) =>
  `${A}が${B}こ、${C}が${D}こあります。ぜんぶでなんこ？`;

// ✅ A/C の候補リスト（ここを増やせばOK）
const ITEM_OPTIONS = [
  'りんご',
  'みかん',
  'バナナ'
];

const Create = () => {
  const navigate = useNavigate();

  const [studentIds, setStudentIds] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [difficulty, setDifficulty] = useState('easy');

  // 5問ぶん（A/C は候補から選ぶ）
  const [items, setItems] = useState(
    Array.from({ length: 5 }, () => ({
      A: '',
      B: '',
      C: '',
      D: ''
    }))
  );

  useEffect(() => {
    const saved = localStorage.getItem('studentIds');
    if (saved) setStudentIds(JSON.parse(saved));
  }, []);

  const handleChange = (index, key, value) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [key]: value };
    setItems(copy);
  };

  // プレビュー
  const previewQuestions = useMemo(() => {
    return items.map((it) => {
      const A = it.A;
      const C = it.C;
      const B = it.B === '' ? null : Number(it.B);
      const D = it.D === '' ? null : Number(it.D);

      const canBuild =
        A && C && Number.isFinite(B) && Number.isFinite(D);

      return {
        text: canBuild ? makeText(A, B, C, D) : '',
        answer: canBuild ? String(B + D) : ''
      };
    });
  }, [items]);

  const saveProblems = () => {
    if (!studentId) {
      alert('生徒IDを選択してください');
      return;
    }

    // 入力チェック（5問すべて）
    for (let i = 0; i < 5; i++) {
  const { A, B, C, D } = items[i];

  if (!A || !C) {
    alert(`問題${i + 1}: A と C を選択してください`);
    return;
  }

  // ✅ 追加：A と C が同じ場合はNG
  if (A === C) {
    alert(`問題${i + 1}: A と C は別のものを選んでください`);
    return;
  }

  if (!/^\d+$/.test(String(B)) || !/^\d+$/.test(String(D))) {
    alert(`問題${i + 1}: B と D は数字（0以上）で入力してください`);
    return;
  }
}


    const questions = items.map((it) => {
      const A = it.A;
      const C = it.C;
      const B = Number(it.B);
      const D = Number(it.D);

      return {
        text: makeText(A, B, C, D),
        answer: String(B + D),
        template: 'AがBこ、CがDこあります。ぜんぶでなんこ？',
        params: { A, B, C, D }
      };
    });

    const newProblemSet = {
      studentId,
      difficulty,
      questions
    };

    const saved = JSON.parse(localStorage.getItem('problems')) || [];
    localStorage.setItem('problems', JSON.stringify([...saved, newProblemSet]));

    alert('問題を保存しました');
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto' }}>
      <h1 style={{ textAlign: 'center' }}>問題作成（テンプレ＋候補）</h1>

      {/* 生徒ID */}
      <div>
        <label>生徒ID：</label>{' '}
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          <option value="">選択してください</option>
          {studentIds.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      {/* 難易度 */}
      <div style={{ marginTop: '12px' }}>
        <label>難易度：</label>{' '}
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">かんたん</option>
          <option value="normal">ふつう</option>
          <option value="hard">むずかしい</option>
        </select>
      </div>

      <h3 style={{ marginTop: '24px' }}>5問セット（A/Cは候補から選択）</h3>

      {items.map((it, i) => (
        <div
          key={i}
          style={{
            border: '1px solid #ccc',
            padding: '12px',
            marginBottom: '12px'
          }}
        >
          <p><strong>問題 {i + 1}</strong></p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 1fr 120px',
              gap: '8px'
            }}
          >
            {/* A：候補から選択 */}
            <select
              value={it.A}
              onChange={(e) => handleChange(i, 'A', e.target.value)}
            >
              <option value="">Aを選ぶ</option>
              {ITEM_OPTIONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* B：数字 */}
            <input
              type="number"
              min="0"
              placeholder="B（例：3）"
              value={it.B}
              onChange={(e) => handleChange(i, 'B', e.target.value)}
            />

            {/* C：候補から選択 */}
            <select
              value={it.C}
              onChange={(e) => handleChange(i, 'C', e.target.value)}
            >
              <option value="">Cを選ぶ</option>
              {ITEM_OPTIONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* D：数字 */}
            <input
              type="number"
              min="0"
              placeholder="D（例：2）"
              value={it.D}
              onChange={(e) => handleChange(i, 'D', e.target.value)}
            />
          </div>

          <div style={{ marginTop: '10px' }}>
            <div><strong>プレビュー：</strong> {previewQuestions[i].text || '（未完成）'}</div>
            <div><strong>正解：</strong> {previewQuestions[i].answer || '—'}</div>
          </div>
        </div>
      ))}

      <button onClick={saveProblems}>保存</button>
      <button onClick={() => navigate('/')} style={{ marginLeft: '12px' }}>
        戻る
      </button>
    </div>
  );
};

export default Create;
