const UserRow = require('./db').UserRow
const MessageRow = require('./db').MessageRow

class Migrator {

	constructor() {
		this.list = [
			new Migration1(),
			new Migration2(),
			new Migration3()
		]
	}

	async migrate(callback) {
		await this.migrateNext(0, callback)
	}

	async migrateNext(index, callback) {
		if (index < this.list.length) {
			this.list[index].migrate(async () => {
				index++
				await this.migrateNext(index, callback)
			})
		} else {
			callback()
		}
	}
}

module.exports = Migrator

class Migration1 {
	async migrate(callback) {
		let users = await UserRow.find().exec()

		for (let user of users) {
			if (user.avatar < 500) {
				user.avatar = user.avatar < 200 ? 1000 : 500
				await user.save()
			}
		}

		callback()
	}
}

class Migration2 {
	async migrate(callback) {
		UserRow.updateMany(
			{},
			{ $unset: { for_what: 0 } },
			{ strict: false })
			.exec()

		callback()
	}
}

class Migration3 {
	async migrate(callback) {
		let messages = await MessageRow.find().exec()

		for (let message of messages) {
			if (message.isReaded === undefined) {
				await MessageRow.updateMany(
					{},
					{ isReaded: true },
					{ multi: true }
				).exec()

				break
			}
		}

		callback()
	}
}