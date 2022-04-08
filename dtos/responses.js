class Responses {
	static successResponse(json) {
		return {
			success: json
		}
	}

	static errorResponse(json, code) {
		return {
			error: {
				log: json,
				code: code
			}
		}
	}
}

module.exports = Responses