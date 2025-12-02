import React, { useEffect, useState, useMemo } from 'react';
import { Chess, Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { firebaseService } from '../services/firebase';
import { RoomData, PlayerColor } from '../types';
import { Copy, ArrowLeft, Crown } from 'lucide-react';
import { Chat } from './Chat';

interface GameRoomProps {
  roomId: string;
  playerId: string;
  onLeave: () => void;
}

export const GameRoom: React.FC<GameRoomProps> = ({ roomId, playerId, onLeave }) => {
  const [game, setGame] = useState(new Chess());
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [myColor, setMyColor] = useState<'white' | 'black' | 'spectator'>('spectator');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  useEffect(() => {
    // Initial join logic
    const init = async () => {
      const role = await firebaseService.joinRoom(roomId, playerId);
      setMyColor(role || 'spectator');
      if (role === 'black') setOrientation('black');
    };
    init();

    // Subscribe to updates
    const unsubscribe = firebaseService.subscribeToRoom(roomId, (data) => {
      setRoomData(data);
      if (data.gameState) {
        const newGame = new Chess(data.gameState.fen);
        setGame(newGame);
      }
    });

    return () => unsubscribe();
  }, [roomId, playerId]);

  // Handle local moves
  const onDrop = (sourceSquare: string, targetSquare: string): boolean => {
    // Prevent moving if it's not my turn or if I'm a spectator
    if (myColor === 'spectator') return false;
    if (game.turn() === 'w' && myColor !== 'white') return false;
    if (game.turn() === 'b' && myColor !== 'black') return false;
    if (game.isGameOver()) return false;

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to queen for simplicity
      });

      if (move === null) return false;

      // Update local state temporarily for smoothness
      setGame(gameCopy);

      // Push to Firebase
      firebaseService.updateGameState(roomId, {
        fen: gameCopy.fen(),
        history: [...(roomData?.gameState.history || []), move.san],
        turn: gameCopy.turn() === 'w' ? PlayerColor.WHITE : PlayerColor.BLACK,
        checkmate: gameCopy.isCheckmate(),
        draw: gameCopy.isDraw(),
        lastMove: { from: sourceSquare, to: targetSquare }
      });

      return true;
    } catch (e) {
      return false;
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID gekopieerd!');
  };

  const messages = useMemo(() => {
    if (!roomData?.messages) return [];
    return Object.values(roomData.messages).sort((a, b) => a.timestamp - b.timestamp);
  }, [roomData?.messages]);

  const sendChat = (text: string) => {
    firebaseService.sendMessage(roomId, playerId, text);
  };

  const getStatusText = () => {
    if (!roomData) return "Laden...";
    if (game.isCheckmate()) return `Schaakmat! ${game.turn() === 'w' ? 'Zwart' : 'Wit'} wint!`;
    if (game.isDraw()) return "Remise!";
    if (game.isCheck()) return "Schaak!";
    return `Aan de beurt: ${game.turn() === 'w' ? 'Wit' : 'Zwart'}`;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-brand-dark">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-brand-card border-b border-slate-700">
        <div className="flex items-center gap-4">
          <button onClick={onLeave} className="text-slate-400 hover:text-white transition">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white hidden sm:block">SchaakMat</h1>
            <span className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300 font-mono flex items-center gap-2">
              ID: {roomId}
              <Copy size={12} className="cursor-pointer hover:text-white" onClick={copyRoomId} />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-right hidden sm:block">
            <div className="text-brand-muted">Je speelt als</div>
            <div className={`font-bold ${myColor === 'white' ? 'text-white' : myColor === 'black' ? 'text-slate-400' : 'text-yellow-400'}`}>
              {myColor === 'white' ? 'Wit' : myColor === 'black' ? 'Zwart' : 'Toeschouwer'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-white font-bold">
            {myColor === 'white' ? 'W' : myColor === 'black' ? 'Z' : 'T'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-hidden">
        
        {/* Game Board Area */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          <div className="w-full max-w-[600px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-slate-700 bg-slate-800 relative">
             {roomData && (
                 <Chessboard 
                 position={game.fen()} 
                 onPieceDrop={onDrop}
                 boardOrientation={orientation}
                 customDarkSquareStyle={{ backgroundColor: '#334155' }}
                 customLightSquareStyle={{ backgroundColor: '#94a3b8' }}
                 animationDuration={200}
               />
             )}
             
             {/* Waiting Overlay */}
             {roomData && (!roomData.players.white || !roomData.players.black) && (
               <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4">
                 <Crown size={48} className="text-yellow-400 mb-4 animate-bounce" />
                 <h2 className="text-2xl font-bold text-white mb-2">Wachten op tegenstander...</h2>
                 <p className="text-slate-300 mb-4">Deel de Room ID met een vriend om te beginnen.</p>
                 <button onClick={copyRoomId} className="bg-brand-accent px-4 py-2 rounded text-white font-semibold hover:bg-brand-accentHover transition">
                   Kopieer Link ID
                 </button>
               </div>
             )}
          </div>
          
          <div className="mt-4 bg-brand-card px-6 py-3 rounded-full border border-slate-700 shadow-lg text-lg font-semibold text-brand-accent animate-pulse">
            {getStatusText()}
          </div>
        </div>

        {/* Sidebar (History & Chat) */}
        <div className="w-full md:w-80 flex flex-col gap-4 h-[300px] md:h-full">
           <div className="bg-brand-card rounded-lg border border-slate-700 flex-1 flex flex-col overflow-hidden">
             <Chat messages={messages} onSend={sendChat} playerId={playerId} />
           </div>
        </div>

      </main>
    </div>
  );
};
