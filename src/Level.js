import { useNavigate } from 'react-router-dom';

const Level = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1>レベル選択</h1>

      <div className="level-buttons">
        <button>かんたん</button>
        <button>ふつう</button>
        <button>むずかしい</button>
      </div>

      <button onClick={() => navigate('/')}>戻る</button>
    </>
  );
};

export default Level;
