const UserDb = require('../data/db').UserDb
const Responses = require('../dtos/responses')
/**
 * 
 * @param {Session} app 
 * @param {UserDb} db 
 */
var route = function route(app, db) {
	app.post("/firabase_update", (request, response) => {
		const deviceId = request.body.device_id
		const firebaseToken = request.body.firebase_token
		db.updateFirebase(deviceId, firebaseToken, (res) => {
			response.send(Responses.successResponse({
				success: true
			}))
		})
	})
}
module.exports = route