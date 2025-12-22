import { useNavigate } from 'react-router-dom';

const Level = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>難易度選択</h1>

      <button onClick={() => navigate('/game', { state: { level: 1 } })}>
        かんたん
      </button>

      <button onClick={() => navigate('/game', { state: { level: 2 } })}>
        ふつう
      </button>

      <button onClick={() => navigate('/game', { state: { level: 3 } })}>
        むずかしい
      </button>

      <br /><br />

      <button onClick={() => navigate('/')}>戻る</button>
    </div>
  );
};

export default Level;
