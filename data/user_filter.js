
class User {

    _user

    constructor(name, socketId, user) {
        this.name = name;
        this.socketId = socketId;
        this.user = user
    }

    set name(value) {
        this._name = value;
    }

    get name() {
        return this._name;
    }

    set socketId(value) {
        this._socketId = value;
    }

    get socketId() {
        return this._socketId;
    }

    set roomId(value) {
        this._roomId = value;
    }

    get roomId() {
        return this._roomId;
    }

    set userFinding(value) {
        this._userFinding = value;
    }

    get userFinding() {
        return this._userFinding;
    }

    set user(value) {
        this._user = value
    }

    get user() {
        return this._user
    }

    set companionDeviceId(value) {
        this._companionDeviceId = value
    }

    get companionDeviceId() {
        return this._companionDeviceId
    }
}

module.exports = User
