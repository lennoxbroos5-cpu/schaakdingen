export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export enum PlayerColor {
  WHITE = 'w',
  BLACK = 'b'
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface GameState {
  fen: string;
  history: string[]; // PGN or SAN array
  turn: PlayerColor;
  checkmate: boolean;
  draw: boolean;
  lastMove: { from: string; to: string } | null;
}

export interface RoomData {
  id: string;
  createdAt: number;
  gameState: GameState;
  players: {
    white: string | null; // Player ID
    black: string | null; // Player ID
  };
  messages?: Record<string, ChatMessage>;
}
