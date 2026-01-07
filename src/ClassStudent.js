import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function ClassStudent({ user }) {
  const navigate = useNavigate();

  // じゅぎょうこーど（6けた・きーぱっどのみ）
  const [code, setCode] = useState('');

  const [session, setSession] = useState(null);   // { id, code }
  const [question, setQuestion] = useState(null); // { id, text }

  // こたえ（きーぱっどのみ）
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);

  /* =========================
     じゅぎょうこーど：きーぱっど
  ========================= */
  const appendCodeDigit = (d) => {
    setCode((prev) => {
      if (prev.length >= 6) return prev;
      return prev + String(d);
    });
  };

  const codeBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  const clearCode = () => {
    setCode('');
  };

  /* =========================
     こたえ：きーぱっど
  ========================= */
  const appendAnswerDigit = (d) => {
    setAnswer((prev) => {
      if (prev === '0') return String(d);
      return prev + String(d);
    });
  };

  const answerBackspace = () => {
    setAnswer((prev) => prev.slice(0, -1));
  };

  const clearAnswer = () => {
    setAnswer('');
  };

  /* =========================
     さんか
  ========================= */
  const join = async () => {
    if (!/^\d{6}$/.test(code)) {
      alert('じゅぎょうこーどは 6けたの すうじです');
      return;
    }

    const { data, error } = await supabase
      .from('class_sessions')
      .select('id, code, is_active')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      alert('さんかに しっぱいしました');
      return;
    }
    if (!data) {
      alert('その じゅぎょうは ありません');
      return;
    }

    setSession({ id: data.id, code: data.code });
    setQuestion(null);
    setAnswer('');
  };

  /* =========================
     もんだい よみこみ
  ========================= */
  useEffect(() => {
    if (!session) return;

    (async () => {
      const { data } = await supabase
        .from('class_questions')
        .select('id, text, created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(1);

      setQuestion(data?.[0] ?? null);
    })();
  }, [session]);

  /* =========================
     りあるたいむ：もんだい
  ========================= */
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
          setAnswer('');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [session]);

  /* =========================
     そうしん
  ========================= */
  const sendAnswer = async () => {
    if (!session || !question) return;
    if (answer === '') return;

    if (!/^\d+$/.test(answer)) {
      alert('すうじだけ いれてください');
      return;
    }

    setSending(true);

    await supabase.from('class_submissions').upsert(
      {
        session_id: session.id,
        question_id: question.id,
        student_id: user.id,
        answer,
      },
      { onConflict: 'session_id,question_id,student_id' }
    );

    setSending(false);
    setAnswer('');
  };

  const leave = () => {
    setSession(null);
    setQuestion(null);
    setAnswer('');
  };

  return (
    <div style={{ maxWidth: 520, margin: '30px auto', padding: '0 12px' }}>
      <h1>じゅぎょう（せいと）</h1>

      {!session ? (
        <>
          <p>
            せんせいから きいた<br />
            「じゅぎょうこーど（6けた）」を<br />
            にゅうりょくして さんかします。
          </p>

          <input
            value={code}
            readOnly
            placeholder="6けたの こーど"
            style={{
              width: '100%',
              fontSize: 22,
              padding: 10,
              textAlign: 'center',
              letterSpacing: '3px',
            }}
          />

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button key={n} onClick={() => appendCodeDigit(n)} style={{ padding: '16px 0', fontSize: 20 }}>
                {n}
              </button>
            ))}
            <button onClick={clearCode} style={{ padding: '16px 0', fontSize: 18 }}>C</button>
            <button onClick={() => appendCodeDigit(0)} style={{ padding: '16px 0', fontSize: 20 }}>0</button>
            <button onClick={codeBackspace} style={{ padding: '16px 0', fontSize: 18 }}>⌫</button>
          </div>

          <button
            onClick={join}
            disabled={!/^\d{6}$/.test(code)}
            style={{ marginTop: 12, width: '100%' }}
          >
            さんか
          </button>

          <div style={{ marginTop: 16 }}>
            <button onClick={() => navigate('/')}>もどる</button>
          </div>
        </>
      ) : (
        <>
          <p>
            さんかちゅう：<b>{session.code}</b><br />
            あなたのID：{user.id}
          </p>

          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
            <h3>せんせいの もんだい</h3>
            {question ? (
              <p style={{ fontSize: 18 }}>{question.text}</p>
            ) : (
              <p>せんせいが もんだいを だすのを まっています…</p>
            )}
          </div>

          <h3 style={{ marginTop: 16 }}>こたえ（きーぱっど）</h3>

          <input
            value={answer}
            readOnly
            placeholder="ここに でます"
            style={{
              width: '100%',
              fontSize: 22,
              padding: 10,
              textAlign: 'center',
            }}
            disabled={!question}
          />

          <div
            style={{
              marginTop: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              opacity: question ? 1 : 0.5,
              pointerEvents: question ? 'auto' : 'none',
            }}
          >
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button key={n} onClick={() => appendAnswerDigit(n)} style={{ padding: '16px 0', fontSize: 20 }}>
                {n}
              </button>
            ))}
            <button onClick={clearAnswer} style={{ padding: '16px 0', fontSize: 18 }}>C</button>
            <button onClick={() => appendAnswerDigit(0)} style={{ padding: '16px 0', fontSize: 20 }}>0</button>
            <button onClick={answerBackspace} style={{ padding: '16px 0', fontSize: 18 }}>⌫</button>
          </div>

          <button
            onClick={sendAnswer}
            disabled={!question || sending || answer === ''}
            style={{ marginTop: 12, width: '100%' }}
          >
            {sending ? 'そうしんちゅう…' : 'そうしん'}
          </button>

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button onClick={leave}>たいしゅつ</button>
            <button onClick={() => navigate('/')}>すたーとへ</button>
          </div>
        </>
      )}
    </div>
  );
}
