class RoomCache {
    constructor() {
        this.rooms = new Map();
    }

    addNewRoomIfNeeded(roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }

        return this;
    }

    addClientToRoom(roomId, clientId) {
        let set = this.rooms.get(roomId);

        if (set instanceof Set) {
            set.add(clientId);
        }
    }

    removeUserFromRoom(roomId, clientId) {
        let set = this.rooms.get(roomId);

        if (set instanceof Set) {
            set.delete(clientId);

            if (set.size <= 0) {
                this.rooms.delete(roomId);
            }
        }
    }
}

module.exports = RoomCache