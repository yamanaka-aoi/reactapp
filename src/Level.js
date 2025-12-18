import { useNavigate } from 'react-router-dom';
import './Level.css';

const Level = () => {
  const navigate = useNavigate();

  const goToGame = (difficulty) => {
    navigate('/game', {
      state: { difficulty }
    });
  };

  return (
    <div className="level-container">
      <h1>難易度を選択</h1>

      {/* 難易度ボタンエリア */}
      <div className="level-box">
        <button
          className="level-button easy"
          onClick={() => goToGame('かんたん')}
        >
          かんたん
        </button>

        <button
          className="level-button normal"
          onClick={() => goToGame('ふつう')}
        >
          ふつう
        </button>

        <button
          className="level-button hard"
          onClick={() => goToGame('むずかしい')}
        >
          むずかしい
        </button>

        {/* 左下に戻るボタン */}
        <button
          className="back-button"
          onClick={() => navigate('/')}
        >
          戻る
        </button>
      </div>
    </div>
  );
};

export default Level;
