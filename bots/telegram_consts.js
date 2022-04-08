const TelegramBotApi = require("./telegram_bot_api")

class TelegramConsts {
    static HOSTNAME="##TELEGRAM_BOT_HOSTNAME##"
    static PORT="##TELEGRAM_BOT_PORT##"
    
    static DEBUG_LOCAL_HOSTNAME="0.0.0.0"
    static DEBUG_LOCAL_PORT="25059"
}

module.exports = TelegramConsts