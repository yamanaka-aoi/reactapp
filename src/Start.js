import { useNavigate } from 'react-router-dom';
import './App.css';

const Start = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <>
      <h1 className="title">けいさんアプリ</h1>

      <p style={{ textAlign: 'center' }}>
        ログインID：{user.id}（{user.role}）
      </p>

      <div className="button-group">
        {/* 👨‍🎓 生徒 */}
        {user.role === 'student' && (
          <>
          <button onClick={() => navigate('/level')}>始める</button>
          <button onClick={() => navigate('/class')}>授業</button>
          </>
        )}

        {/* 👨‍🏫 教師 */}
        {user.role === 'teacher' && (
          <>
            <button onClick={() => navigate('/class/teacher')}>
              授業問題
            </button>

            <button onClick={() => navigate('/create')}>
              問題を作る
            </button>

            <button onClick={() => navigate('/teacher/results')}>
              生徒の成績を見る
            </button>

            <button onClick={() => navigate('/teacher')}>
              生徒ID管理
            </button>
          </>
        )}

        <button onClick={onLogout}>ログアウト</button>
      </div>
    </>
  );
};

export default Start;
