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
 * Register the "fullDbRes" event handler.
 * Enable the refresh button, and then populate the datastore data into the
 * dataStoreCardBody element.
 */
socket.on("fullDbRes", data =>
  enableRefreshBtn().then(() =>
    $("#dataStoreCardBody").html(JSON.stringify(data, undefined, 2))));

/**
 * Attach a handler to the click event for the hideBtn element.
 * Start by removing any existing click handler to avoid assigning the click
 * handler more than once at a time, and then add a new click handler. When
 * clicked, first remove the existing handler to disable multiple clicks trying
 * to happen at the same time, and then set the html content of
 * dataStoreCardBody to an empty string, and then enable the hide button again.
 */
function enableHideBtn() {
  return new P(resolve => {
    $("#hideBtn").off("click"); // Remove previous handler to start with none.
    renderHtmlBtnDatastoreHide().then(html => $("#hideBtn").html(html));
    $("#hideBtn").one("click", () => { // Add new handler.
      $("#hideBtn").off("click"); // When clicked, remove handler.
      renderHtmlBtnDatastoreHiding().then(html => $("#hideBtn").html(html));
      $("#dataStoreCardBody").html("");
      enableHideBtn();
    });
    resolve();
  });
}

/**
 * Attach a handler to the click event for the refreshBtn element.
 * Start by removing any existing click handler to avoid assigning the click
 * handler more than once at a time, and then add a new click handler. When
 * clicked, first remove the existing handler to disable multiple clicks trying
 * to happen at the same time, and then use Socket.io to emit fullDbReq.
 */
function enableRefreshBtn() {
  return new P(resolve => {
    $("#refreshBtn").off("click"); // Remove previous handler to start with none.
    renderHtmlBtnDatastoreRefresh().then(html => $("#refreshBtn").html(html));
    $("#refreshBtn").one("click", () => { // Add new handler.
      $("#refreshBtn").off("click"); // When clicked, remove handler.
      renderHtmlBtnDatastoreRefreshing().then(html => $("#refreshBtn").html(html));
      socket.emit("fullDbReq");
    });
    resolve();
  });
}
