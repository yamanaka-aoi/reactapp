import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function makeCode() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

export default function ClassTeacher({ user }) {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);   // {id, code}
  const [question, setQuestion] = useState(null); // {id, text, correct_answer}

  const [submissions, setSubmissions] = useState([]); // [{student_id, answer, updated_at}]
  const [loading, setLoading] = useState(false);

  // 出題フォーム
  const [qText, setQText] = useState('りんごが2こ、みかんが3こあります。ぜんぶでなんこ？');
  const [qCorrect, setQCorrect] = useState('5');

  const sorted = useMemo(() => {
    return [...submissions].sort((a, b) => (a.student_id > b.student_id ? 1 : -1));
  }, [submissions]);

  // 集計（リアルタイム）
  const stats = useMemo(() => {
    const total = submissions.length;
    if (!question) return { total, correct: 0, wrong: total };

    const correct = submissions.filter((s) => String(s.answer).trim() === String(question.correct_answer).trim()).length;
    const wrong = total - correct;
    return { total, correct, wrong };
  }, [submissions, question]);

  const startClass = async () => {
    setLoading(true);
    const code = makeCode();

    const { data, error } = await supabase
      .from('class_sessions')
      .insert([{ code, teacher_id: user.id, is_active: true }])
      .select('id, code')
      .single();

    setLoading(false);

    if (error) {
      alert('授業開始に失敗: ' + error.message);
      return;
    }

    setSession({ id: data.id, code: data.code });
    setQuestion(null);
    setSubmissions([]);
  };

  const endClass = async () => {
    if (!session) return;

    const { error } = await supabase
      .from('class_sessions')
      .update({ is_active: false })
      .eq('id', session.id);

    if (error) {
      alert('終了に失敗: ' + error.message);
      return;
    }

    setSession(null);
    setQuestion(null);
    setSubmissions([]);
  };

  // 出題（INSERTで配信）
  const publishQuestion = async () => {
    if (!session) return;

    const text = qText.trim();
    const correct = qCorrect.trim();

    if (!text) {
      alert('問題文を入力してください');
      return;
    }
    if (!/^\d+$/.test(correct)) {
      alert('正解は数字で入力してください');
      return;
    }

    const { data, error } = await supabase
      .from('class_questions')
      .insert([{ session_id: session.id, text, correct_answer: correct }])
      .select('id, text, correct_answer')
      .single();

    if (error) {
      alert('出題に失敗: ' + error.message);
      return;
    }

    setQuestion(data);
    setSubmissions([]); // 新しい問題を出したら一旦リセット（この問題の提出だけ表示したいので）
  };

  // 先生が入室したら「最新問題」を取得（念のため）
  useEffect(() => {
    if (!session) return;

    (async () => {
      const { data, error } = await supabase
        .from('class_questions')
        .select('id, text, correct_answer, created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) return;
      setQuestion(data?.[0] ?? null);
    })();
  }, [session]);

  // ✅ Realtime：出題を受信（INSERT）
  useEffect(() => {
    if (!session) return;

    const ch = supabase
      .channel(`class_questions_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_questions',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const q = payload.new;
          if (!q) return;
          setQuestion({ id: q.id, text: q.text, correct_answer: q.correct_answer });
          setSubmissions([]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [session]);

  // ✅ Realtime：提出を受信（この session + 現在の question のみ）
  useEffect(() => {
    if (!session || !question) return;

    // 初回ロード（今の問題の提出を全部取得）
    (async () => {
      const { data, error } = await supabase
        .from('class_submissions')
        .select('student_id, answer, updated_at')
        .eq('session_id', session.id)
        .eq('question_id', question.id)
        .order('updated_at', { ascending: false });

      if (!error) setSubmissions(data || []);
    })();

    const ch = supabase
      .channel(`class_submissions_${session.id}_${question.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_submissions',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;

          // いま表示中の問題だけ採用
          if (row.question_id !== question.id) return;

          setSubmissions((prev) => {
            const rest = prev.filter((x) => x.student_id !== row.student_id);
            return [{ student_id: row.student_id, answer: row.answer, updated_at: row.updated_at }, ...rest];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [session, question]);

  return (
    <div style={{ maxWidth: 980, margin: '30px auto', padding: '0 12px' }}>
      <h1>授業問題（教師）</h1>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={() => navigate('/')}>スタートへ</button>
        {!session ? (
          <button onClick={startClass} disabled={loading}>
            {loading ? '開始中...' : '授業を開始（コード発行）'}
          </button>
        ) : (
          <button onClick={endClass}>授業を終了</button>
        )}
      </div>

      {!session ? (
        <p>「授業を開始」を押すと、生徒が参加するためのコードが発行されます。</p>
      ) : (
        <>
          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
            <div>授業コード：</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', letterSpacing: 2 }}>
              {session.code}
            </div>
            <p style={{ opacity: 0.75, margin: '8px 0 0' }}>
              生徒：授業 → このコード → 参加 → 答え送信
            </p>
          </div>

          <hr style={{ margin: '18px 0' }} />

          <h2>① 先生が問題を出す</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 140px', gap: 10 }}>
            <input
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="問題文"
              style={{ padding: 10, fontSize: 16 }}
            />
            <input
              value={qCorrect}
              onChange={(e) => setQCorrect(e.target.value)}
              placeholder="正解(数字)"
              style={{ padding: 10, fontSize: 16 }}
            />
            <button onClick={publishQuestion} style={{ fontSize: 16 }}>
              出題
            </button>
          </div>

          <div style={{ marginTop: 12, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
            <b>現在の問題：</b>
            {question ? (
              <>
                <div style={{ marginTop: 6, fontSize: 18 }}>{question.text}</div>
                <div style={{ marginTop: 6, opacity: 0.8 }}>正解：{question.correct_answer}</div>
              </>
            ) : (
              <div style={{ marginTop: 6, opacity: 0.8 }}>まだ出題していません</div>
            )}
          </div>

          <hr style={{ margin: '18px 0' }} />

          <h2>② 生徒の答え（リアルタイム）</h2>

          <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
            <div>回答人数：<b>{stats.total}</b></div>
            <div>正解：<b>{stats.correct}</b></div>
            <div>不正解：<b>{stats.wrong}</b></div>
          </div>

          {!question ? (
            <p>問題を出すと、ここに生徒の答えがリアルタイムで出ます。</p>
          ) : sorted.length === 0 ? (
            <p>まだ回答がありません</p>
          ) : (
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>生徒ID</th>
                  <th>答え（最新）</th>
                  <th>正誤</th>
                  <th>更新時刻</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const ok = String(r.answer).trim() === String(question.correct_answer).trim();
                  return (
                    <tr key={r.student_id}>
                      <td>{r.student_id}</td>
                      <td style={{ fontSize: 18, fontWeight: 'bold' }}>{r.answer}</td>
                      <td style={{ fontWeight: 'bold' }}>{ok ? '〇' : '×'}</td>
                      <td>{new Date(r.updated_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
