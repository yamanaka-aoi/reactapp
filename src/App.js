import './App.css';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Level from './Level';

/* ===== スタート画面 ===== */
const Start = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1 className="title">計算アプリ</h1>

      <div className="button-group">
        <button onClick={() => navigate('/level')}>始める</button>
        <button disabled>作る</button>
      </div>
    </>
  );
};

/* ===== ルーティング管理 ===== */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Start />} />
      <Route path="/level" element={<Level />} />
    </Routes>
  );
}

export default App;
