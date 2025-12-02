// Importeer de Firebase functies van de CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, push } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// --- 1. CONFIGURATIE ---
const firebaseConfig = {
    apiKey: "AIzaSyDDVm1CBHYXP4uof0v7GiAbW1p36qWbrZs",
    authDomain: "chess-ffaff.firebaseapp.com",
    projectId: "chess-ffaff",
    storageBucket: "chess-ffaff.firebasestorage.app",
    messagingSenderId: "896685074504",
    appId: "1:896685074504:web:6692b5e981f187ae1d507d",
    measurementId: "G-KWK46RL9XQ"
};

// Initialiseer Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Globale Variabelen
let game = new Chess();
let board = null;
let roomId = null;
let playerId = localStorage.getItem('chess_player_id') || 'player_' + Math.random().toString(36).substr(2, 9);
localStorage.setItem('chess_player_id', playerId);
let playerColor = 'spectator'; 
let isGameActive = false;

// --- 2. LOGICA VOOR LOBBY ---

// Hulpfunctie: Genereer Room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Scherm wisselen
function showScreen(screenName) {
    document.getElementById('lobby-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById(screenName + '-screen').classList.remove('hidden');
}

// Maak nieuw spel
document.getElementById('btn-create').addEventListener('click', async () => {
    const newId = generateRoomId();
    roomId = newId;
    
    // Reset room in database
    await set(ref(db, 'rooms/' + roomId), {
        gameState: {
            fen: 'start',
            turn: 'w'
        },
        players: {
            white: playerId,
            black: null
        },
        createdAt: Date.now()
    });

    enterGame(newId, 'white');
});

// Join spel
document.getElementById('btn-join').addEventListener('click', () => {
    const inputId = document.getElementById('input-room-id').value.trim().toUpperCase();
    if (!inputId) return;
    joinGame(inputId);
});

async function joinGame(id) {
    const roomRef = ref(db, 'rooms/' + id);
    
    // Lees één keer de data om te kijken of er plek is
    onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            document.getElementById('lobby-status').innerText = "Room niet gevonden!";
            return;
        }

        roomId = id;
        let assignedRole = 'spectator';

        if (data.players.white === playerId) {
            assignedRole = 'white';
        } else if (data.players.black === playerId) {
            assignedRole = 'black';
        } else if (!data.players.black) {
            // Neem de zwarte plek in
            update(ref(db, 'rooms/' + id + '/players'), { black: playerId });
            assignedRole = 'black';
        }

        enterGame(id, assignedRole);
    }, { onlyOnce: true });
}

function enterGame(id, role) {
    playerColor = role;
    document.getElementById('room-display').innerText = `ID: ${id}`;
    document.getElementById('room-display-mobile').innerText = `ID: ${id}`;
    document.getElementById('player-color-display').innerHTML = `Je speelt als: <span class="font-bold text-white">${role === 'white' ? 'Wit' : (role === 'black' ? 'Zwart' : 'Toeschouwer')}</span>`;
    
    showScreen('game');
    initChessBoard();
    listenToGameUpdates();
    listenToChat();
}

// Terugknoppen
const leaveGame = () => {
    roomId = null;
    showScreen('lobby');
    // Stop luisteren naar database zou netjes zijn, maar voor simpelheid herlaadt de pagina vaak ook
    window.location.reload(); 
};
document.getElementById('btn-leave').addEventListener('click', leaveGame);
document.getElementById('btn-leave-mobile').addEventListener('click', leaveGame);

// Kopiëren van ID
document.getElementById('room-display').addEventListener('click', () => {
    navigator.clipboard.writeText(roomId);
    alert("Room ID gekopieerd!");
});

// --- 3. LOGICA VOOR HET BORD ---

function initChessBoard() {
    game = new Chess(); // Reset logica

    const config = {
        draggable: true,
        position: 'start',
        orientation: playerColor === 'black' ? 'black' : 'white',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };

    // Verwijder oud bord als dat er is
    if(board) board.destroy();
    
    // Maak nieuw bord (gebruikt jQuery selector voor Chessboard.js)
    board = Chessboard('myBoard', config);
    
    // Resize window fix
    window.addEventListener('resize', () => {
        board.resize();
    });
}

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;
    if (playerColor === 'spectator') return false;

    // Mag alleen eigen stukken pakken
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }

    // Mag alleen bewegen als het jouw beurt is
    if ((game.turn() === 'w' && playerColor !== 'white') ||
        (game.turn() === 'b' && playerColor !== 'black')) {
        return false;
    }
}

function onDrop(source, target) {
    // Probeer de zet in chess.js logica
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Altijd promoveren naar koningin voor simpelheid
    });

    // Ongeldige zet?
    if (move === null) return 'snapback';

    // Geldige zet: Update Firebase
    update(ref(db, 'rooms/' + roomId + '/gameState'), {
        fen: game.fen(),
        turn: game.turn()
    });
    
    updateStatus();
}

function onSnapEnd() {
    board.position(game.fen());
}

function updateStatus() {
    let status = '';
    const turn = game.turn() === 'w' ? 'Wit' : 'Zwart';

    if (game.in_checkmate()) {
        status = 'Schaakmat! ' + (game.turn() === 'w' ? 'Zwart' : 'Wit') + ' wint.';
    } else if (game.in_draw()) {
        status = 'Remise!';
    } else {
        status = turn + ' is aan zet';
        if (game.in_check()) {
            status += ' (Schaak!)';
        }
    }
    document.getElementById('game-status').innerText = status;
}

// --- 4. FIREBASE LISTENERS ---

function listenToGameUpdates() {
    const gameRef = ref(db, 'rooms/' + roomId + '/gameState');
    onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.fen) {
            // Update lokale logica
            game.load(data.fen);
            // Update visueel bord
            board.position(data.fen);
            updateStatus();
        }
    });
}

// --- 5. CHAT LOGICA ---

function listenToChat() {
    const chatRef = ref(db, 'rooms/' + roomId + '/messages');
    const chatContainer = document.getElementById('chat-messages');
    chatContainer.innerHTML = ''; // Clear oud

    onValue(chatRef, (snapshot) => {
        const msgs = snapshot.val();
        chatContainer.innerHTML = '';
        if (msgs) {
            Object.values(msgs).forEach(msg => {
                const div = document.createElement('div');
                const isMe = msg.sender === playerId;
                
                div.className = `max-w-[85%] p-2 rounded text-sm mb-2 ${isMe ? 'bg-blue-600 self-end ml-auto text-white' : 'bg-slate-700 text-slate-200'}`;
                div.innerText = msg.text;
                chatContainer.appendChild(div);
            });
            // Scroll naar beneden
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });
}

document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    
    if (text && roomId) {
        push(ref(db, 'rooms/' + roomId + '/messages'), {
            sender: playerId,
            text: text,
            timestamp: Date.now()
        });
        input.value = '';
    }
});
