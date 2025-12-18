import { useNavigate } from 'react-router-dom';
import './App.css';

const Start = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1 className="title">計算アプリ</h1>

      <div className="button-group">
        <button onClick={() => navigate('/level')}>
          始める
        </button>
        <button disabled>
          作る
        </button>
      </div>
    </>
  );
};

export default Start;
