class Constants {
    //general socket constants
    static CONNECTION = 'connection'
    static DISCONNECT = 'disconnect'
    static REQUEST_FIND_COMPANION = 'find_companion'
    static REQUEST_DONT_FIND_COMPANION = 'dont_find_companion'
    static UPDATE_USER_INFO = 'update_user_info'
    static REQUEST_AUTHORIZED ='request_authorized'
    //room socket constants
    static TYPING_MESSAGE = 'typing_message'
    static NEW_MESSAGE = 'new_message'
    static READ_MESSAGE = 'read_message'
    static READ_MESSAGES = 'read_messages'
    static REQUEST_CONNECT_CLIENT_TO_ROOM = 'request_connect_room'
    static REQUEST_LEAVE_CLIENT_FROM_ROOM = 'request_leave_room'
    static REQUEST_LEAVE_CLIENT_FROM_HOST_ROOM = 'request_leave_host_room'
    static CONNECT_CLIENT_TO_ROOM = 'connect_client_room'
    static LEAVE_CLIENT_TO_ROOM = 'leave_client_room'
    static CHECK_COMPANION_ONLINE = 'check_companion_online'
    static CONTINUE_CONNECT_ROOM_COMPANION_ONLINE = 'continue_connect_room_companion_online'
    static CONTINUE_CONNECT_ROOM_COMPANION_OFFLINE = 'continue_connect_room_companion_offline'
    static GET_UNREADED_MESSAGES = 'get_unreaded_messages'
    static SERVER_NOTIFY_UPDATE_ROOM = 'server_notify_update_room'

    static CLIENT_REQUEST_UNREADED_MESSAGES_FROM_CHAT = 'get_unreaded_messages'
    static SERVER_BAN_COMPANION = 'server_ban_companion'
    static SERVER_BAN_CHAT_COMPANION = 'server_ban_chat_companion'
    static SERVER_REPORT_COMPANION = 'server_report_companion'
    static SERVER_REPORT_CHAT_COMPANION = 'server_report_chat_companion'

    static CLIENT_REPORT_COMPANION = "client_report_companion"
    static CLIENT_REPORT_CHAT_COMPANION = 'client_report_chat_companion'
    static CLIENT_UPDATE_FIREBASE_TOKEN = 'client_update_firebase_token'
    static CLIENT_GET_COUNT_CLIENTS = 'client_get_count_clients'
    static SERVER_SEND_COUNTS_CLIENTS = 'server_send_counts_clients'
    //db constants
    static CHECK_USER = 'check_user'
    static INIT_CONNECT = 'init_connect'
    static FINISH_INIT_CONNECT = 'init_connect'
    static RESPONSE_CHECK_USER = 'response_check_user'
    static LICENSE_APPROVE = 'license_approve'

    static SECOND = 1000
    static MINUTE = 60 * this.SECOND
    static HOUR = 60 * this.MINUTE
    static DAY = 24 * this.HOUR

    static PERIOD_FOR_BAN = 10 * this.DAY
    static COUNT_REPORTS_FOR_BAN = 10
}

module.exports = Constants