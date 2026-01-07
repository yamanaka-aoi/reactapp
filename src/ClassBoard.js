import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './ClassBoard.css';

export default function ClassBoard() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);      // {id, code, is_active}
  const [question, setQuestion] = useState(null);    // {id, text, correct_answer}
  const [subs, setSubs] = useState([]);              // [{student_id, answer, updated_at}]
  const [hideIds, setHideIds] = useState(false);     // こども用：ID隠す

  // ① セッション情報（コード表示用）
  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      const { data, error } = await supabase
        .from('class_sessions')
        .select('id, code, is_active')
        .eq('id', sessionId)
        .maybeSingle();

      if (error || !data) {
        alert('じゅぎょうが みつかりません');
        navigate('/');
        return;
      }
      setSession(data);
    })();
  }, [sessionId, navigate]);

  // ② 最新の問題を取得
  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      const { data, error } = await supabase
        .from('class_questions')
        .select('id, text, correct_answer, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error) setQuestion(data?.[0] ?? null);
    })();
  }, [sessionId]);

  // ③ Realtime：問題が出たら切り替え（INSERT）
  useEffect(() => {
    if (!sessionId) return;

    const ch = supabase
      .channel(`board_questions_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_questions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const q = payload.new;
          if (!q) return;
          setQuestion({ id: q.id, text: q.text, correct_answer: q.correct_answer });
          setSubs([]); // 新しい問題になったら、表示はこの問題の答えだけにしたいのでリセット
        }
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [sessionId]);

  // ④ 現在の問題の提出をロード＋Realtime
  useEffect(() => {
    if (!sessionId || !question?.id) return;

    (async () => {
      const { data, error } = await supabase
        .from('class_submissions')
        .select('student_id, answer, updated_at, question_id')
        .eq('session_id', sessionId)
        .eq('question_id', question.id)
        .order('updated_at', { ascending: false });

      if (!error) {
        // 生徒ごとに最新1件を保つ（念のため）
        const map = new Map();
        (data || []).forEach((r) => {
          if (!map.has(r.student_id)) map.set(r.student_id, r);
        });
        setSubs(Array.from(map.values()));
      }
    })();

    const ch = supabase
      .channel(`board_subs_${sessionId}_${question.id}`)
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
          if (!row) return;
          if (row.question_id !== question.id) return;

          setSubs((prev) => {
            const rest = prev.filter((x) => x.student_id !== row.student_id);
            return [{ student_id: row.student_id, answer: row.answer, updated_at: row.updated_at }, ...rest];
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [sessionId, question?.id]);

  const stats = useMemo(() => {
    const total = subs.length;
    if (!question) return { total, ok: 0, ng: total };

    const ok = subs.filter((s) => String(s.answer).trim() === String(question.correct_answer).trim()).length;
    return { total, ok, ng: total - ok };
  }, [subs, question]);

  const list = useMemo(() => {
    // 見やすいようにID順に並べる
    return [...subs].sort((a, b) => (a.student_id > b.student_id ? 1 : -1));
  }, [subs]);

  return (
    <div className="board-wrap">
      <header className="board-header">
        <div className="board-title">じゅぎょう こたえ ぼーど</div>

        <div className="board-header-right">
          {session?.code && (
            <div className="board-code">
              こーど：<span className="board-code-num">{session.code}</span>
            </div>
          )}

          <div className="board-tools">
            <button className="board-btn" onClick={() => setHideIds((v) => !v)}>
              {hideIds ? 'IDを ひょうじ' : 'IDを かくす'}
            </button>
            <button className="board-btn" onClick={() => window.location.reload()}>
              さいよみこみ
            </button>
          </div>
        </div>
      </header>

      <section className="board-question">
        <div className="board-question-label">いまの もんだい</div>
        <div className="board-question-text">
          {question ? question.text : 'まだ もんだいが でていません'}
        </div>
      </section>

      <section className="board-stats">
        <div className="stat">
          <div className="stat-num">{stats.total}</div>
          <div className="stat-label">こたえた ひと</div>
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

      <main className="board-grid">
        {list.length === 0 ? (
          <div className="board-empty">こたえが くるのを まっています…</div>
        ) : (
          list.map((r) => {
            const ok =
              question &&
              String(r.answer).trim() === String(question.correct_answer).trim();

            return (
              <div key={r.student_id} className={`card ${ok ? 'ok' : 'ng'}`}>
                <div className="card-top">
                  <div className="card-id">
                    {hideIds ? 'せいと' : `ID：${r.student_id}`}
                  </div>
                  <div className="card-mark">{ok ? '〇' : '×'}</div>
                </div>
                <div className="card-answer">{r.answer}</div>
              </div>
            );
          })
        )}
      </main>

      <footer className="board-footer">
        <span className="hint">※ このがめんは ひょうじよう（こどもが みる）です</span>
      </footer>
    </div>
  );
}
