/**
 * The unblinking bot.
 * Javascript for the unblinkingbot web UI datastore page.
 * @namespace datastore.js
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * @see {@link https://socket.io/docs/#using-with-express-3/4 Socket.io }
 */
var socket = io.connect();

/**
 * Setup the page buttons when this script is loaded.
 */
enableRefreshBtn();
enableHideBtn();

/**
 * 
 */
function enableRefreshBtn() {
  return new P(resolve => {
    $("#dataStoreRefreshBtn").off("click"); // Remove previous handler to start with none.
    $("#dataStoreRefreshBtn").one("click", () => { // Add new handler.
      $("#dataStoreRefreshBtn").off("click"); // When clicked, remove handler.
      socket.emit("readFullDbReq");
    });
    resolve();
  });
}

/**
 * 
 */
function enableHideBtn() {
  return new P(resolve => {
    $("#dataStoreHideBtn").off("click");
    $("#dataStoreHideBtn").one("click", () => {
      $("#dataStoreHideBtn").off("click");
      $("#dataStoreCardBody").html("");
      enableHideBtn();
    });
    resolve();
  });
}

/**
 * 
 */
socket.on("readFullDbRes", data =>
  enableRefreshBtn()
  .then(
    () => $("#dataStoreCardBody").html(JSON.stringify(
      data,
      undefined,
      2
    ))
  )
);

