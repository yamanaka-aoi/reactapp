import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './ClassBoard.css';

export default function ClassBoard() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [subs, setSubs] = useState([]);
  const [hideIds, setHideIds] = useState(true);

  /* =========================
     セッション よみこみ
  ========================= */
  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      const { data } = await supabase
        .from('class_sessions')
        .select('id, code')
        .eq('id', sessionId)
        .maybeSingle();

      if (!data) {
        alert('じゅぎょう が みつかりません');
        navigate('/');
        return;
      }
      setSession(data);
    })();
  }, [sessionId, navigate]);

  /* =========================
     さいしん もんだい
  ========================= */
  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      const { data } = await supabase
        .from('class_questions')
        .select('id, text, correct_answer, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1);

      setQuestion(data?.[0] ?? null);
    })();
  }, [sessionId]);

  /* =========================
     リアルタイム：もんだい
  ========================= */
  useEffect(() => {
    if (!sessionId) return;

    const ch = supabase
      .channel(`board_q_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_questions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setQuestion(payload.new);
          setSubs([]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [sessionId]);

  /* =========================
     リアルタイム：こたえ
  ========================= */
  useEffect(() => {
    if (!sessionId || !question) return;

    (async () => {
      const { data } = await supabase
        .from('class_submissions')
        .select('student_id, answer, updated_at')
        .eq('session_id', sessionId)
        .eq('question_id', question.id);

      setSubs(data || []);
    })();

    const ch = supabase
      .channel(`board_a_${sessionId}_${question.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_submissions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row || row.question_id !== question.id) return;

          setSubs((prev) => {
            const rest = prev.filter((x) => x.student_id !== row.student_id);
            return [...rest, row];
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [sessionId, question]);

  /* =========================
     しゅうけい
  ========================= */
  const stats = useMemo(() => {
    const total = subs.length;
    if (!question) return { total, ok: 0, ng: 0 };

    const ok = subs.filter(
      (s) => String(s.answer) === String(question.correct_answer)
    ).length;

    return { total, ok, ng: total - ok };
  }, [subs, question]);

  return (
    <div className="board-wrap">
      {/* ===== ヘッダー ===== */}
      <header className="board-header">
        <div className="board-title">こたえ ボード</div>

        {session && (
          <div className="board-code">
            コード：
            <span className="board-code-num">{session.code}</span>
          </div>
        )}
      </header>

      {/* ===== もんだい ===== */}
      <section className="board-question">
        <div className="board-question-label">いま の もんだい</div>
        <div className="board-question-text">
          {question ? question.text : 'もんだい を まって います'}
        </div>
      </section>

      {/* ===== しゅうけい ===== */}
      <section className="board-stats">
        <div className="stat">
          <div className="stat-num">{stats.total}</div>
          <div className="stat-label">こたえ た ひと</div>
        </div>
        <div className="stat">
          <div className="stat-num">{stats.ok}</div>
          <div className="stat-label">せいかい</div>
        </div>
        <div className="stat">
          <div className="stat-num">{stats.ng}</div>
          <div className="stat-label">ちがう</div>
        </div>
      </section>

      {/* ===== こたえ カード ===== */}
      <main className="board-grid">
        {subs.length === 0 ? (
          <div className="board-empty">
            まだ こたえ が ありません
          </div>
        ) : (
          subs.map((r) => {
            const ok =
              question &&
              String(r.answer) === String(question.correct_answer);

            return (
              <div key={r.student_id} className={`card ${ok ? 'ok' : 'ng'}`}>
                <div className="card-top">
                  <div className="card-id">
                    {hideIds ? 'せいと' : `ID ${r.student_id}`}
                  </div>
                  <div className="card-mark">{ok ? '〇' : '×'}</div>
                </div>
                <div className="card-answer">{r.answer}</div>
              </div>
            );
          })
        )}
      </main>

      {/* ===== フッター ===== */}
      <footer className="board-footer">
        <button
          className="board-btn"
          onClick={() => setHideIds((v) => !v)}
        >
          {hideIds ? 'ID を ひょうじ' : 'ID を かくす'}
        </button>

        <button className="board-btn" onClick={() => navigate('/')}>
          スタート へ
        </button>
      </footer>
    </div>
  );
}
