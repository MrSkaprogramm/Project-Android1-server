const MongoConstants = require("./mongo_consts");
const mongoose = require("mongoose");
const Migrator = require("./migrator")
/**@type  TelegramBotApi*/
const bot = require("../bots/bot_instance").bot;

let port = MongoConstants.PORT
let host = MongoConstants.HOST
let nameDb = MongoConstants.NAME_DB

if (process.env.DEBUG) {
    host = MongoConstants.DEBUG_LOCAL_HOST
    port = MongoConstants.DEBUG_LOCAL_PORT
    nameDb = MongoConstants.DEBUG_LOCAL_NAME_DB
}

module.exports = {
    initConnection: function initConnection(callback) {
        mongoose.connect(`mongodb://${host}:${port}/${nameDb}`, { useNewUrlParser: true, useUnifiedTopology: true })
            .catch((reason) => {
                bot.sendErrorPost(reason.stack)

                setTimeout(function () {
                    throw "Mongoose connection error!"
                }, 2000)

            });
        let db = mongoose.connection
        db.once('open', function () {
            console.log("Connected to database");

            new Migrator().migrate(() => {
                callback();
            })
        });
    }
}