let Utils = require('../utils');
const { Logger } = require('mongodb');
const User = require('./user_filter');

class UserOnlineCache {

    /**@type Map */
    freeUsers

    /**@type Map */
    busyUsers

    constructor() {
        this.freeUsers = new Map();
        this.busyUsers = new Map();
    }

    /**
     * 
     * @param {string} userId 
     * @param {User} user 
     * @param {function callback() {
         
     }} callback 
     */
    addUser(userId, user, callback) {
        this.freeUsers.set(userId, user);
        callback()
    }
    addBusyUser(userId, user, callback) {
        this.busyUsers.set(userId, user);
        callback()
    }

    hasOnlineUser(clientId) {
        let user = this.getUserByCondition(clientId, (userId, users) => {
            return users.get(userId);
        });

        return user != undefined;
    }

    getUserByDeviceId(deviceId) {
        return this.getUserByCondition(
            deviceId,
            (companionDeviceId, users) => {
                let existUser = undefined

                for (let user of users.values()) {
                    if (user.user.deviceId === companionDeviceId) {
                        existUser = user
                    }
                }

                return existUser
            })
    }

    getUserById(userId) {
        return this.getUserByCondition(userId, (userId, users) => {
            return users.get(userId);
        })
    }

    getUserByCondition(user, condition) {
        let fromFreeUser = condition(user, this.freeUsers);

        if (fromFreeUser !== undefined) {
            return fromFreeUser;
        }

        return condition(user, this.busyUsers);
    }

    getFilteredFreeUsers(user, filter) {
        return filter(user, this.freeUsers);
    }

    findFilteredUser(user, filter) {
        let filteredUsers = this.getFilteredFreeUsers(user, filter);

        if (filteredUsers.size > 0) {
            let index = (filteredUsers.size > 1) ? Utils.randomInteger(0, filteredUsers.size - 1) : 0;

            return filteredUsers.get(Array.from(filteredUsers.keys())[index]);
        } else {
            return undefined;
        }
    }

    moveUserToBusy(socketUserId) {
        let user = this.freeUsers.get(socketUserId)
        
        if (user !== undefined) {
            user.findUser = false
            this.busyUsers.set(socketUserId, this.freeUsers.get(socketUserId));
            this.freeUsers.delete(socketUserId);
        }
    }

    moveUserToFree(socketUserId) {
        let user = this.busyUsers.get(socketUserId)

        if (user !== undefined) {
            this.freeUsers.set(socketUserId, this.busyUsers.get(socketUserId));
            this.busyUsers.delete(socketUserId);
        }
    }

    /**
     * @param {string} userId
     * @param {function callback() {
         
     }} callback*/
    removeUser(userId, callback) {
        this.freeUsers.delete(userId);
        this.busyUsers.delete(userId);
        callback()
    }
}

module.exports = UserOnlineCache