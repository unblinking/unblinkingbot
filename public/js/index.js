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

socket.on("slacktivity", text => 
  $("#slackactivitypanelbody").append("\n" + text));