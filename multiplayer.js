// ==========================================================================
// MULTIPLAYER MANAGEMENT - MONOPOLY UKRAINE
// ==========================================================================

export class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.roomCode = null;
        this.playerId = null;
        this.playersList = [];
        this.onPlayerUpdateCallback = null;
        this.onGameStartCallback = null;
        this.onActionCallback = null;
        this.onDisconnectCallback = null;
    }

    connect(url, name, avatar, onConnected) {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log("Підключено до сервера мультиплеєра!");
            if (onConnected) onConnected();
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Отримано повідомлення:", data);

            switch (data.type) {
                case 'created':
                    this.roomCode = data.room_code;
                    this.playerId = 0;
                    this.playersList = data.players;
                    if (this.onPlayerUpdateCallback) this.onPlayerUpdateCallback(this.playersList);
                    break;
                case 'joined':
                    this.roomCode = data.room_code;
                    this.playerId = data.player_id;
                    this.playersList = data.players;
                    if (this.onPlayerUpdateCallback) this.onPlayerUpdateCallback(this.playersList);
                    break;
                case 'player_update':
                    this.playersList = data.players;
                    if (this.onPlayerUpdateCallback) this.onPlayerUpdateCallback(this.playersList);
                    break;
                case 'game_start':
                    if (this.onGameStartCallback) this.onGameStartCallback();
                    break;
                case 'sync_action':
                    if (this.onActionCallback) this.onActionCallback(data.payload);
                    break;
                case 'error':
                    alert(data.message);
                    break;
            }
        };

        this.socket.onclose = () => {
            console.log("З'єднання з сервером розірвано.");
            if (this.onDisconnectCallback) this.onDisconnectCallback();
        };
    }

    createRoom(name, avatar) {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({
            type: 'create',
            name: name,
            avatar: avatar
        }));
    }

    joinRoom(roomCode, name, avatar) {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({
            type: 'join',
            room_code: roomCode,
            name: name,
            avatar: avatar
        }));
    }

    startGame() {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({
            type: 'start'
        }));
    }

    sendAction(payload) {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({
            type: 'action',
            payload: payload
        }));
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}
