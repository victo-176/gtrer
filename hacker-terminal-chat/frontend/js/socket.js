// This file is intentionally minimal; socket initialization is in chat.js
// It can be used for additional socket utilities if needed.

function reportUser(userId, reason = '') {
  if (window.socket) {
    window.socket.emit('report_user', { reportedUserId: userId, reason });
  }
}

function sendDirectMessage(username, message) {
  if (window.socket) {
    window.socket.emit('global_message', `/dm ${username} ${message}`);
  }
}