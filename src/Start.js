import { useNavigate } from 'react-router-dom';
import './App.css';

const Start = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* タイトル（ひらがな） */}
      <h1 className="title">けいさん あぷり</h1>

      {/* ログイン情報 */}
      <p style={{ textAlign: 'center' }}>
        ID：{user.id}
      </p>

      <div className="button-group">
        {/* ======================
            👦 せいと
        ====================== */}
        {user.role === 'student' && (
          <>
            <button onClick={() => navigate('/level')}>
              はじめる
            </button>

            <button onClick={() => navigate('/class')}>
              じゅぎょう
            </button>

            <button onClick={onLogout}>
              ろぐあうと
            </button>
          </>
        )}

        {/* ======================
            👨‍🏫 せんせい
            （※ここは漢字のまま）
        ====================== */}
        {user.role === 'teacher' && (
          <>
            <button onClick={() => navigate('/teacher')}>
              生徒ID管理
            </button>

            <button onClick={() => navigate('/create')}>
              問題を作る
            </button>

            <button onClick={() => navigate('/class/teacher')}>
              授業問題
            </button>

            <button onClick={onLogout}>
              ログアウト
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default Start;
