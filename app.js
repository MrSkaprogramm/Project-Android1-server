//import server from './server'
const TelegramBotApi = require("./bots/bot_instance").TelegramBotApi
/**@type  TelegramBotApi*/
const bot = require("./bots/bot_instance").bot
const SocketServer = require('./sockets');
const RequestsServer = require('./api')
const initConnection = require('./data/db_connection').initConnection

initConnection(() => {
    try {
        const server = require("./server").server;
        const app = require("./server").app;
        const socketServer = new SocketServer(server);
        const requestsServer = new RequestsServer(app);
        requestsServer.run()
        socketServer.run();
        bot.sendStart();
    } catch (err) {
        console.log(err)
        bot.sendErrorPost(err.stack)
    }
})