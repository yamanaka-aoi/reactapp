import { useNavigate } from 'react-router-dom';
import './Level.css';

const Level = () => {
  const navigate = useNavigate();

  const goGame = (difficulty) => {
    navigate('/game', {
      state: { difficulty },
    });
  };

  return (
    <div className="level-container">
      <h1 className="level-title">むずかしさを えらんでね</h1>

      <div className="level-buttons">
        <button
          className="easy"
          onClick={() => goGame('easy')}
        >
          かんたん
        </button>

        <button
          className="normal"
          onClick={() => goGame('normal')}
        >
          ふつう
        </button>

        <button
          className="hard"
          onClick={() => goGame('hard')}
        >
          むずかしい
        </button>
      </div>

      <div className="back-button">
        <button onClick={() => navigate('/')}>
          もどる
        </button>
      </div>
    </div>
  );
};

export default Level;
