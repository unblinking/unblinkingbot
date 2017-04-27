/**
 * The unblinking bot.
 * Javascript for the unblinkingbot web UI navbar.
 * @namespace navbar.js
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * @see {@link https://socket.io/docs/#using-with-express-3/4 Socket.io }
 */
var socket = io.connect();

/**
 * Setup the page buttons when this script is loaded.
 */
enableRestartBtn();

/**
 * Register the "reconnect" event handler.
 * Reload the web page upon hearing the reconnect event.
 */
//socket.on("reconnect", () => location.reload());

/**
 * 
 */
function enableRestartBtn() {
  return new P(resolve => {
    $("#restartBtn").off("click"); // Remove previous handler to start with none.
    $("#restartBtn").one("click", () => {
      $("#restartBtn").off("click"); // When clicked, remove handler
      $("#restartDropDown")[0].disabled = true;
      $("#restartDropDown").html(`<div class="loader float-left"></div>&nbsp;&nbsp;Restarting`);
      socket.emit("restartReq");
    });
    resolve();
  });
}