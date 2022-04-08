const UserOnlineCache = require("../data/user_online_cache");
const { UserDb, UserRow, MessageRow } = require("../data/db");
const UserDb1 = require("../data/db").UserDb;
const mongoose = require('mongoose')
const Constants = require("./socket_consts");
const Utils = require("../utils");
const { SocketIOServerDelegate, SocketDelegate } = require("./socket_io_delegate");
const TelegramBotApi = require("../bots/bot_instance").TelegramBotApi
/**@type  TelegramBotApi*/
const bot = require("../bots/bot_instance").bot;

class RoomApi {


    /**
     * @type UserDb
     */
    _db
    /**@type UserOnlineCache */
    _usersCache

    /**@type SocketIOServerDelegate */
    _io

    constructor() {

    }

    set admin(admin) {
        this._admin = admin
    }

    get admin() {
        return this._admin
    }

    set io(io) {
        this._io = io;
    }

    get io() {
        return this._io;
    }

    set usersCache(cache) {
        this._usersCache = cache;
    }

    get usersCache() {
        return this._usersCache;
    }

    set roomsCache(value) {
        this._roomsCache = value;
    }

    get roomsCache() {
        return this._roomsCache;
    }

    set userDb(value) {
        this._db = value
    }

    get userDb() {
        return this._db
    }

    requestConnectToRoom(clientId, roomId, companionName, companionAge, companionDeviceId, companionAvatar) {
        this.getSocket(clientId).emit(Constants.REQUEST_CONNECT_CLIENT_TO_ROOM,
            {
                room: roomId,
                name: companionName,
                age: companionAge,
                deviceId: companionDeviceId,
                avatar: companionAvatar
            });
    }

    getSocket(socketId) {
        return this._io.getSocketById(socketId)
    }

    autoLeaveClient(clientId, roomId) {
        if (clientId !== roomId) {
            this._io.to(clientId).emit(Constants.REQUEST_LEAVE_CLIENT_FROM_ROOM, { room: roomId });
        } else {
            this._io.to(clientId).emit(Constants.REQUEST_LEAVE_CLIENT_FROM_HOST_ROOM)
        }
    }

    /**
     * 
     * @param {SocketDelegate} clientSocket 
     */
    subscribeListenerClientConnectRoom(clientSocket) {
        clientSocket.on(Constants.CONNECT_CLIENT_TO_ROOM, (data) => {
            if (data !== undefined && data.room !== undefined && data.deviceId !== undefined) {
                let room = this._io.getRoomById(data.room);
                let numClients = 0;

                if (room !== undefined) {
                    let clients = room.sockets;
                    numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;
                }

                if (numClients < 2) {
                    clientSocket.joinToRoom(data.room);
                    //this._db.updateCompanionDeviceId(this._usersCache.getUserById(clientSocket.id()).user.deviceId, data.deviceId)
                    clientSocket.user.user.companionId = data.deviceId
                    let currentUser = this.getUserById(clientSocket.id())
                    currentUser.user.companionId = data.deviceId
                    clientSocket.user.findUser = false;
                    currentUser.findUser = false
                    let user = this._usersCache.getUserByCondition(clientSocket.user, function (user, users) {
                        return users.get(user.socketId);
                    });
                    user.roomId = data.room;
                } else {
                    if (this._usersCache.busyUsers.has(clientSocket.id)) {
                        this._usersCache.moveUserToFree(clientSocket.id);
                    }
                }
            }
        })
    }

    getUserById(id) {
        let user = this._usersCache.getUserById(id)

        if (user === undefined) {
            this._usersCache.addUser(id, user, () => {});
            user = this._usersCache.getUserById(id)
        }

        return user
    }

