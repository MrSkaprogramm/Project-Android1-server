const UserDb = require('../data/db').UserDb
const Responses = require('../dtos/responses')
const mongoose = require('mongoose')
/**
 * 
 * @param {Session} app 
 * @param {UserDb} db 
 */
var route = function route(app, db) {
	app.post("/get_unreaded_messages", (request, response) => {
		const deviceId = request.body.device_id


		db.getMessages(deviceId, (res) => {
			if (res !== null && res.length > 0) {
				response.send(Responses.successResponse({
					messages: res
				}))
			} else {
				response.send(Responses.successResponse({
					messages: []
				}))
			}
		})
	})
	app.post("/set_readed_messages", (request, response) => {

		 db.readMessages(request.body.ids, (res) => {
			
		})
	})
}

module.exports = route