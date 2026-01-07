import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const Teacher = ({ onLogout }) => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [newId, setNewId] = useState('');
  const [loading, setLoading] = useState(true);

  // DBから生徒一覧を読み込み
  const loadStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .order('id');

    if (error) {
      console.error(error);
      alert('生徒一覧の読み込みに失敗しました: ' + error.message);
      setLoading(false);
      return;
    }

    setStudents((data || []).map((r) => r.id));
    setLoading(false);
  };

  // 初回読み込み
  useEffect(() => {
    loadStudents();
  }, []);

  // ➕ 生徒ID追加（DBへ insert）
  const addStudent = async () => {
    const id = newId.trim();

    // 数字のみ
    if (!/^\d+$/.test(id)) {
      alert('生徒IDは数字のみです（半角で入力してください）');
      return;
    }

    // 重複チェック（画面上）
    if (students.includes(id)) {
      alert('すでに存在するIDです');
      return;
    }

    const { error } = await supabase.from('students').insert([{ id }]);
    if (error) {
      console.error(error);
      // primary key重複など
      alert('追加に失敗しました: ' + error.message);
      return;
    }

    setNewId('');
    await loadStudents(); // 同期更新
  };

  // ➖ 生徒ID削除（DBから delete）
  const removeStudent = async (id) => {
    const ok = window.confirm(`${id} を削除しますか？`);
    if (!ok) return;

    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      console.error(error);
      alert('削除に失敗しました: ' + error.message);
      return;
    }

    await loadStudents(); // 同期更新
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto' }}>
      <h1 style={{ textAlign: 'center' }}>教師画面</h1>

      <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => navigate('/create')}>問題を作る</button>
        <button onClick={() => navigate('/teacher/results')}>生徒の成績を見る</button>
        <button onClick={() => navigate('/')}>スタートへ戻る</button>
        <button onClick={onLogout}>ログアウト</button>
      </div>

      <hr style={{ margin: '20px 0' }} />

      <h3>生徒ID追加</h3>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          placeholder="数字ID"
          style={{ flex: 1 }}
        />
        <button onClick={addStudent}>追加</button>
      </div>

      <h3 style={{ marginTop: '24px' }}>生徒一覧</h3>

      {loading ? (
        <p>読み込み中...</p>
      ) : students.length === 0 ? (
        <p>まだ生徒IDがありません</p>
      ) : (
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
      )}
    </div>
  );
};

export default Teacher;
