// We don't want to show the console output when testing
console.log = function () {};
console.info = function () {};
console.error = function () {};
console.warn = function () {};

// Monkey patch emit for elasticio-node
var messages = require("@openintegrationhub/ferryman");
messages.emit = function () {};
