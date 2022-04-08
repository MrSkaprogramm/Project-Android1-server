const TelegramBotApi = require('./telegram_bot_api');
const bot = new TelegramBotApi()

module.exports = { bot, TelegramBotApi }