const TelegramBotApi = require("../bots/bot_instance").TelegramBotApi
/**@type  TelegramBotApi*/
const bot = require("../bots/bot_instance").bot;

class SocketDelegate {
	/**@type {SocketIO.Socket} */
	_socket

	/**
	 * 
	 * @param {SocketIO.Socket} socket 
	 */
	constructor(socket) {
		this._socket = socket
	}

	id() {
		return this._socket.id
	}

	socket() {
		return this._socket
	}

	/**
	 * 
	 * @param {string} event 
	 * @param {Function} listener 
	 */
	on(event, listener) {
		if (!this.hasListener(event)) {
			this._socket.on(event, (data => {
				try {
					listener(data)
				} catch (err) {
					console.log(err)
					bot.sendErrorPost(err.stack)
		
					setTimeout(function () {
						throw err
					}, 1000)
				}
			}))
		}
	}

	/**
	 * 
	 * @param {string} roomId 
	 */
	joinToRoom(roomId) {
		this._socket.join(roomId)
	}

	/**
     * @param {string} nameEvent 
     * @param {SocketIO.Socket} socket
     * @returns {boolean} boolean
     */
    hasListener(nameEvent) {
        return this._socket.listeners(nameEvent).length > 0
	}

	emit(event, data) {
		if (data !== undefined) {
			this._socket.emit(event, data)
		} else {
			this._socket.emit(event)
		}
	}

	getAddress() {
		return this._socket.request.connection.remoteAddress
	}

	getRemoteAddr() {
		return this._socket.remoteAddr
	}

	disconnect() {
		this._socket.disconnect()
	}
}

class SocketIOServerDelegate {
	/**@type {SocketIO.Server} */
	_io
	
    constructor(io) {
		this._io = io
    }

    set io(io) {
        this._io = io;
    }

    get io() {
        return this._io;
	}

	/**
	 * 
	 * @param {string} event 
	 * @param {function(SocketDelegate):void} listener 
	 */
	on(event, listener) {
		this._io.on(event, (socket => {
			listener(new SocketDelegate(socket))
		}))
	}

	/**
	 * 
	 * @param {string} socketId 
	 */
	getSocketById(socketId) {
		return this._io.sockets.sockets[socketId]
	}

	sockets() {
		return this._io.sockets.sockets
	}

	/**
	 * 
	 * @param {string} socketId 
	 */
	to(socketId) {
		return this._io.to(socketId)
	}

	/**
	 * 
	 * @param {string} roomId 
	 */
	getRoomById(roomId) {
		return this._io.sockets.adapter.rooms[roomId]
	}
}

module.exports = { SocketIOServerDelegate, SocketDelegate }