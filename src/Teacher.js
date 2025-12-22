import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Teacher = ({ onLogout }) => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [newId, setNewId] = useState('');

  // 🔁 初回読み込み
  useEffect(() => {
    const saved = localStorage.getItem('studentIds');
    if (saved) {
      setStudents(JSON.parse(saved));
    }
  }, []);

  // 💾 保存用関数
  const saveStudents = (list) => {
    setStudents(list);
    localStorage.setItem('studentIds', JSON.stringify(list));
  };

  // ➕ 生徒ID追加
  const addStudent = () => {
    if (!/^\d+$/.test(newId)) {
      alert('生徒IDは数字のみです');
      return;
    }
    if (students.includes(newId)) {
      alert('すでに存在するIDです');
      return;
    }
    saveStudents([...students, newId]);
    setNewId('');
  };

  // ➖ 生徒ID削除
  const removeStudent = (id) => {
    const filtered = students.filter((s) => s !== id);
    saveStudents(filtered);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto' }}>
      <h1 style={{ textAlign: 'center' }}>教師画面</h1>

      {/* 追加 */}
      <h3>生徒ID追加</h3>
      <input
        value={newId}
        onChange={(e) => setNewId(e.target.value)}
        placeholder="数字ID"
      />
      <button onClick={addStudent}>追加</button>

      {/* 一覧 */}
      <h3 style={{ marginTop: '24px' }}>生徒一覧</h3>
      <ul>
        {students.map((id) => (
          <li key={id} style={{ marginBottom: '8px' }}>
            {id}
            <button
              onClick={() => removeStudent(id)}
              style={{ marginLeft: '12px' }}
            >
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