    /*
        При старте клиента, если клиент имеет собеседника (есть companionId), мы проверяем есть ли он в сети
        И если он в сети, мы назад клиенту отправляем его комнату, а если нет, то оставляем текщего пользователя 
        в его комнате, и при подключении компаньона мы коннектим его к текщему пользаку в комнату
    */
    /**
     * 
     * @param {SocketDelegate} clientSocket 
     */
    subscribeListenerCheckCompanionOnline(clientSocket) {
        clientSocket.on(Constants.CHECK_COMPANION_ONLINE, (data) => {
            if (data !== undefined && data.companionId !== undefined) {
                let onlineUser = this._usersCache.getUserByDeviceId(data.companionId)
                this._db.getUser(data.companionId, (res) => {
                    if (res !== undefined && res !== null) {
                        this._usersCache.moveUserToBusy(clientSocket.id())
                        let companion_id = res.companion_id

                        if (companion_id === "") {
                            companion_id = data.companionId
                        }

                        if (companion_id !== "") {
                            if (onlineUser !== undefined) {
                                this._io.to(onlineUser.socketId).emit(Constants.SERVER_NOTIFY_UPDATE_ROOM,
                                    {
                                        room: onlineUser.socketId,
                                        name: clientSocket.user.user.name,
                                        age: clientSocket.user.user.age,
                                        deviceId: clientSocket.user.user.deviceId,
                                        avatar: clientSocket.user.user.avatar
                                    })
                                clientSocket.emit(Constants.CONTINUE_CONNECT_ROOM_COMPANION_ONLINE,
                                    {
                                        room: onlineUser.socketId,
                                        name: res.name,
                                        age: res.age,
                                        deviceId: res.deviceId,
                                        avatar: res.avatar
                                    })
                            } else {
                                clientSocket.emit(Constants.CONTINUE_CONNECT_ROOM_COMPANION_OFFLINE,
                                    {
                                        room: clientSocket.id(),
                                        name: res.name,
                                        age: res.age,
                                        deviceId: res.deviceId,
                                        avatar: res.avatar
                                    })
                            }
                        } else {
                            this._db.updateCompanionDeviceId(clientSocket.user.user.deviceId, "")
                            this._db.updateCompanionDeviceId(data.companionId, "")
                            this.autoLeaveClient(clientSocket, clientSocket.id())
                        }
                    } else {
                        this._db.updateCompanionDeviceId(clientSocket.user.user.deviceId, "")
                        this._db.updateCompanionDeviceId(data.companionId, "")
                        this.autoLeaveClient(clientSocket, clientSocket.id())
                    }
                })
            } else {
                this._db.updateCompanionDeviceId(clientSocket.user.user.deviceId, "")
                this._db.updateCompanionDeviceId(data.companionId, "")
                this.autoLeaveClient(clientSocket, clientSocket.id())
            }
        })
    }

