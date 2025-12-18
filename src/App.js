import { Routes, Route } from 'react-router-dom';
import Start from './Start';
import Level from './Level';
import Game from './Game';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Start />} />
      <Route path="/level" element={<Level />} />
      <Route path="/game" element={<Game />} />
    </Routes>
  );
}

export default App;
