const TelegramConsts = require('./telegram_consts')

class TelegramBotApi {
    static ERROR = "/error"
    static START = "/start"
    host = TelegramConsts.HOSTNAME
    port = TelegramConsts.PORT

    /**@module http*/
    http

    constructor() {
        this.http = require('http')

        if (process.env.DEBUG) {
            this.host = TelegramConsts.DEBUG_LOCAL_HOSTNAME
            this.port = TelegramConsts.DEBUG_LOCAL_PORT
        }
    }

    sendStart() {
        this.sendRequest(this.getOptionsGet(TelegramBotApi.START))
    }

    sendError() {
        this.sendRequest(this.getOptionsGet(TelegramBotApi.ERROR))
    }

    sendErrorPost(data) {
        this.sendRequestPost(data)
    }

    sendRequest(options) {
        const req = this.http.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`)
        })

        req.on('error', error => {
            console.error(error)
        })

        req.end()
    }

    sendRequestPost(data) {
        const req = this.http.request(this.getOptionsPost(TelegramBotApi.ERROR, data), res => {
            console.log(`statusCode: ${res.statusCode}`)
        })

        req.on('error', error => {
            console.error(error)
        })

        req.write(`${data}`)

        req.end()
    }

    getOptionsGet(method) {
        return {
            hostname: this.host,
            port: this.port,
            path: method,
            method: 'GET'
        }
    }

    getOptionsPost(method, data) {
        return {
            hostname: this.host,
            port: this.port,
            path: method,
            method: 'POST',
            headers: {
                "Content-Type": "application/text",
                "Content-Length": Buffer.byteLength(`${data}`)
            }
        }
    }
}

module.exports = TelegramBotApi