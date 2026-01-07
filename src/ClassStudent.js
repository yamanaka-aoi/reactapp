import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function ClassStudent({ user }) {
  const navigate = useNavigate();

  // ✅ 授業コード（6桁・キーパッドのみ）
  const [code, setCode] = useState('');

  const [session, setSession] = useState(null);      // { id, code }
  const [question, setQuestion] = useState(null);    // { id, text }

  // ✅ 回答（キーパッドのみ：2桁以上OK、0もOK）
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);

  // =========================
  // ✅ 授業コード：キーパッド（最大6桁）
  // =========================
  const appendCodeDigit = (d) => {
    const digit = String(d);
    setCode((prev) => {
      if (prev.length >= 6) return prev; // 最大6桁
      return prev + digit;               // 先頭0もOK
    });
  };

  const codeBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  const clearCode = () => {
    setCode('');
  };

  // =========================
  // ✅ 回答：キーパッド（2桁以上OK、0もOK）
  // =========================
  const appendAnswerDigit = (d) => {
    const digit = String(d);
    setAnswer((prev) => {
      // 先頭0の連続を避けたい場合は置換（例：0→5 で 5）
      // 「00」も許可したいなら、この if を削除してください
      if (prev === '0') return digit;
      return prev + digit;
    });
  };

  const answerBackspace = () => {
    setAnswer((prev) => prev.slice(0, -1));
  };

  const clearAnswer = () => {
    setAnswer('');
  };

  // =========================
  // ✅ 授業参加（コード→session取得）
  // =========================
  const join = async () => {
    const c = code.trim();

    // 6桁チェック（0もOK）
    if (!/^\d{6}$/.test(c)) {
      alert('授業コードは6桁の数字です');
      return;
    }

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
    setQuestion(null);
    setAnswer('');
  };

  // sessionに入ったら「最新問題」を取得（念のため）
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

  // ✅ Realtime：先生が問題を出したら即反映（INSERT）
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

  // =========================
  // ✅ 送信（同じ生徒×同じ問題は上書き）
  // =========================
  const sendAnswer = async () => {
    if (!session || !question) return;

    // 空だけNG（0はOK）
    if (answer === '') return;

    // 数字だけ（保険）
    if (!/^\d+$/.test(answer)) {
      alert('数字のみ入力してください');
      return;
    }

    setSending(true);

    const { error } = await supabase.from('class_submissions').upsert(
      {
        session_id: session.id,
        question_id: question.id,
        student_id: user.id,
        answer: answer.trim(),
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

  const leave = () => {
    setSession(null);
    setQuestion(null);
    setAnswer('');
    setSending(false);
  };

  return (
    <div style={{ maxWidth: 520, margin: '30px auto', padding: '0 12px' }}>
      <h1>授業（生徒）</h1>

      {/* ========== 未参加：授業コード入力（キーパッドのみ） ========== */}
      {!session ? (
        <>
          <p>先生から教えてもらった「授業コード（6桁）」を入力して参加します。</p>

          {/* ✅ 表示専用（手入力不可） */}
          <input
            value={code}
            readOnly
            placeholder="6桁コード"
            style={{
              width: '100%',
              fontSize: 22,
              padding: 10,
              textAlign: 'center',
              letterSpacing: '3px',
            }}
          />

          {/* ✅ 授業コード用キーパッド */}
          <div
            style={{
              marginTop: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => appendCodeDigit(n)}
                style={{ padding: '16px 0', fontSize: 20 }}
              >
                {n}
              </button>
            ))}

            <button onClick={clearCode} style={{ padding: '16px 0', fontSize: 18 }}>
              C
            </button>

            <button onClick={() => appendCodeDigit(0)} style={{ padding: '16px 0', fontSize: 20 }}>
              0
            </button>

            <button onClick={codeBackspace} style={{ padding: '16px 0', fontSize: 18 }}>
              ⌫
            </button>
          </div>

          <button
            onClick={join}
            disabled={!/^\d{6}$/.test(code)}
            style={{ marginTop: 12, width: '100%' }}
          >
            参加
          </button>

          <div style={{ marginTop: 16 }}>
            <button onClick={() => navigate('/')}>戻る</button>
          </div>
        </>
      ) : (
        <>
          {/* ========== 参加中：問題表示＋回答（キーパッドのみ） ========== */}
          <p>
            参加中：<b>{session.code}</b>（あなたのID：{user.id}）
          </p>

          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>先生の問題</h3>
            {question ? (
              <p style={{ fontSize: 18 }}>{question.text}</p>
            ) : (
              <p>先生が問題を出すのを待っています…</p>
            )}
          </div>

          <h3 style={{ marginTop: 16 }}>答え（キーパッド）</h3>

          {/* ✅ 回答表示（手入力不可） */}
          <input
            value={answer}
            readOnly
            placeholder="ここに表示されます"
            style={{
              width: '100%',
              fontSize: 22,
              padding: 10,
              textAlign: 'center',
              letterSpacing: '2px',
            }}
            disabled={!question}
          />

          {/* ✅ 回答用キーパッド（問題がないと押せない） */}
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
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => appendAnswerDigit(n)}
                style={{ padding: '16px 0', fontSize: 20 }}
              >
                {n}
              </button>
            ))}

            <button onClick={clearAnswer} style={{ padding: '16px 0', fontSize: 18 }}>
              C
            </button>

            <button onClick={() => appendAnswerDigit(0)} style={{ padding: '16px 0', fontSize: 20 }}>
              0
            </button>

            <button onClick={answerBackspace} style={{ padding: '16px 0', fontSize: 18 }}>
              ⌫
            </button>
          </div>

          <button
            onClick={sendAnswer}
            disabled={!question || sending || answer === ''}
            style={{ marginTop: 12, width: '100%' }}
          >
            {sending ? '送信中...' : '送信'}
          </button>

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button onClick={leave}>退出</button>
            <button onClick={() => navigate('/')}>スタートへ</button>
          </div>
        </>
      )}
    </div>
  );
}
