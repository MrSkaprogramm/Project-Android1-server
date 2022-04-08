let Constants = require('./socket_consts')
let ClientApi = require("./client_api");
let SocketIOServerDelegate = require('./socket_io_delegate').SocketIOServerDelegate
let RoomApi = require('./room_api');
let RoomCache = require('../data/room_cache')
let UsersOnlineCache = require('../data/user_online_cache');
const UserDb = require('../data/db').UserDb;
let admin = require("firebase-admin");
const TelegramBotApi = require("../bots/bot_instance").TelegramBotApi
/**@type  TelegramBotApi*/
const bot = require("../bots/bot_instance").bot
let serviceAccount = require("../mitra-9dd72-firebase-adminsdk-xfda9-de9149b295.json");

class SocketServer {

    constructor(server) {
        this.server = server;
    }

    run() {
        //init all caches and apis
        let usersCache = new UsersOnlineCache();
        let roomsCache = new RoomCache();
        const db = new UserDb();
        const io = require('socket.io')(this.server);
        const ioDelegate = new SocketIOServerDelegate(io)
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://mitra-69f47.firebaseio.com"
        });

        let clientApi = new ClientApi();
        clientApi.io = ioDelegate;
        clientApi.usersCache = usersCache;
        clientApi.userDb = db;
        let roomApi = new RoomApi();
        roomApi.io = ioDelegate;
        roomApi.usersCache = usersCache;
        roomApi.roomsCache = roomsCache;
        roomApi.userDb = db;
        roomApi.admin = admin;
        clientApi.roomApi = roomApi;

        //listen connection
        ioDelegate.on(Constants.CONNECTION, (socket => {
            console.log(`Connection established: ${socket.getAddress()} ${socket.id()}`);
            socket.remoteAddr = socket.getAddress();

            //Запрашиваем авторизацию пользователя, а точнее девайса
            clientApi.requestAuthorizedUser(socket)
            //Слушаем запрос на получение пользователя, и в случае успеха подключаем остальные слушатели
            clientApi.subscribeListenerCheckUser(socket, () => {
                clientApi.subscribeListenerUpdateFirebaseToken(socket)
                clientApi.subscribeListenerLicenseApprove(socket);
                clientApi.subscribeListenerDisconnectingClient(socket);
                clientApi.subscribeListenerUpdateUserInfo(socket);
                clientApi.subscribeListenerRequestFindCompanion(socket, roomApi);
                clientApi.subscribeListenerDontFindCompanion(socket);
                clientApi.subscribeListenerGetCountClients(socket);

                roomApi.subscribeReadMessage(socket);
                roomApi.subscribeReadMessages(socket);
                roomApi.subscribeListenerGetMessagesCompanion(socket);
                roomApi.subscribeListenerCheckCompanionOnline(socket);
                roomApi.subscribeListenerContinueConnectRoomCompanionOnline(socket);
                roomApi.subscribeListenerTypingMessage(socket);
                roomApi.subscribeListenerNewMessageToRoom(socket);
                roomApi.subscribeListenerClientConnectRoom(socket);
                roomApi.subscribeListenerClientLeaveRoom(socket);
                roomApi.subscribeListenerReportCompanion(socket);

            });
            clientApi.subscribeListenerInitConnect(socket, () => {
                clientApi.subscribeListenerDisconnectingClient(socket);
                clientApi.subscribeListenerUpdateUserInfo(socket);
                clientApi.subscribeListenerRequestFindCompanion(socket, roomApi);
                clientApi.subscribeListenerDontFindCompanion(socket);
                clientApi.subscribeListenerGetCountClients(socket);

                roomApi.subscribeReadMessage(socket);
                roomApi.subscribeReadMessages(socket);
                roomApi.subscribeListenerGetMessagesCompanion(socket);
                roomApi.subscribeListenerCheckCompanionOnline(socket);
                roomApi.subscribeListenerContinueConnectRoomCompanionOnline(socket);
                roomApi.subscribeListenerTypingMessage(socket);
                roomApi.subscribeListenerNewMessageToRoom(socket);
                roomApi.subscribeListenerClientConnectRoom(socket);
                roomApi.subscribeListenerClientLeaveRoom(socket);
                roomApi.subscribeListenerReportCompanion(socket);
            })
        }));
    }
}

module.exports = SocketServer