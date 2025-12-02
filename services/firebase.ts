import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, push, Database, DataSnapshot } from 'firebase/database';
import { GameState, RoomData, PlayerColor } from '../types';

// Jouw specifieke Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyDDVm1CBHYXP4uof0v7GiAbW1p36qWbrZs",
  authDomain: "chess-ffaff.firebaseapp.com",
  projectId: "chess-ffaff",
  storageBucket: "chess-ffaff.firebasestorage.app",
  messagingSenderId: "896685074504",
  appId: "1:896685074504:web:6692b5e981f187ae1d507d",
  measurementId: "G-KWK46RL9XQ"
};

class FirebaseService {
  private db: Database;

  constructor() {
    // Initialiseer Firebase direct met de opgegeven config
    try {
      const app = initializeApp(firebaseConfig);
      this.db = getDatabase(app);
      console.log("Firebase succesvol verbonden met project:", firebaseConfig.projectId);
    } catch (e) {
      console.error("Firebase initialisatie fout:", e);
      // Fallback voor het geval er iets misgaat, maar dit zou niet moeten gebeuren met een geldige config
      throw e;
    }
  }

  async createRoom(roomId: string, playerId: string): Promise<boolean> {
    const initialGameState: GameState = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      history: [],
      turn: PlayerColor.WHITE,
      checkmate: false,
      draw: false,
      lastMove: null
    };

    const roomRef = ref(this.db, `rooms/${roomId}`);
    await set(roomRef, {
      id: roomId,
      createdAt: Date.now(),
      gameState: initialGameState,
      players: {
        white: playerId, // Creator plays white by default
        black: null
      }
    });
    return true;
  }

  async joinRoom(roomId: string, playerId: string): Promise<'white' | 'black' | 'spectator' | null> {
    const roomRef = ref(this.db, `rooms/${roomId}`);
    
    return new Promise((resolve) => {
        onValue(roomRef, (snapshot) => {
            const data = snapshot.val() as RoomData;
            if (!data) {
                resolve(null);
                return;
            }

            if (data.players.white === playerId) {
                resolve('white');
            } else if (data.players.black === playerId) {
                resolve('black');
            } else if (!data.players.black) {
                // Join as black
                update(ref(this.db, `rooms/${roomId}/players`), { black: playerId });
                resolve('black');
            } else {
                resolve('spectator');
            }
        }, { onlyOnce: true });
    });
  }

  updateGameState(roomId: string, newState: GameState) {
    update(ref(this.db, `rooms/${roomId}/gameState`), newState);
  }

  subscribeToRoom(roomId: string, callback: (data: RoomData) => void) {
    const roomRef = ref(this.db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) callback(data);
    });
    return unsubscribe;
  }

  sendMessage(roomId: string, sender: string, text: string) {
    const chatRef = ref(this.db, `rooms/${roomId}/messages`);
    push(chatRef, {
      sender,
      text,
      timestamp: Date.now()
    });
  }
}

export const firebaseService = new FirebaseService();