    /*
        Запрос со стороны клиента (при старте приложения клиентского) на получение не отправленных сообщений,
        если клиент при авторизации находится в чате
    */
    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerGetMessagesCompanion(clientSocket) {
        clientSocket.on(Constants.GET_UNREADED_MESSAGES, (data) => {
            this._db.getMessages(clientSocket.user.user.deviceId, (res) => {
                if (res !== null && res.length > 0) {
                    clientSocket.emit(Constants.GET_UNREADED_MESSAGES,
                        {
                            messages: res
                        })
                    //this._db.deleteMessages(clientSocket.user.user.deviceId, (res) => { })
                } else {
                    clientSocket.emit(Constants.GET_UNREADED_MESSAGES,
                        {
                            messages: []
                        })
                }
            })
        })
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerReportCompanion(clientSocket) {
        clientSocket.on(Constants.CLIENT_REPORT_COMPANION, (data) => {
            if (data !== undefined && data.room !== undefined && data.deviceId) {
                /**data has deviceId and room */
                this._db.addReport(data.deviceId, (res) => {
                    //this._db
                    this._db.getUser(data.deviceId, (res) => {
                        if (res !== null) {
                            let userData = res
                            this._db.getLastNReports(data.deviceId, Constants.COUNT_REPORTS_FOR_BAN, (res) => {
                                if (res !== null && res.length > 0) {
                                    if (res.size >= Constants.COUNT_REPORTS_FOR_BAN) {

                                        if ((res[res.size - 1] - res[0]) <= Constants.PERIOD_FOR_BAN) {
                                            /* if (userData.count_lock == 0) {
                                                this._db.updateLock(data.deviceId, (res) => {
                                                })
                                            } else {
                                                this._db.updateBlock(data.deviceId, (res) => {
                                                })
                                            } */

                                            this._db.updateLock(data.deviceId, (res) => {
                                                let companion = this._usersCache.getUserByDeviceId(data.deviceId)

                                                if (companion !== undefined && companion !== null) {
                                                    this._io.getSocketById(companion.socketId).emit(Constants.SERVER_BAN_COMPANION)
                                                    this._usersCache.removeUser(companion.socketId, () => {
                                                        this.notifyChangeUsers()
                                                    })
                                                }
                                            })
                                        } else {
                                            let companion = this._usersCache.getUserByDeviceId(data.deviceId)

                                            if (companion !== undefined && companion !== null) {
                                                this._io.getSocketById(companion.socketId).emit(Constants.SERVER_REPORT_COMPANION)
                                                this._usersCache.moveUserToFree(companion.socketId)
                                            }
                                        }

                                    } else {
                                        let companion = this._usersCache.getUserByDeviceId(data.deviceId)

                                        if (companion !== undefined && companion !== null) {
                                            this._io.getSocketById(companion.socketId).emit(Constants.SERVER_REPORT_COMPANION)
                                            this._usersCache.moveUserToFree(companion.socketId)
                                        }
                                    }
                                }
                            })
                        }
                    })
                })
                this._db.updateCompanionDeviceId(data.deviceId, "")
                this._db.updateCompanionDeviceId(clientSocket.user.user.deviceId, "")

                if (data.currentDeviceId !== undefined) {
                    this._db.updateReportedUsers(data.deviceId, data.currentDeviceId, Date.now() + 183 * 24 * 60 * 60 * 1000, (res) => { })
                    this._db.updateReportedUsers(data.currentDeviceId, data.deviceId, Date.now() + 183 * 24 * 60 * 60 * 1000, (res) => { })
                }

                this._db.deleteMessages(data.deviceId, (res) => { })

                this._db.deleteMessages(clientSocket.user.user.deviceId, (res) => { })

                this.leaveRoom(clientSocket.socket(), data.room)
                let companion = this._usersCache.getUserByDeviceId(data.deviceId)

                if (companion !== undefined && companion !== null) {
                    this.leaveRoom(this._io.getSocketById(companion.socketId), data.room)
                }
            }
        })
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerContinueConnectRoomCompanionOnline(clientSocket) {
        clientSocket.on(Constants.CONTINUE_CONNECT_ROOM_COMPANION_ONLINE, (data) => {
            if (data !== undefined && data.room !== undefined) {
                clientSocket.joinToRoom(data.room);
            }
        })
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerClientLeaveRoom(clientSocket) {
        clientSocket.on(Constants.LEAVE_CLIENT_TO_ROOM, (data) => {
            if (data !== undefined && data.room !== undefined && clientSocket.id() !== data.room) {
                this.leaveRoom(clientSocket.socket(), data.room)
            }

            this._usersCache.moveUserToFree(clientSocket.id())

            this._db.getUser(clientSocket.user.user.deviceId, (res) => {
                this._db.updateCompanionDeviceId(res.companion_id, "")
                this._db.updateCompanionDeviceId(clientSocket.user.user.deviceId, "")

                this._db.updateReportedUsers(clientSocket.user.user.deviceId, res.companion_id, Date.now() + 15 * Constants.MINUTE, (res) => { })
                this._db.updateReportedUsers(res.companion_id, clientSocket.user.user.deviceId, Date.now() + 15 * Constants.MINUTE, (res) => { })

                this._db.deleteMessages(res.companion_id, (res1) => { })

                this._db.deleteMessages(clientSocket.user.user.deviceId, (res1) => { })

            })

            if (data !== undefined && data.room !== undefined) {
                let room = this._io.getRoomById(data.room)

                if (room !== undefined) {
                    let clients = room.sockets;
                    let keys = Object.keys(clients)

                    for (let socketId of keys) {
                        if (clientSocket.id() !== socketId) {
                            this.leaveRoom(this._io.getSocketById(socketId))
                            this._usersCache.moveUserToFree(socketId)
                            this.autoLeaveClient(socketId, data.room)
                        }
                    }
                }
            }
        })
    }

    /**
     * 
     * @param {SocketIO.Socket} clientSocket 
     * @param {string} room 
     */
    leaveRoom(clientSocket, room) {
        if (clientSocket.id !== room) {
            clientSocket.leave(room)
        }
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerTypingMessage(clientSocket) {
        clientSocket.on(Constants.TYPING_MESSAGE, (data) => {
            if (data !== undefined && data.room !== undefined && data.typing !== undefined) {
                this._io.to(data.room).emit(Constants.TYPING_MESSAGE,
                    {
                        room: data.room,
                        typing: data.typing,
                        deviceId: clientSocket.user.user.deviceId
                    })
            }
        })
    }

    checkNeededSendFirebaseMessage(messageId, deviceId, data) {
        setTimeout(() => {
            this._db.getMessage(messageId, (messageData) => {
                if (messageData.isReaded !== undefined && messageData.isReaded !== null && !messageData.isReaded) {
                    this._db.getUser(deviceId, (res) => {
                        if (res.firebaseId !== undefined && res.firebaseId !== null && res.firebaseId !== "") {
                            var message = {
                                data: {
                                    deviceId: messageData.deviceId,
                                    timestamp: messageData.timestamp.toString(),
                                    readerDeviceId: messageData.readerDeviceId,
                                    message: messageData.message,
                                    name: data.name.replace("_number_", "№"),
                                    _id: messageData._id.toString()
                                },
                                token: res.firebaseId
                            };

                            this._admin.messaging().send(message)
                                .then((response) => {
                                    // Response is a message ID string.
                                    console.log('Successfully sent message firebase:', response);
                                })
                                .catch((error) => {
                                    console.log('Error sending message: firebase', error);
                                });
                        }
                    })
                }
            })
        }, 2000)
    }

    //Слушатель на отправку сообщений собеседникам
    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerNewMessageToRoom(clientSocket) {
        clientSocket.on(Constants.NEW_MESSAGE, (data) => {
            if (data !== undefined && data.room !== undefined && data.message !== undefined && data.senderDeviceId !== undefined && data.companionDeviceId) {
                let timestamp = new Date().getTime()
                let user = this._usersCache.getUserByDeviceId(data.companionDeviceId)
                console.log(`Message\n\tSenderID:\n\t\t ${data.senderDeviceId}\n\tText:\n\t\t${data.message}\n\tCompanionID:\n\t\t${data.companionDeviceId}`);

                new Promise(async (resolve, reject) => {
                    try {
                        let messageForUser = new MessageRow()
                        messageForUser.timestamp = timestamp
                        messageForUser.deviceId = data.senderDeviceId
                        messageForUser.readerDeviceId = data.senderDeviceId
                        messageForUser.message = data.message
                        messageForUser.deleteTimestamp = Date.now() + 2 * Constants.DAY
                        let user = await messageForUser.save()
                        let messageForCompanion = new MessageRow()
                        messageForCompanion.timestamp = timestamp
                        messageForCompanion.deviceId = data.senderDeviceId
                        messageForCompanion.readerDeviceId = data.companionDeviceId
                        messageForCompanion.message = data.message
                        messageForCompanion.deleteTimestamp = Date.now() + 2 * Constants.DAY
                        let companion = await messageForCompanion.save()
                        this.checkNeededSendFirebaseMessage(user._id.toString(), data.senderDeviceId, data)
                        this.checkNeededSendFirebaseMessage(companion._id.toString(), data.companionDeviceId, data)
                        /* setTimeout(() => {
                            this._db.getMessage(user._id, (messageData) => {
                                if (!messageData.isReaded) {
                                    this._db.getUser(user._id, (res) => {
                                        var message = {
                                            data: {
                                                deviceId: messageData.deviceId,
                                                timestamp: messageData.timestamp.toString(),
                                                readerDeviceId: messageData.readerDeviceId,
                                                message: messageData.message,
                                                name: data.name.replace("_number_", "№"),
                                                _id: messageData._id.toString()
                                            },
                                            token: res.firebaseId
                                        };

                                        if (res.firebaseId !== undefined && res.firebaseId !== null && res.firebaseId !== "") {
                                            this._admin.messaging().send(message)
                                                .then((response) => {
                                                    // Response is a message ID string.
                                                    console.log('Successfully sent message firebase:', response);
                                                })
                                                .catch((error) => {
                                                    console.log('Error sending message: firebase', error);
                                                });
                                        }
                                    })
                                }
                            })
                        }, 2000)
                        setTimeout(() => {
                            this._db.getMessage(user._id, (messageData) => {
                                if (!messageData.isReaded) {
                                    this._db.getUser(data.companionDeviceId, (res) => {
                                        var message = {
                                            data: {
                                                deviceId: messageData.deviceId,
                                                timestamp: messageData.timestamp.toString(),
                                                readerDeviceId: messageData.readerDeviceId,
                                                message: messageData.message,
                                                name: data.name.replace("_number_", "№"),
                                                _id: messageData._id.toString()
                                            },
                                            token: res.firebaseId
                                        };

                                        if (res.firebaseId !== undefined && res.firebaseId !== null && res.firebaseId !== "") {
                                            this._admin.messaging().send(message)
                                                .then((response) => {
                                                    // Response is a message ID string.
                                                    console.log('Successfully sent message firebase:', response);
                                                })
                                                .catch((error) => {
                                                    console.log('Error sending message: firebase', error);
                                                });
                                        }
                                    })
                                }
                            })
                        }, 2000) */
                        if (user === undefined) {
                            this._db.getUser(res.readerDeviceId, (res) => {
                                this._io.to(data.room).emit(Constants.NEW_MESSAGE,
                                    {
                                        senderId: user._id,
                                        readerId: companion._id,
                                        room: data.room,
                                        message: data.message,
                                        senderDeviceId: data.senderDeviceId,
                                        name: res.name.replace("_number_", "№"),
                                        timestamp: timestamp
                                    });
                            })
                        } else {
                            this._io.to(data.room).emit(Constants.NEW_MESSAGE,
                                {
                                    senderId: user._id,
                                    readerId: companion._id,
                                    room: data.room,
                                    message: data.message,
                                    senderDeviceId: data.senderDeviceId,
                                    name: data.name !== "" ? data.name.replace("_number_", "№") : user.user.name.replace("_number_", "№"),
                                    timestamp: timestamp
                                });
                        }
                    } catch (err) {
                        bot.sendErrorPost(err.stack)

                        setTimeout(function () {
                            throw err
                        }, 1000)
                    }
                    resolve(1)
                })

                /* if (user === undefined) {
                    let messageForCompanion = new MessageRow()
                    MessageRow.updateMany()
                    messageForCompanion.timestamp = timestamp
                    messageForCompanion.deviceId = clientSocket.user.user.deviceId
                    messageForCompanion.readerDeviceId = data.companionDeviceId
                    messageForCompanion.message = data.message
                    messageForCompanion.save()
                    this._db.saveMessage(messageForCompanion, (res) => {
                        if (this._db instanceof UserDb) {
                            let messageData = res
                            this._db.getUser(res.readerDeviceId, (res) => {
                                messageData
                                var message = {
                                    data: {
                                        deviceId: messageData.deviceId,
                                        timestamp: messageData.timestamp.toString(),
                                        readerDeviceId: messageData.readerDeviceId,
                                        message: messageData.message,
                                        name: data.name.replace("_number_", "№"),
                                        _id: messageData._id.toString()
                                    },
                                    token: res.firebaseId
                                };

                                if (res.firebaseId !== undefined && res.firebaseId !== null && res.firebaseId !== "") {
                                    this._admin.messaging().send(message)
                                        .then((response) => {
                                            // Response is a message ID string.
                                            console.log('Successfully sent message firebase:', response);
                                        })
                                        .catch((error) => {
                                            console.log('Error sending message: firebase', error);
                                        });
                                }

                                this._io.to(data.room).emit(Constants.NEW_MESSAGE,
                                    {
                                        room: data.room,
                                        message: data.message,
                                        senderDeviceId: data.senderDeviceId,
                                        name: res.name.replace("_number_", "№"),
                                        timestamp: timestamp
                                    });
                            })
                        }

                    })

                } else {
                    this._io.to(data.room).emit(Constants.NEW_MESSAGE,
                        {
                            id:
                                room: data.room,
                            message: data.message,
                            senderDeviceId: data.senderDeviceId,
                            name: data.name !== "" ? data.name.replace("_number_", "№") : user.user.name.replace("_number_", "№"),
                            timestamp: timestamp
                        });
                } */
            }
        })
    }

    subscribeReadMessage(clientSocket) {
        clientSocket.on(Constants.READ_MESSAGE, (data) => {
            if (data.id !== undefined) {
                this._db.updateMessage(data.id)
            }
        })
    }

    subscribeReadMessages(clientSocket) {
        clientSocket.on(Constants.READ_MESSAGE, (data) => {
            if (data.ids !== undefined) {
                this._db.updateMessages(data.ids)
            }
        })
    }
}

module.exports = RoomApi