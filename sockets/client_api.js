const UserOnlineCache = require('../data/user_online_cache');
const { UserDb, UserRow, MessageRow } = require('../data/db')
const RoomApi = require('./room_api');
const Constants = require('./socket_consts');
const Utils = require('../utils')
const User = require('../data/user_filter');
const SocketIO = require('socket.io')
const TelegramBotApi = require("../bots/bot_instance").TelegramBotApi
/**@type  TelegramBotApi*/
const bot = require("../bots/bot_instance").bot;
const { SocketIOServerDelegate, SocketDelegate } = require('./socket_io_delegate');

class ClientApi {

    static BOYS = 0
    static GIRLS = 1
    static BOTH = 2

    /**@type {UserDb} */
    _db

    /**@type {UserOnlineCache} */
    _usersCache

    /**@type {SocketIOServerDelegate} */
    _io

    constructor() {

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

    set roomApi(value) {
        this._roomApi = value;
    }

    get roomApi() {
        return this._roomApi;
    }

    set userDb(value) {
        this._db = value
    }

    get userDb() {
        return this._db
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    requestAuthorizedUser(clientSocket) {
        clientSocket.emit(Constants.REQUEST_AUTHORIZED)
    }

    /**
     * @param {SocketDelegate} clientSocket
     * @param {function} subcribeAllListener 
     */
    subscribeListenerCheckUser(clientSocket, subcribeAllListener) {
        clientSocket.on(Constants.CHECK_USER, (data) => {
            if (data.deviceId !== undefined) {
                this.clearOnline()
                this._db.getUser(data.deviceId, (res) => {
                    let user = res
                    if (user !== undefined && user !== null) {
                        clientSocket.user = new User(user.name, clientSocket.id(), user)

                        if (user.companion_id !== "") {
                            let _user_temp = this._usersCache.getUserByDeviceId(data.deviceId)

                            if (_user_temp !== undefined) {
                                this._usersCache.removeUser(_user_temp.socketId, () => {

                                })
                            }

                            this._usersCache.addBusyUser(clientSocket.id(), clientSocket.user, () => {
                                this.notifyChangeUsers()
                            });
                        } else {
                            let _user_temp = this._usersCache.getUserByDeviceId(data.deviceId)

                            if (_user_temp !== undefined) {
                                this._usersCache.removeUser(_user_temp.socketId, () => {

                                })
                            }

                            this._usersCache.addUser(clientSocket.id(), clientSocket.user, () => {
                                this.notifyChangeUsers()
                            });
                        }

                        subcribeAllListener();

                        this._db.getLastNReports(data.deviceId, 1, (res) => {

                            if (!user.block) {
                                if (res !== null && res.length > 0) {

                                    clientSocket.emit(Constants.RESPONSE_CHECK_USER, this._getObject(user, clientSocket.id(), res[0].timestamp))
                                    console.log(`${this._usersCache.getUserById(clientSocket.id()).user.name} connected: ${clientSocket.getAddress()} ${clientSocket.id()}`)
                                } else {
                                    clientSocket.emit(Constants.RESPONSE_CHECK_USER, this._getObject(user, clientSocket.id(), 0))
                                    console.log(`${this._usersCache.getUserById(clientSocket.id()).user.name} connected: ${clientSocket.getAddress()} ${clientSocket.id()}`)
                                }
                            } else {
                                getSocket(companion.socketId).emit(Constants.SERVER_BAN_COMPANION)
                                clientSocket.disconnect()
                            }

                        })

                    } else {
                        this._db.getNumberMitra((count) => {
                            const user = new UserRow()
                            user.name = `Mitra _number_${count}`
                            user.deviceId = data.deviceId

                            this._db.createUser(user, (res_create) => {
                                clientSocket.user = new User(res_create.name, clientSocket.id(), res_create)
                                this._usersCache.addUser(clientSocket.id(), clientSocket.user, () => {
                                    this.notifyChangeUsers()
                                });
                                subcribeAllListener()
                                clientSocket.emit(Constants.RESPONSE_CHECK_USER, this._getObject(res_create, clientSocket.id()))
                                console.log(`New user ${this._usersCache.getUserById(clientSocket.id()).user.name} connected: ${clientSocket.getAddress()} ${clientSocket.id()}`)
                            })

                        })

                    }
                })
            } else {
                clientSocket.disconnect()
            }
        })
    }

    /**
     * @param {SocketDelegate} clientSocket
     * @param {function} subcribeAllListener 
     */
    subscribeListenerInitConnect(clientSocket, subcribeAllListener) {
        clientSocket.on(Constants.INIT_CONNECT, (data) => {
            this._db.getUser(data.deviceId, (res) => {
                let user = res

                if (user !== undefined && user !== null) {
                    clientSocket.user = new User(user.name, clientSocket.id(), user)

                    if (user.companion_id !== "") {
                        let _user_temp = this._usersCache.getUserByDeviceId(data.deviceId)

                        if (_user_temp !== undefined) {
                            this._usersCache.removeUser(_user_temp.socketId, () => {

                            })
                        }

                        this._usersCache.addBusyUser(clientSocket.id(), clientSocket.user, () => {
                            this.notifyChangeUsers()
                        });
                    } else {
                        let _user_temp = this._usersCache.getUserByDeviceId(data.deviceId)

                        if (_user_temp !== undefined) {
                            this._usersCache.removeUser(_user_temp.socketId, () => {

                            })
                        }

                        this._usersCache.addUser(clientSocket.id(), clientSocket.user, () => {
                            this.notifyChangeUsers()
                        });
                    }

                    subcribeAllListener();
                }
            })
        })
    }

    _getObject(res, socketId, lastReport) {
        return {
            name: res.name,
            age: res.age,
            firebaseId: res.firebaseId,
            deviceId: res.deviceId,
            avatar: res.avatar,
            gender: res.gender,
            show_me: res.show_me,
            age_min_companion: res.age_min_companion,
            age_max_companion: res.age_max_companion,
            count_lock: res.count_lock,
            last_date_lock: res.last_date_lock,
            block: res.block,
            license_approve: res.license_approve,
            companion_id: res.companion_id,
            socketId: socketId,
            last_report: lastReport
        }
    }

    /**
     * @param {number} socketId
     */
    getSocket(socketId) {
        return this._io.getSocketById(socketId)
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerGetCountClients(clientSocket) {
        clientSocket.on(Constants.CLIENT_GET_COUNT_CLIENTS, (data) => {
            clientSocket.emit(Constants.SERVER_SEND_COUNTS_CLIENTS,
                {
                    count: (this._usersCache.freeUsers.size + this._usersCache.busyUsers.size)
                })
        })
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerDisconnectingClient(clientSocket) {
        clientSocket.on(Constants.DISCONNECT, (data) => {
            if (clientSocket.user !== undefined && clientSocket.user.name !== undefined) {
                console.log(`${clientSocket.user.name} disconnected. ${clientSocket.getRemoteAddr()} ${clientSocket.id()}`);
            } else {
                console.log(`Unknown user disconnected. ${clientSocket.getRemoteAddr()} ${clientSocket.id()}`);
            }

            this._usersCache.removeUser(clientSocket.id(), () => {
                this.notifyChangeUsers()
            });
            console.log('disconnecting')
            console.log(`free_users ${this._usersCache.freeUsers.size}`)
        })
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerLicenseApprove(clientSocket) {
        clientSocket.on(Constants.LICENSE_APPROVE, (data) => {
            const user = this._usersCache.getUserById(clientSocket.id())

            if (user !== undefined) {
                this._db.licenseApproveUser(user.user.deviceId, true, (res) => { })
                user.user.license_approve = true
            }
        })
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerUpdateFirebaseToken(clientSocket) {
        clientSocket.on(Constants.CLIENT_UPDATE_FIREBASE_TOKEN, (data) => {
            if (data !== undefined && data.token !== undefined) {
                const user = this._usersCache.getUserById(clientSocket.id());

                if (user !== undefined) {
                    this._db.updateFirebase(user.user.deviceId, data.token, (res) => { })
                }
            }
        })
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerRequestFindCompanion(clientSocket, roomApi) {
        clientSocket.on(Constants.REQUEST_FIND_COMPANION, (data) => {
            const user = this.getUserById(clientSocket.id());

            if (data !== undefined && data.deviceId !== undefined && data.deviceId !== "") {
                if (user !== undefined && user.user !== undefined) {
                    this._db.getUser(data.deviceId, (res) => {
                        clientSocket.user.findUser = true
                        this.getUserById(clientSocket.id()).findUser = true
                        user.findUser = true
                        this._usersCache.moveUserToFree(clientSocket.id())
                        this.findUser(clientSocket, roomApi, data.deviceId, res);
                    })
                }
            } else {
                if (user !== undefined && user.user !== undefined) {
                    clientSocket.user.findUser = true
                    user.findUser = true
                    this.getUserById(clientSocket.id()).findUser = true
                    this._usersCache.moveUserToFree(clientSocket.id())
                    this.findUser(clientSocket, roomApi);
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


    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerDontFindCompanion(clientSocket) {
        clientSocket.on(Constants.REQUEST_DONT_FIND_COMPANION, (data) => {
            if (clientSocket.user !== undefined) {
                clientSocket.user.findUser = false
            }

            const user = this._usersCache.getUserById(clientSocket.id());

            if (user !== undefined) {
                user.findUser = false
            }
        })
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    subscribeListenerUpdateUserInfo(clientSocket) {
        clientSocket.on(Constants.UPDATE_USER_INFO, (data) => {
            if (this._usersCache.hasOnlineUser(clientSocket.id())) {
                if (data !== undefined) {
                    if (data.name !== undefined) {
                        this._usersCache.getUserById(clientSocket.id()).name = data.name;
                        this._usersCache.getUserById(clientSocket.id()).user.name = data.name;
                    }

                    if (data.age !== undefined) {
                        this._usersCache.getUserById(clientSocket.id()).user.age = data.age;
                    }

                    if (data.gender !== undefined) {
                        this._usersCache.getUserById(clientSocket.id()).user.gender = data.gender;
                    }

                    if (data.avatar !== undefined) {
                        this._usersCache.getUserById(clientSocket.id()).user.avatar = data.avatar;
                    }

                    if (data.show_me !== undefined) {
                        let show_me = 0

                        if (data.new_version !== undefined) {
                            show_me = data.show_me
                        } else {
                            show_me = 2 - data.show_me
                        }

                        this._usersCache.getUserById(clientSocket.id()).user.show_me = show_me;
                    }

                    if (data.age_min_companion !== undefined) {
                        this._usersCache.getUserById(clientSocket.id()).user.age_min_companion = data.age_min_companion;
                    }

                    if (data.age_max_companion !== undefined) {
                        this._usersCache.getUserById(clientSocket.id()).user.age_max_companion = data.age_max_companion;
                    }

                    this._db.updateUser(this._usersCache.getUserById(clientSocket.id()).user)
                    console.log(`update ${clientSocket.id()} ${data.show_me} ${data.gender}`)
                }
            }
        })
    }

    /**
     * @param {SocketDelegate} clientSocket
     */
    notifyChangeUsers() {
        this.runWithCheker(() => {
            for (let prop in this._io.sockets()) {
                if (prop !== undefined) {
                    this._io.getSocketById(prop).emit(
                        Constants.SERVER_SEND_COUNTS_CLIENTS,
                        {
                            count: (this._usersCache.freeUsers.size + this._usersCache.busyUsers.size)
                        })
                }
            }
        })
    }

    clearOnline() {
        this.runWithCheker(() => {
            for (let user in this._usersCache.freeUsers.values()) {
                if (this._io.getSocketById(user.socketId) === undefined) {
                    this._usersCache.removeUser(user.socketId)
                }
            }
            for (let user in this._usersCache.busyUsers.values()) {
                if (this._io.getSocketById(user.socketId) === undefined) {
                    this._usersCache.removeUser(user.socketId)
                }
            }
        })
    }

    /**
     * @param {SocketDelegate} clientSocket
     * @param {RoomApi} roomApi
     */
    findUser(clientSocket, roomApi, deviceId, userCurrent) {
        let findedUser = this._usersCache.findFilteredUser(clientSocket.user, function (user, users) {
            let availableUsers = new Map(users);
            availableUsers.delete(user.socketId);
            let keys = new Set()

            for (let key of availableUsers.keys()) {
                if (availableUsers.get(key) === undefined) {
                    keys.add(key)
                } else {
                    const companion = availableUsers.get(key).user
                    const currentUser = user.user


                    console.log(`user ${clientSocket.id()}`)
                    console.log(`find companion ${companion.show_me} ${companion.gender}`)
                    console.log(`find current ${currentUser.show_me} ${currentUser.gender}`)

                    if (availableUsers.get(key).findUser === undefined || !availableUsers.get(key).findUser
                        || !(((ClientApi.getShowMeUser(companion.show_me) === ClientApi.getGenderUser(currentUser.gender) 
                        && ClientApi.getShowMeUser(currentUser.show_me) === ClientApi.getGenderUser(companion.gender)))
                            && ClientApi.containsInRange(companion.age, currentUser.age_min_companion, currentUser.age_max_companion)
                            && ClientApi.containsInRange(currentUser.age, companion.age_min_companion, companion.age_max_companion))) {
                        keys.add(key)
                        continue
                    }

                    if (userCurrent !== undefined) {
                        for (let reported_user of userCurrent.reported_users) {
                            if (reported_user.reported_user_device_id === availableUsers.get(key).user.deviceId
                            && reported_user.time_unlock > Date.now()) {
                                keys.add(key)
                                continue
                            }
                        }
                        
                    }                    
                }
            }

            

            for (let value of keys) {
                availableUsers.delete(value)
            }

            return availableUsers;
        });

        if (findedUser !== undefined &&
            findedUser.findUser &&
            findedUser.user.deviceId !== "" &&
            clientSocket.user.user.deviceId !== "") {
            clientSocket.user.findUser = false;
            findedUser.user.findUser = false;
            let clientId = clientSocket.user.socketId;
            let companionId = findedUser.socketId;
            this._usersCache.moveUserToBusy(clientId);
            this._usersCache.moveUserToBusy(companionId);
            let roomId = clientId;

            if (deviceId !== undefined && deviceId !== "" && deviceId !== null) {
                this._db.updateCompanionDeviceId(deviceId, findedUser.user.deviceId)
                this._db.updateCompanionDeviceId(findedUser.user.deviceId, deviceId)
            } else {
                this._db.updateCompanionDeviceId(deviceId, findedUser.user.deviceId)
                this._db.updateCompanionDeviceId(findedUser.user.deviceId, deviceId)
            }


            if (roomApi instanceof RoomApi) {
                roomApi.requestConnectToRoom(
                    clientId,
                    roomId,
                    findedUser.user.name,
                    findedUser.user.age,
                    findedUser.user.deviceId,
                    findedUser.user.avatar);
                roomApi.requestConnectToRoom(
                    companionId,
                    roomId,
                    clientSocket.user.user.name,
                    clientSocket.user.user.age,
                    clientSocket.user.user.deviceId,
                    clientSocket.user.user.avatar);
            }
        }

    }

    /**
     * @param {number} value 
     */
    static getGenderUser(value) {
        if (value == 0) {
            return ClientApi.BOYS
        } else {
            return ClientApi.GIRLS
        }
    }

    /**
     * @param {number} value 
     */
    static getShowMeUser(value) {
        if (value == 0) {
            return ClientApi.BOYS
        } else {
            return ClientApi.GIRLS
        }
    }

    /**
     * @param {number} value
     * @param {number} startRange
     * @param {number} endRange 
     */
    static containsInRange(value, startRange, endRange) {
        return value >= startRange && value <= endRange
    }

    /**
     * 
     * @param {function} func 
     */
    runWithCheker(func) {
        try {
            func()
        } catch (err) {
            console.log(err)
            bot.sendErrorPost(err.stack)

            setTimeout(function () {
                throw err
            }, 1000)
        }
    }
}

module.exports = ClientApi