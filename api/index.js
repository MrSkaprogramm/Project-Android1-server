const UserDb = require('../data/db').UserDb;
const cron = require('node-cron');

class RequestsServer {

	constructor(app) {
		this.app = app
	}

	run() {
		const db = new UserDb()
		cron.schedule('0 6,23 * * *', () => {
			new Promise(async (resolve, reject) => {
				db.getAllMessages((res) => {
					let ids = new Array()
					for (let meassage of res) {
						if (meassage.deleteTimestamp < new Date().getTime()) {
							ids.push(meassage._id.toString())
						}
					}
					db.deleteMessagesById(ids, (err, res) => {
						
					})
				})

				resolve(1)
			})
		})
		require("./check_user")(this.app, db)
		require("./firebase")(this.app, db)
		require("./get_unreaded_messages")(this.app, db)
		require("./approve_license")(this.app, db)
		require("./system_drop_reported_users")(this.app, db)
	}
}

module.exports = RequestsServer