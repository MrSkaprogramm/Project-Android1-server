const UserDb = require('../data/db').UserDb
const UserRow = require('../data/db').UserRow
const Responses = require('../dtos/responses')
/**
 * 
 * @param {Session} app 
 * @param {UserDb} db 
 */
var route = function route(app, db) {
	app.post('/check_user', (request, response) => {
		let deviceId = request.body.deviceId

		db.getUser(deviceId, (res) => {
			let user = res

			if (user !== undefined && user !== null) {
				db.getLastNReports(deviceId, 1, (res) => {
					if (!user.block) {
						if (res !== null && res.length > 0) {
							response.send(
								Responses.successResponse({
									...getObject(user, res[0].timestamp)
								})
							)
							console.log(`Request: ${user.name} ${user.deviceId}`)
						} else {
							response.send(
								Responses.successResponse({
									...getObject(user, 0)
								})
							)
							console.log(`Request: ${user.name} ${user.deviceId}`)
						}
					}
				})
			} else {
				db.getNumberMitra((count) => {
					const user = new UserRow()
					user.name = `Mitra _number_${count}`
					user.deviceId = deviceId

					db.createUser(user, (res_create) => {
						response.send(
							Responses.successResponse({
								...getObject(user, 0)
							})
						)
						console.log(`Created new user: ${user.name} ${user.deviceId}`)
					})

				})
			}
		})
	})
}

function getObject(res, lastReport) {
	return {
		name: res.name,
		age: res.age,
		firebase_id: res.firebaseId,
		device_id: res.deviceId,
		avatar: res.avatar,
		gender: res.gender,
		show_me: res.show_me,
		age_min_companion: res.age_min_companion,
		age_max_companion: res.age_max_companion,
		count_lock: res.count_lock,
		last_date_lock: res.last_date_lock,
		block: res.block,
		license_approve: res.license_approve,
		companion_id: res.companion_id,
		last_report: lastReport
	}
}

module.exports = route