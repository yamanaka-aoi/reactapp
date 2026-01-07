import { useNavigate } from 'react-router-dom';

export default function Level({ user }) {
  const navigate = useNavigate();

  const go = (difficulty) => {
    navigate('/game', { state: { difficulty } });
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1>難易度</h1>
      <button onClick={() => go('easy')}>かんたん</button>
      <button onClick={() => go('normal')} style={{ marginLeft: 8 }}>ふつう</button>
      <button onClick={() => go('hard')} style={{ marginLeft: 8 }}>むずかしい</button>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate('/')}>戻る</button>
      </div>
    </div>
  );
}
