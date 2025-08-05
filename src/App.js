
import './Start.css';
import { useNavigate } from 'react-router-dom';


const App = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="title">
        <p1>計算アプリ</p1>
      </div>

      <div className="button-group">
        <button onClick={() => navigate('/app2')}>ボタン1</button>
        <button>ボタン2</button>
      </div>
      
    </>
  );
}

export default App;