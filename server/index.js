const TelegramBotApi = require("../bots/bot_instance").TelegramBotApi
/**@type  TelegramBotApi*/
const bot = require("../bots/bot_instance").bot

const bodyParser = require('body-parser');
const express = require("express");
const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

let http = require('http');

/*site
app.set("view engine", "ejs");
app.use(express.static("public")); 

app.get('/', (req, res) => {
    res.render('index')
})
*/

//for https
const fs = require('fs');
const https = require('https');
const options = {
    key: fs.readFileSync('./certs/file.pem'),
    cert: fs.readFileSync('./certs/server.crt')
}

const httpApp = express()
httpApp.get('*', (req, res) => {
    console.log('Redirect ' + req.hostname + " " + req.headers.host)
    res.redirect("https://" + req.hostname + ":3000")
})


//init socket server
try {
    /**@type http.Server */
    server = http.createServer(app)

    serverRequester = http.createServer(app)

    /* process.on('uncaughtException', function (err) {
        // Handle the error safely
        bot.sendError()
        console.log(err)
        setTimeout(function() {
            server.close()
        }, 1000)
        
    }) */

    let portForREST = "5000"
    let portForWS = "3000"

    if (process.env.TEST_ENV) {
        portForREST = "5001"
        portForWS = "3001"
    }

    serverRequester.listen(portForREST, () => console.log("Http server is running"))
    server.listen(portForWS, () => console.log("Server is running..."));
} catch (err) {
    console.log(err)
    bot.sendErrorPost(err.stack)
    serverRequester.close()
    server.close()
}

module.exports = { server, serverRequester, app }