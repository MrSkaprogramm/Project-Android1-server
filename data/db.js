const { time } = require("console");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const TelegramBotApi = require("../bots/bot_instance").TelegramBotApi
/**@type  TelegramBotApi*/
const bot = require("../bots/bot_instance").bot;

const countMitraScheme = new Schema({
    count: Number
})

const userScheme = new Schema({
    name: {
        type: String,
        required: true
    },
    gender: {
        type: Number,
        default: 0
    },
    age: {
        type: Number,
        default: 0
    },
    firebaseId: {
        type: String
    },
    deviceId: {
        type: String,
        required: true
    },
    avatar: {
        type: Number,
        default: 500
    },
    show_me: {
        type: Number,
        default: 1
    },
    age_min_companion: {
        type: Number,
        default: 18
    },
    age_max_companion: {
        type: Number,
        default: 100
    },
    count_lock: {
        type: Number,
        default: 0
    },
    last_date_lock: {
        type: Number,
        default: 0
    },
    block: {
        type: Boolean,
        default: false
    },
    license_approve: {
        type: Boolean,
        default: false
    },
    companion_id: {
        type: String,
        default: ""
    },
    reported_users: [
        {
            reported_user_device_id: String,
            time_unlock: {
                type: Number,
                default: 0
            }
        }]

});

const messageSchema = new Schema({
    deviceId: {
        type: String,
        required: true
    },
    readerDeviceId: {
        type: String,
        required: true
    },
    message: {
        type: String
    },
    timestamp: {
        type: Number,
        default: 0
    },
    deleteTimestamp: {
        type: Number,
        default: 0
    },
    isReaded: {
        type: Boolean,
        default: false
    }
});

const reportSchema = new Schema({
    deviceId: {
        type: String,
        required: true
    },
    timestamp: {
        type: Number,
        default: 0
    }

})

const UserRow = mongoose.model("User", userScheme)
const NumberMitra = mongoose.model("CountMitra", countMitraScheme)
const MessageRow = mongoose.model("Messages", messageSchema)
const Reports = mongoose.model("Reports", reportSchema)



class UserDb {
    constructor() {
    }

