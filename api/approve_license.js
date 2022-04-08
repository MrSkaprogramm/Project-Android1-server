const UserDb = require('../data/db').UserDb
const Responses = require('../dtos/responses')
/**
 * 
 * @param {Session} app 
 * @param {UserDb} db 
 */
let route = function route(app, db) {
	app.post("/approve_license", (request, response) => {
		const deviceId = request.body.device_id

		db.licenseApproveUser(deviceId, true, (res) => {
			response.send(Responses.successResponse({
				success: true
			}))
		})
	})
}

module.exports = route