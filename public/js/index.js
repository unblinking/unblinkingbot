/**
 * The unblinking bot.
 * Javascript for the unblinkingbot web UI index page.
 * @namespace index.js
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * @see {@link https://socket.io/docs/#using-with-express-3/4 Socket.io }
 */
var socket = io.connect();

/**
 * Setup the dashboard instrumentation when this script is loaded.
 */
showRecentActivity();

socket.on("slacktivity", text => {
  $("#activityCard").append(text + `<br>`);
});

function showRecentActivity() {
  return new P.resolve(socket.emit("dashRecentActivityReq"));
}