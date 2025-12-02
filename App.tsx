import React, { useState } from 'react';
import { GameRoom } from './components/GameRoom';
import { firebaseService } from './services/firebase';
import { Gamepad2, Users, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [playerId] = useState(() => {
    const stored = localStorage.getItem('chess_player_id');
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem('chess_player_id', newId);
    return newId;
  });

  const createGame = async () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    await firebaseService.createRoom(newRoomId, playerId);
    setRoomId(newRoomId);
    setView('game');
  };

  const joinGame = () => {
    if (!inputRoomId.trim()) return;
    setRoomId(inputRoomId.toUpperCase());
    setView('game');
  };

  if (view === 'game') {
    return <GameRoom roomId={roomId} playerId={playerId} onLeave={() => setView('lobby')} />;
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg shadow-blue-500/20">
            <Gamepad2 size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
            SchaakMat
          </h1>
          <p className="text-slate-400">Speel direct schaak met vrienden.</p>
        </div>

        <div className="bg-brand-card/50 backdrop-blur-md border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-6">
            <button 
              onClick={createGame}
              className="w-full group relative overflow-hidden bg-brand-accent hover:bg-brand-accentHover text-white p-4 rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              <div className="relative z-10 flex items-center justify-center gap-3 font-bold text-lg">
                <Gamepad2 size={24} />
                Nieuw Spel Starten
              </div>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-sm">OF DOE MEE</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Room ID (bijv. X7Y2Z)" 
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 text-center text-white font-mono uppercase focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              />
              <button 
                onClick={joinGame}
                disabled={!inputRoomId}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-xl transition-all"
              >
                <ArrowRight size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-slate-500 text-sm bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50">
            <Users size={14} />
            <span>Verbonden met <b>chess-ffaff</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;