    /**
     * 
     * @param {function(any):void} processNumberMitra 
     */
    getNumberMitra(processNumberMitra) {
        NumberMitra.find({}, (err, res) => {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                if (res !== null) {
                    let currentRow = res[0]

                    if (currentRow != undefined && currentRow !== null) {
                        currentRow.count = currentRow.count + 1
                        processNumberMitra(currentRow.count)
                        currentRow.save()
                    } else {
                        const countMitra = new NumberMitra()
                        countMitra.count = 1
                        processNumberMitra(countMitra.count)
                        countMitra.save()
                    }
                } else {
                    const countMitra = new NumberMitra()
                    countMitra.count = 1
                    processNumberMitra(countMitra.count)
                    countMitra.save()
                }
            })
        })
    }

    /**
     * 
     * @param {string} deviceId 
     * @param {function(any):void} funcProcessing 
     */
    getUser(deviceId, funcProcessing) {
        UserRow.findOne({ deviceId: deviceId }, function (err, res) {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                funcProcessing(res)
            })
        })
    }

    /**
     * 
     * @param {function(any):void} funcProcessing 
     */
    getUsers(funcProcessing) {
        UserRow.find({}, function (err, res) {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                funcProcessing(res)
            })
        })
    }

    /**
     * 
     * @param {Object} userRow 
     * @param {function(any):void} funcProcessing 
     */
    createUser(userRow, funcProcessing) {
        userRow.save(function (err, res) {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                funcProcessing(res)
            })
        })
    }

    /**
     * 
     * @param {String} deviceId 
     * @param {Boolean} approve 
     */
    licenseApproveUser(deviceId, approve, funcSuccess) {
        UserRow.updateOne({ deviceId: deviceId }, { license_approve: approve }, function (err, res) {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                console.log(res)

                funcSuccess(res)
            })
        })
    }

    /**
     * 
     * @param {string} deviceId 
     * @param {string} firebaseToken 
     */
    updateFirebase(deviceId, firebaseToken, funcProcessing) {
        UserRow.updateOne({ deviceId: deviceId }, { firebaseId: firebaseToken }, (err, res) => {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                console.log(res)
                funcProcessing(res)
            })
        })
    }

    /**
     * 
     * @param {String} deviceId 
     * @param {String} reportedDeviceId 
     * @param {function(any): void} funcProcessing
     */
    updateReportedUsers(deviceId, reportedDeviceId, time, funcProcessing) {
        UserRow.updateOne(
            { deviceId: deviceId },
            {
                $push: {
                    reported_users: {
                        reported_user_device_id: reportedDeviceId,
                        time_unlock: time
                    }
                }
            },
            (err, res) => {
                UserDb.tryCatchDelegate(err, res, (err, res) => {
                    console.log(res)
                    funcProcessing(res)
                })
            })
    }

    /**
     * 
     * @param {String} deviceId 
     * @param {String} reportedDeviceId 
     * @param {function(any): void} funcProcessing
     */
    dropInfoReportedUsers(deviceId, reportedDeviceId, funcProcessing) {
        UserRow.updateOne(
            { deviceId: deviceId },
            {
                $pull: {
                    reported_users: {
                        reported_user_device_id: reportedDeviceId
                    }
                }
            },
            (err, res) => {
                UserDb.tryCatchDelegate(err, res, (err, res) => {
                    console.log(res)
                    funcProcessing(res)
                })
            })
    }

    /**
     * 
     * @param {string} deviceId 
     * @param {function(any):void} funcProcessing 
     */
    updateCompanionDeviceId(deviceId, companionDeviceId) {
        UserRow.updateOne(
            {
                deviceId: deviceId
            },
            {
                companion_id: companionDeviceId
            },
            (err, res) => {
                UserDb.tryCatchDelegate(err, res, (err, res) => {
                    console.log("Updating...")
                    console.log(res)
                    console.log(`${deviceId} delete ${companionDeviceId}`)
                })
            }
        )
    }

    /**
     * 
     * @param {string} deviceId 
     * @param {function(any):void} funcProcessing 
     */
    updateLock(deviceId, funcProcessing) {
        UserRow.updateOne(
            {
                deviceId: deviceId
            },
            {
                count_lock: 1,
                last_date_lock: Date.now
            },
            (err, res) => {
                UserDb.tryCatchDelegate(err, res, (err, res) => {
                    funcProcessing(res)
                })
            }
        )
    }

    /**
     * 
     * @param {string} deviceId 
     * @param {function(any):void} funcProcessing 
     */
    updateBlock(deviceId, funcProcessing) {
        UserRow.updateOne(
            {
                deviceId: deviceId
            },
            {
                block: true
            },
            (err, res) => {
                UserDb.tryCatchDelegate(err, res, (err, res) => {
                    funcProcessing(res)
                })
            }
        )
    }

    /**
     * 
     * @param {Object} user 
     */
    updateUser(user) {
        UserRow.updateOne(
            {
                deviceId: user.deviceId
            },
            {
                name: user.name,
                age: user.age,
                gender: user.gender,
                firebaseId: user.firebaseId,
                avatar: user.avatar,
                show_me: user.show_me,
                age_min_companion: user.age_min_companion,
                age_max_companion: user.age_max_companion
            },
            (err, res) => {
                UserDb.tryCatchDelegate(err, res, (err, res) => {
                    console.log(res)
                })
            }
        )
    }

    /**
     * 
     * @param {string} deviceId 
     * @param {function(any):void} funcProcessing 
     */
    addReport(deviceId, funcProcessing) {
        let report = new Reports()
        report.deviceId = deviceId
        report.timestamp = Date.now()
        report.save(function (err, res) {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                funcProcessing(res)
            })
        })
    }

    /**
     * @param {string} deviceId
     * @param {number} n
     * @param {function(any):void} funcProcessing 
     */
    getLastNReports(deviceId, n, funcProcessing) {
        Reports.find({ deviceId: deviceId }).sort('-timestamp').limit(n).exec((err, res) => {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                funcProcessing(res)
            })
        })
    }

    /**
     * 
     * @param {Object} message 
     * @param {function(any):void} funcProcessing 
     */
    saveMessage(message, funcProcessing) {
        message.save(function (err, res) {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                funcProcessing(res)
            })
        })
    }

    /**
     * 
     * @param {string} deviceId 
     * @param {function(any):void} funcProcessing 
     */
    getMessages(deviceId, funcProcessing) {
        MessageRow.find({
            readerDeviceId: deviceId,
            isReaded: false
        }, function (err, res) {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                funcProcessing(res)
            })
        })
    }

    /**
     * 
     * @param {string} id 
     * @param {function(any):void} funcProcessing 
     */
    getMessage(id, funcProcessing) {
        MessageRow.findOne({ _id: mongoose.Types.ObjectId.createFromHexString(id) }, (err, res) => {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                funcProcessing(res)
            })
        })
    }

    /**
     * 
     * @param {function(any):void} funcProcessing 
     */
    getAllMessages(funcProcessing) {
        MessageRow.find({}, function (err, res) {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                funcProcessing(res)
            })
        })
    }

    /**
     * 
     * @param {Array} deviceId 
     * @param {function(any):void} funcProcessing 
     */
    deleteMessagesById(ids, funcProcessing) {
        let ids_object = new Array()
        for (let id of ids) {
            ids_object.push(mongoose.Types.ObjectId.createFromHexString(id))
        }

        MessageRow.deleteMany(
            { _id: { "$in": ids_object } },
            function (err, res) {
                UserDb.tryCatchDelegate(err, res, (err, res) => {
                    console.log("Deleted get messages:")
                    console.log(res)
                    funcProcessing(res)
                })
            })
    }

    /**
     * 
     * @param {string} deviceId 
     * @param {function(any):void} funcProcessing 
     */
    deleteMessages(deviceId, funcProcessing) {
        MessageRow.deleteMany({ readerDeviceId: deviceId }, function (err, res) {
            UserDb.tryCatchDelegate(err, res, (err, res) => {
                console.log("Deleted get messages:")
                console.log(res)
                funcProcessing(res)
            })
        })
    }

    /**
     * 
     * @param {string} id
     */
    updateMessage(id) {
        MessageRow.updateOne(
            { _id: mongoose.Types.ObjectId(id) },
            { isReaded: true },
            (err, res) => {
                UserDb.tryCatchDelegate(err, res, (err, res) => {

                })
            }
        )
    }

    updateMessages(ids) {
        let ids_messages = new Array()

        for (let id of ids) {
            ids_messages.push(mongoose.Types.ObjectId.createFromHexString(id))
        }

        MessageRow.updateMany(
            { _id: { "$in": ids_messages } },
            { isReaded: true },
            (err, res) => {
                UserDb.tryCatchDelegate(err, res, (err, res) => {

                })
            }
        )
    }

    /**
     * 
     * @param {string} ids 
     * @param {function(any):void} funcProcessing 
     */
    readMessages(ids, funcProcessing) {
        let ids_object = new Array()
        for (let id of ids) {
            ids_object.push(mongoose.Types.ObjectId.createFromHexString(id))
        }

        MessageRow.updateMany(
            { _id: { "$in": ids_object } },
            { isReaded: true },
            function (err, res) {
                UserDb.tryCatchDelegate(err, res, (err, res) => {
                    console.log("Readed get messages:")
                    console.log(res)
                    funcProcessing(res)
                })
            })
    }

    /**
     * 
     * @param {Object} err 
     * @param {Object} res 
     * @param {function(any, any):void} listener 
     */
    static tryCatchDelegate(err, res, listener) {
        if (err) {
            return console.log(err)
        }

        try {
            listener(err, res)
        } catch (err) {
            console.log(err)
            bot.sendErrorPost(err.stack)

            setTimeout(function () {
                throw err
            }, 1000)
        }
    }

}

module.exports = {
    UserDb,
    UserRow,
    MessageRow
}