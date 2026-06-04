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
        this.onPlayerLeftCallback = null;
        this.onProfileDataCallback = null;
        this.onInvoiceLinkCallback = null;
        this.onBuyFrameSuccessCallback = null;
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
                case 'player_left':
                    if (this.onPlayerLeftCallback) this.onPlayerLeftCallback(data.name);
                    break;
                case 'game_start':
                    if (this.onGameStartCallback) this.onGameStartCallback();
                    break;
                case 'sync_action':
                    if (this.onActionCallback) this.onActionCallback(data.payload);
                    break;
                case 'profile_data':
                    if (this.onProfileDataCallback) this.onProfileDataCallback(data);
                    break;
                case 'invoice_link':
                    if (this.onInvoiceLinkCallback) this.onInvoiceLinkCallback(data);
                    break;
                case 'buy_frame_success':
                    if (this.onBuyFrameSuccessCallback) this.onBuyFrameSuccessCallback(data);
                    break;
                case 'error':
                    // Close matching loading screens or loaders if any
                    if (window.closeLoaderModal) window.closeLoaderModal();
                    alert(data.message);
                    break;
            }
        };

        this.socket.onclose = () => {
            console.log("З'єднання з сервером розірвано.");
            if (this.onDisconnectCallback) this.onDisconnectCallback();
        };
    }

    createRoom(name, avatar, tgId = null) {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({
            type: 'create',
            name: name,
            avatar: avatar,
            tg_id: tgId
        }));
    }

    joinRoom(roomCode, name, avatar, tgId = null) {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({
            type: 'join',
            room_code: roomCode,
            name: name,
            avatar: avatar,
            tg_id: tgId
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
