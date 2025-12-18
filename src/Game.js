import { useLocation, useNavigate } from 'react-router-dom';

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const difficulty = location.state?.difficulty;

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>計算ゲーム</h1>

      <p>選択された難易度：{difficulty}</p>

      <button
        onClick={() => navigate('/level')}
        style={{ marginTop: '24px' }}
      >
        難易度選択に戻る
      </button>
    </div>
  );
};

export default Game;
