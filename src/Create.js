import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const ITEMS = ['りんご', 'みかん', 'バナナ']; // 表記をここで統一

const difficultyOptions = [
  { value: 'easy', label: 'かんたん' },
  { value: 'normal', label: 'ふつう' },
  { value: 'hard', label: 'むずかしい' },
];

const emptyRow = () => ({ A: 'りんご', B: 1, C: 'みかん', D: 1 });

export default function Create() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [difficulty, setDifficulty] = useState('easy');

  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  const [saving, setSaving] = useState(false);

  // 生徒一覧をDBから読み込み
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('students').select('id').order('id');
      if (error) {
        alert('生徒一覧の取得に失敗: ' + error.message);
        return;
      }
      const list = (data || []).map((r) => r.id);
      setStudents(list);
      if (!studentId && list.length > 0) setStudentId(list[0]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSameAC = useMemo(
    () => rows.some((r) => r.A === r.C),
    [rows]
  );

  const updateRow = (i, patch) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const validate = () => {
    if (!studentId) {
      alert('生徒IDを選択してください');
      return false;
    }
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.A === r.C) {
        alert(`${i + 1}問目：AとCが同じです（別のものにしてください）`);
        return false;
      }
      if (!Number.isFinite(Number(r.B)) || Number(r.B) < 0) {
        alert(`${i + 1}問目：Bは0以上の数にしてください`);
        return false;
      }
      if (!Number.isFinite(Number(r.D)) || Number(r.D) < 0) {
        alert(`${i + 1}問目：Dは0以上の数にしてください`);
        return false;
      }
    }
    return true;
  };

  const saveToDb = async () => {
    if (!validate()) return;

    setSaving(true);

    // ① 同じ（生徒×難易度）の既存セットを消す（複数あっても全部消す）
    const { data: oldSets, error: oldErr } = await supabase
      .from('problem_sets')
      .select('id')
      .eq('student_id', studentId)
      .eq('difficulty', difficulty);

    if (oldErr) {
      setSaving(false);
      alert('既存セット確認に失敗: ' + oldErr.message);
      return;
    }

    if (oldSets && oldSets.length > 0) {
      const ids = oldSets.map((s) => s.id);
      const { error: delErr } = await supabase.from('problem_sets').delete().in('id', ids);
      if (delErr) {
        setSaving(false);
        alert('既存セット削除に失敗: ' + delErr.message);
        return;
      }
      // problem_sets を消すと questions は ON DELETE CASCADE で消える
    }

    // ② 新しい problem_set を作る
    const { data: setRow, error: setErr } = await supabase
      .from('problem_sets')
      .insert([{ student_id: studentId, difficulty }])
      .select('id')
      .single();

    if (setErr) {
      setSaving(false);
      alert('問題セット作成に失敗: ' + setErr.message);
      return;
    }

    const setId = setRow.id;

    // ③ questions を5問まとめて insert
    const questionRows = rows.map((r) => ({
      set_id: setId,
      a: r.A,
      b: Number(r.B),
      c: r.C,
      d: Number(r.D),
    }));

    const { error: qErr } = await supabase.from('questions').insert(questionRows);
    if (qErr) {
      setSaving(false);
      alert('問題の保存に失敗: ' + qErr.message);
      return;
    }

    setSaving(false);
    alert('DBに保存しました（全端末で同期されます）');
    navigate('/teacher');
  };

  return (
    <div style={{ maxWidth: 820, margin: '30px auto', padding: '0 12px' }}>
      <h1>問題を作る（DB保存）</h1>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>生徒ID</div>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {students.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>難易度</div>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {difficultyOptions.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <button onClick={() => navigate('/teacher')} style={{ marginLeft: 'auto' }}>
          戻る
        </button>
      </div>

      {hasSameAC && (
        <p style={{ color: 'crimson', marginTop: 10 }}>
          ⚠ A と C が同じ問題があります（保存できません）
        </p>
      )}

      <hr style={{ margin: '18px 0' }} />

      {rows.map((r, i) => (
        <div key={i} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8, marginBottom: 12 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{i + 1}問目</div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 120px 120px 120px', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>A</div>
              <select value={r.A} onChange={(e) => updateRow(i, { A: e.target.value })}>
                {ITEMS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>B</div>
              <input
                type="number"
                value={r.B}
                onChange={(e) => updateRow(i, { B: e.target.value })}
                min={0}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>C</div>
              <select value={r.C} onChange={(e) => updateRow(i, { C: e.target.value })}>
                {ITEMS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>D</div>
              <input
                type="number"
                value={r.D}
                onChange={(e) => updateRow(i, { D: e.target.value })}
                min={0}
              />
            </div>
          </div>

          <div style={{ marginTop: 10, opacity: 0.8 }}>
            例）{r.A}が{r.B}こ、{r.C}が{r.D}こあります。ぜんぶでなんこ？
          </div>
        </div>
      ))}

      <button onClick={saveToDb} disabled={saving} style={{ width: '100%', padding: 12 }}>
        {saving ? '保存中...' : 'DBに保存'}
      </button>
    </div>
  );
}
