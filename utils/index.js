class Utils {
    /**
     * @param {number} min 
     * @param {number} max
     */
    static randomInteger(min, max) {
        // случайное число от min до (max+1)
        let rand = min + Math.random() * (max + 1 - min);

        return Math.floor(rand);
    }

    /**
     * @param {string} nameEvent 
     * @param {SocketIO.Socket} socket
     * @returns {boolean} boolean
     */
    static hasListener(nameEvent, socket) {
        return socket.listeners(nameEvent).length > 0
    }
    /**
     * @param {string} nameEvent 
     * @param {SocketIO.Socket} socket
     * @param {function} listener
     */
    static addListener(nameEvent, socket, listener) {
        if (!this.hasListener(nameEvent, socket)) {
            socket.on(nameEvent, listener)
        }
    }
}

module.exports = Utils