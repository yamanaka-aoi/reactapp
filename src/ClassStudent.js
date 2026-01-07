import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function ClassStudent({ user }) {
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [session, setSession] = useState(null);      // {id, code}
  const [question, setQuestion] = useState(null);    // {id, text}
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);

  // 参加（コード→session取得）
  const join = async () => {
    const c = code.trim();
    if (!c) return;

    const { data, error } = await supabase
      .from('class_sessions')
      .select('id, code, is_active')
      .eq('code', c)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      alert('参加に失敗: ' + error.message);
      return;
    }
    if (!data) {
      alert('その授業コードは存在しないか、終了しています');
      return;
    }

    setSession({ id: data.id, code: data.code });
  };

  // sessionに入ったら「最新問題」を取得
  useEffect(() => {
    if (!session) return;

    (async () => {
      const { data, error } = await supabase
        .from('class_questions')
        .select('id, text, created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        alert('問題取得に失敗: ' + error.message);
        return;
      }

      setQuestion(data?.[0] ?? null);
    })();
  }, [session]);

  // ✅ Realtime：先生が問題を出したら即反映
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
          setQuestion({ id: q.id, text: q.text });
          setAnswer(''); // 新しい問題が来たら入力リセット
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [session]);

  // 送信（同じ生徒×同じ問題は上書き）
  const sendAnswer = async () => {
    if (!session || !question) return;
    const a = answer.trim();
    if (a === '') return;

    setSending(true);

    const { error } = await supabase.from('class_submissions').upsert(
      {
        session_id: session.id,
        question_id: question.id,
        student_id: user.id,
        answer: a,
      },
      { onConflict: 'session_id,question_id,student_id' }
    );

    setSending(false);

    if (error) {
      alert('送信失敗: ' + error.message);
      return;
    }

    setAnswer('');
  };

  return (
    <div style={{ maxWidth: 520, margin: '30px auto', padding: '0 12px' }}>
      <h1>授業（生徒）</h1>

      {!session ? (
        <>
          <p>先生から教えてもらった「授業コード」を入力して参加します。</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="授業コード"
            style={{ width: '100%', fontSize: 16, padding: 8 }}
          />
          <button onClick={join} style={{ marginTop: 10, width: '100%' }}>
            参加
          </button>
          <div style={{ marginTop: 16 }}>
            <button onClick={() => navigate('/')}>戻る</button>
          </div>
        </>
      ) : (
        <>
          <p>
            参加中：<b>{session.code}</b>（あなたのID：{user.id}）
          </p>

          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>先生の問題</h3>
            {question ? <p style={{ fontSize: 18 }}>{question.text}</p> : <p>先生が問題を出すのを待っています…</p>}
          </div>

          <h3 style={{ marginTop: 16 }}>答え</h3>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="答えを入力"
            style={{ width: '100%', fontSize: 18, padding: 8 }}
            disabled={!question}
          />
          <button
            onClick={sendAnswer}
            disabled={!question || sending || answer.trim() === ''}
            style={{ marginTop: 10, width: '100%' }}
          >
            {sending ? '送信中...' : '送信'}
          </button>

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button onClick={() => { setSession(null); setQuestion(null); setAnswer(''); }}>
              退出
            </button>
            <button onClick={() => navigate('/')}>スタートへ</button>
          </div>
        </>
      )}
    </div>
  );
}
