import { useNavigate } from 'react-router-dom';
import './Level.css';

const Level = () => {
  const navigate = useNavigate();

  return (
    <div className="level-container">
      <h1 className="level-title">レベルを選んでください</h1>

      <div className="level-buttons">
        <button
          className="easy"
          onClick={() =>
            navigate('/game', {
              state: { difficulty: 'easy' }
            })
          }
        >
          かんたん
        </button>

        <button
          className="normal"
          onClick={() =>
            navigate('/game', {
              state: { difficulty: 'normal' }
            })
          }
        >
          ふつう
        </button>

        <button
          className="hard"
          onClick={() =>
            navigate('/game', {
              state: { difficulty: 'hard' }
            })
          }
        >
          むずかしい
        </button>
      </div>

      <button
        className="back-button"
        onClick={() => navigate('/')}
      >
        戻る
      </button>
    </div>
  );
};

export default Level;
