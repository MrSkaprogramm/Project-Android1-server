const UserDb = require('../data/db').UserDb
const Responses = require('../dtos/responses')
const SECRET = "sFK8vfj4SDJ73fkckm38mfJIFedmd3dfkfj3f3kf"
/**
 * 
 * @param {Session} app 
 * @param {UserDb} db 
 */
var route = function route(app, db) {
	app.post("/system_drop_reported_users", (request, response) => {
		const deviceId = request.body.device_id
		const companionDeviceId = request.body.companion_device_id
		const secret = request.body.secret

		if (SECRET === secret) {
			db.dropInfoReportedUsers(deviceId, companionDeviceId, (res) => {
				response.send(Responses.successResponse({
					success: true
				}))
				db.dropInfoReportedUsers(companionDeviceId, deviceId, (res) => { })
			})
		} else {
			response.status(500).send(Responses.errorResponse("Something wrong!"))
		}
	})
}
module.exports = route