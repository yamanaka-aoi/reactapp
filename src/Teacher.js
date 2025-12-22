import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Teacher = ({ onLogout }) => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [newId, setNewId] = useState('');

  // 🔁 初回読み込み（studentIds）
  useEffect(() => {
    const saved = localStorage.getItem('studentIds');
    if (saved) setStudents(JSON.parse(saved));
  }, []);

  // 💾 保存（studentIds）
  const saveStudents = (list) => {
    setStudents(list);
    localStorage.setItem('studentIds', JSON.stringify(list));
  };

  // ➕ 追加
  const addStudent = () => {
    const id = newId.trim();

    // 数字のみ（半角推奨）
    if (!/^\d+$/.test(id)) {
      alert('生徒IDは数字のみです（半角で入力してください）');
      return;
    }
    if (students.includes(id)) {
      alert('すでに存在するIDです');
      return;
    }
    saveStudents([...students, id]);
    setNewId('');
  };

  // ➖ 削除
  const removeStudent = (id) => {
    saveStudents(students.filter((s) => s !== id));
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto' }}>
      <h1 style={{ textAlign: 'center' }}>教師画面</h1>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/teacher/results')}>成績を確認</button>
      </div>

      <h3>生徒ID追加</h3>
      <input
        value={newId}
        onChange={(e) => setNewId(e.target.value)}
        placeholder="数字ID"
      />
      <button onClick={addStudent} style={{ marginLeft: '8px' }}>
        追加
      </button>

      <h3 style={{ marginTop: '24px' }}>生徒一覧</h3>
      <ul>
        {students.map((id) => (
          <li key={id} style={{ marginBottom: '8px' }}>
            {id}
            <button onClick={() => removeStudent(id)} style={{ marginLeft: '12px' }}>
              削除
            </button>
          </li>
        ))}
      </ul>

      <hr />

      <button onClick={() => navigate('/')}>戻る</button>
      <button onClick={onLogout} style={{ marginLeft: '12px' }}>
        ログアウト
      </button>
    </div>
  );
};

export default Teacher;
