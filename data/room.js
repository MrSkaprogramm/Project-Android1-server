class Room {
    constructor(roomId) {
        this.roomId = roomId;
        this.client = new Set();
    }

    addClient(clientId) {
        this.client.add(clientId);
    }
}