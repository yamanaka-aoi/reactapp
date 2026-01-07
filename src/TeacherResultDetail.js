import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from './supabaseClient';

const diffLabel = (d) =>
  d === 'easy' ? 'かんたん' : d === 'normal' ? 'ふつう' : 'むずかしい';
const msToSec = (ms) => (ms == null ? '-' : (ms / 1000).toFixed(1) + '秒');

export default function TeacherResultDetail() {
  const navigate = useNavigate();
  const { resultId } = useParams();

  const idNum = Number(resultId); // ✅ bigintに合わせる

  const [header, setHeader] = useState(null);
  const [items, setItems] = useState([]);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // resultId が数字じゃない場合の保険
    if (!Number.isFinite(idNum)) {
      alert('不正なIDです');
      navigate('/teacher/results', { replace: true });
      return;
    }

    (async () => {
      setLoading(true);

      const { data: r, error: rErr } = await supabase
        .from('results')
        .select(
          'id, student_id, difficulty, correct_count, total, duration_ms, created_at, teacher_comment'
        )
        .eq('id', idNum)
        .single();

      if (rErr) {
        setLoading(false);
        alert('結果の取得に失敗: ' + rErr.message);
        return;
      }

      const { data: list, error: iErr } = await supabase
        .from('result_items')
        .select('id, question_text, correct_answer, user_answer, is_correct')
        .eq('result_id', idNum)
        .order('id');

      setLoading(false);

      if (iErr) {
        alert('詳細の取得に失敗: ' + iErr.message);
        return;
      }

      setHeader(r);
      setComment(r.teacher_comment || '');
      setItems(list || []);
    })();
  }, [idNum, navigate]);

  const saveComment = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('results')
      .update({ teacher_comment: comment })
      .eq('id', idNum);

    setSaving(false);

    if (error) {
      alert('コメント保存に失敗: ' + error.message);
      return;
    }

    alert('コメントを保存しました');
  };

  if (loading) return <p style={{ maxWidth: 900, margin: '30px auto' }}>読み込み中...</p>;
  if (!header) return <p style={{ maxWidth: 900, margin: '30px auto' }}>データがありません</p>;

  return (
    <div style={{ maxWidth: 900, margin: '30px auto', padding: '0 12px' }}>
      <h1>結果の詳細（教師）</h1>

      <button onClick={() => navigate('/teacher/results')}>一覧へ戻る</button>

      <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8, marginTop: 12 }}>
        <div>日時：{new Date(header.created_at).toLocaleString()}</div>
        <div>生徒ID：{header.student_id}</div>
        <div>難易度：{diffLabel(header.difficulty)}</div>
        <div>正解：{header.correct_count} / {header.total}</div>
        <div>所要時間：{msToSec(header.duration_ms)}</div>
      </div>

      <h3 style={{ marginTop: 16 }}>教師コメント</h3>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        style={{ width: '100%', fontSize: '14px' }}
        placeholder="ここにコメントを入力してください"
      />
      <button onClick={saveComment} disabled={saving} style={{ marginTop: 8 }}>
        {saving ? '保存中...' : 'コメントを保存'}
      </button>

      <hr style={{ margin: '20px 0' }} />

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>問題</th>
            <th>生徒の答え</th>
            <th>正解</th>
            <th>判定</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.id}>
              <td>{idx + 1}</td>
              <td>{it.question_text}</td>
              <td>{it.user_answer}</td>
              <td>{it.correct_answer}</td>
              <td>{it.is_correct ? '〇' : '×'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
