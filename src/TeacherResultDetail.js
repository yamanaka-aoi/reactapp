import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const diffLabel = (d) => (d === 'easy' ? 'かんたん' : d === 'normal' ? 'ふつう' : 'むずかしい');
const msToSec = (ms) => (ms == null ? '-' : (ms / 1000).toFixed(1) + '秒');

export default function TeacherResults() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔎 フィルタ用
  const [filterId, setFilterId] = useState('');

  const loadResults = async (studentId = '') => {
    setLoading(true);

    let q = supabase
      .from('results')
      .select('id, student_id, difficulty, correct_count, total, duration_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    // ✅ 生徒IDが入力されていれば絞り込み
    if (studentId.trim() !== '') {
      q = q.eq('student_id', studentId.trim());
    }

    const { data, error } = await q;

    setLoading(false);

    if (error) {
      alert('成績の取得に失敗: ' + error.message);
      return;
    }

    setRows(data || []);
  };

  // 初回読み込み（全員）
  useEffect(() => {
    loadResults('');
  }, []);

  const onSearch = () => {
    // 数字以外なら警告（空はOK）
    const v = filterId.trim();
    if (v !== '' && !/^\d+$/.test(v)) {
      alert('生徒IDは数字のみです');
      return;
    }
    loadResults(v);
  };

  const onClear = () => {
    setFilterId('');
    loadResults('');
  };

  return (
    <div style={{ maxWidth: 980, margin: '30px auto', padding: '0 12px' }}>
      <h1>生徒の成績（DB）</h1>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={() => navigate('/teacher')}>戻る</button>

        {/* 🔎 生徒IDフィルタ */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ opacity: 0.8 }}>生徒ID：</span>
          <input
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            placeholder="例：1000"
            style={{ width: 160 }}
          />
          <button onClick={onSearch}>検索</button>
          <button onClick={onClear}>クリア</button>
        </div>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : rows.length === 0 ? (
        <p>
          {filterId.trim()
            ? `生徒ID「${filterId.trim()}」の結果がありません`
            : 'まだ結果がありません'}
        </p>
      ) : (
        <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>日時</th>
              <th>生徒ID</th>
              <th>難易度</th>
              <th>正解</th>
              <th>所要時間</th>
              <th>詳細</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.student_id}</td>
                <td>{diffLabel(r.difficulty)}</td>
                <td>
                  {r.correct_count} / {r.total}
                </td>
                <td>{msToSec(r.duration_ms)}</td>
                <td>
                  <button onClick={() => navigate(`/teacher/results/${r.id}`)}>
                    表示
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
