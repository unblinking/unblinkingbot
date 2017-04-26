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
 * Attach a handler to the click event for the dataStoreRefreshBtn element.
 * Start by removing any existing click handler to avoid assigning the click
 * handler more than once at a time, and then add a new click handler. When
 * clicked, first remove the existing handler to disable multiple clicks trying
 * to happen at the same time, and then use Socket.io to emit readFullDbReq.
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
 * Attach a handler to the click event for the dataStoreHideBtn element.
 * Start by removing any existing click handler to avoid assigning the click
 * handler more than once at a time, and then add a new click handler. When
 * clicked, first remove the existing handler to disable multiple clicks trying
 * to happen at the same time, and then set the html content of
 * dataStoreCardBody to an empty string, and then enable the hide button again.
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
 * Register the "readFullDbRes" event handler.
 * Enable the refresh button, and then populate the datastore data into the 
 * dataStoreCardBody element.
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

