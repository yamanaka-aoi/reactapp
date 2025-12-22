import { useNavigate } from 'react-router-dom';
import './App.css';

const Start = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <>
      <h1 className="title">計算アプリ</h1>

      <p style={{ textAlign: 'center' }}>
        ログインID：{user.id}（{user.role}）
      </p>

      <div className="button-group">
        {/* 👨‍🎓 生徒 */}
        {user.role === 'student' && (
          <button onClick={() => navigate('/level')}>
            始める
          </button>
        )}

        {/* 👨‍🏫 教師 */}
{user.role === 'teacher' && (
  <>
    <button onClick={() => navigate('/teacher')}>
      ログイン管理
    </button>

    <button onClick={() => navigate('/create')}>
      作る
    </button>
  </>
)}


        <button onClick={onLogout}>ログアウト</button>
      </div>
    </>
  );
};

export default Start;
