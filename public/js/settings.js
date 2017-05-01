/**
 * The unblinking bot.
 * Javascript for the unblinkingbot web UI settings page.
 * @namespace settings.js
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * @see {@link https://socket.io/docs/#using-with-express-3/4 Socket.io }
 */
var socket = io.connect();

/**
 * Setup the page buttons when this script is loaded.
 */
enableChangeSettingsBtn();
enableRestartSlackBtn();
enableStopSlackBtn();
enableSaveTokenBtn();
enableSaveNotifyBtn();
removeSuccessOnFocus();
enableNotifyTypeRadioBtn();

/**
 * Request the current Slack details.
 */
slackConnectionStatusReq();
slackTokenReq();
slackNotifyReq();

/**
 * 
 */
socket.on("channelsRes", channelNames =>
  enableNotifyTypeRadioBtn()
  .then(() => populateDropDown(
    $("#inputChannels"),
    channelNames,
    $("#defaultChannelSelect"))));

/**
 * 
 */
socket.on("readSlackGroupsRes", groupNames =>
  enableNotifyTypeRadioBtn()
  .then(() => populateDropDown(
    $("#inputGroups"),
    groupNames,
    $("#defaultGroupSelect"))));

/**
 * 
 */
socket.on("readSlackUsersRes", userNames =>
  enableNotifyTypeRadioBtn()
  .then(() => populateDropDown(
    $("#inputUsers"),
    userNames,
    $("#defaultUserSelect"))));

/**
 * Register the "saveSlackNotifyRes" event handler.
 * Enable the save button, update notify on-screen, and display an alert.
 */
socket.on("saveSlackNotifyRes", (notify, notifyType, success, err) =>
  enableSaveNotifyBtn()
  .then(() => {
    if (success) handleSaveNotifySuccess(notify, notifyType)
      .then(() => renderHtmlAlertNotifySavedSuccess())
      .then(alert => alertAnimationSuccess(alert.element, alert.html));
    if (!success) handleSaveNotifyError(err)
      .then(() => renderHtmlAlertNotifySavedError(err))
      .then(alert => alertAnimationError(alert.element, alert.html));
  }));

/**
 * Register the "saveSlackTokenRes" event handler.
 * Enable the save button, update token on-screen, and display an alert.
 */
socket.on("saveSlackTokenRes", (token, success, err) => {
  enableSaveTokenBtn()
    .then(() => {
      if (success) handleSaveTokenSuccess(token)
        .then(() => renderHtmlAlertTokenSavedSuccess())
        .then(alert => alertAnimationSuccess(alert.element, alert.html));
      if (!success) handleSaveTokenError(err)
        .then(() => renderHtmlAlertTokenSavedError(err))
        .then(alert => alertAnimationError(alert.element, alert.html));
    });
});

/**
 * Register the "slackConnectionOpened" event handler.
 * Enable the restart button, update connection status, and display an alert.
 */
socket.on("slackConnectionOpened", message =>
  enableRestartSlackBtn()
  .then(() => slackConnectionStatusUpdate(true))
  .then(() => alertSlackConnection(message)));

/**
 * 
 */
socket.on("slackConnectionStatusRes", connected =>
  slackConnectionStatusUpdate(connected));

/**
 * Register the "slackDisconnection" event handler.
 * Enable the stop button, update connection status, and display an alert.
 */
socket.on("slackDisconnection", message =>
  enableStopSlackBtn()
  .then(() => slackConnectionStatusUpdate(false))
  .then(() => alertSlackDisconnection(message)));

/**
 * 
 */
socket.on("slackNotifyRes", data =>
  $("#currentSettingsNotify").html(data.notifyType + " " + data.notify));

/**
 * 
 */
socket.on("slackTokenRes", token => {
  $("#startSlack").removeClass("hidden-xs-up");
  $("#stopSlack").removeClass("hidden-xs-up");
  $("#settingsToken").html(token);
  $("#slackToken").val(token);
});

/**
 * Alert error animation sequence.
 * First, fade to zero opacity and slide up out of view just in case it is
 * visible. Next, set html content, slide down, and fade to full opacity. Leave
 * the error alert on the screen for the user to manually dismiss.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {String} html HTML to set as the content of each matched element.
 */
function alertAnimationError(element, html) {
  return new P(resolve => fade(element, 0, 0)
    .then(() => upSlide(element, 0))
    .then(() => htmlSet(element, html))
    .then(() => downSlide(element, 500))
    .then(() => fade(element, 500, 1))
    .then(() => resolve()));
}

/**
 * Alert success animation sequence.
 * First, fade to zero opacity and slide up out of view just in case it is
 * visible. Next, set html content, slide down, fade to full opacity, and sleep
 * while the alert is visible. Last, fade to zero opacity and slide up out of
 * view.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {String} html HTML to set as the content of each matched element.
 */
function alertAnimationSuccess(element, html) {
  return new P(resolve => fade(element, 0, 0)
    .then(() => upSlide(element, 0))
    .then(() => htmlSet(element, html))
    .then(() => downSlide(element, 500))
    .then(() => fade(element, 500, 1))
    .then(() => countTo(5))
    .then(() => fade(element, 500, 0))
    .then(() => upSlide(element, 500))
    //.catch((err) => alert(err))
    .then(() => resolve()));
}

/**
 * Show the Slack RTM Connection alert.
 * @param {String} message A message from the Slack RTM Connection event.
 */
function alertSlackConnection(message) {
  return new P(resolve => renderHtmlAlertSlackConnection(message)
    .then(alert => alertAnimationSuccess(alert.element, alert.html))
    .then(() => resolve()));
}

/**
 * Show the Slack RTM Disconnection alert.
 * @param {String} message A message from the Slack RTM Disconnection event.
 */
function alertSlackDisconnection(message) {
  return new P(resolve => renderHtmlAlertSlackDisconnection(message)
    .then(alert => alertAnimationSuccess(alert.element, alert.html))
    .then(() => resolve()));
}

/**
 * Count to a number of seconds and then continue.
 * @param {number} seconds How many seconds to count to.
 */
function countTo(seconds) {
  return new P(resolve => setTimeout(resolve, (seconds * 1000)));
}

/**
 * Animated slide-down to hide the matched elements.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {Number} speed Duration of the animation in milliseconds.
 */
function downSlide(element, speed) {
  return new P(resolve => element.show(speed, resolve));
}

/**
 * Attach a handler to the click event for the changeSettings element.
 * When clicked; hide the button, un-hide the token panel, un-hide the notify
 * panel (if the token element is populated), and scroll the un-hidden panels
 * into view.
 */
function enableChangeSettingsBtn() {
  return new P(resolve => {
    $("#changeSettings").off("click"); // Start with no click handler, prevent duplicates.
    renderHtmlBtnChangeSettings().then(html => $("#changeSettings").html(html));
    $("#changeSettings").one("click", () => { // Add new click handler.
      $("#changeSettings").off("click"); // When clicked, remove handler.
      $("#changeSettings").addClass("hidden-xs-up");
      $("#tokenPanel").removeClass("hidden-xs-up");
      if ($("#slackToken").val()) $("#defaultNotifyPanel").removeClass("hidden-xs-up");
      $("#tokenPanel")[0].scrollIntoView();
    });
    resolve();
  });
}

/**
 * 
 */
function enableNotifyTypeRadioBtn() {
  return new P(resolve => {
    $("#radioChannel").off("click"); // Remove previous handler to start with none.
    $("#radioChannel").one("click", () => { // Add new handler.
      $("#radioChannel").off("click"); // When clicked, remove handler.
      hideDefaultNotifySelectors(); // Start with all options hidden and an empty select element.
      $("#defaultChannelSelect")[0].options.length = 0;
      $("#progressDefaultNotifications").removeClass("hidden-xs-up"); // Show progress bar.
      socket.emit("channelsReq");
    });
    $("#radioGroup").off("click"); // Remove previous handler to start with none.
    $("#radioGroup").one("click", () => { // Add new handler.
      $("#radioGroup").off("click"); // When clicked, remove handler.
      hideDefaultNotifySelectors(); // Start with all options hidden and an empty select element.
      $("#defaultGroupSelect")[0].options.length = 0;
      $("#progressDefaultNotifications").removeClass("hidden-xs-up"); // Show progress bar.
      socket.emit("readSlackGroupsReq");
    });
    $("#radioUser").off("click"); // Remove previous handler to start with none.
    $("#radioUser").one("click", () => { // Add new handler.
      $("#radioUser").off("click"); // When clicked, remove handler.
      hideDefaultNotifySelectors(); // Start with all options hidden and an empty select element.
      $("#defaultUserSelect")[0].options.length = 0;
      $("#progressDefaultNotifications").removeClass("hidden-xs-up"); // Show progress bar.
      socket.emit("readSlackUsersReq");
    });
    resolve();
  });
}

/**
 * Attach a handler to the click event for the restartSlack button element.
 * When clicked; Replace the button html with a loader animation and a
 * restarting message, and then emit a slackRestartReq event via Socket.io.
 */
function enableRestartSlackBtn() {
  return new P(resolve => {
    $("#startSlack").off("click"); // Start with no click handler, prevent duplicates.
    renderHtmlBtnSlackRestart().then(html => $("#startSlack").html(html));
    $("#startSlack").one("click", () => { // Add new click handler.
      $("#startSlack").off("click"); // When clicked, remove handler.
      renderHtmlBtnSlackRestarting().then(html => $("#startSlack").html(html));
      socket.emit("slackRestartReq");
    });
    resolve();
  });
}

/**
 * 
 */
function enableSaveNotifyBtn() {
  return new P(resolve => {
    let btnC = $("#saveSlackDefaultNotifyChannel");
    let btnG = $("#saveSlackDefaultNotifyGroup");
    let btnU = $("#saveSlackDefaultNotifyUser");
    btnC.off("click"); // Remove previous handler to start with none.
    btnG.off("click"); // Remove previous handler to start with none.
    btnU.off("click"); // Remove previous handler to start with none.
    renderHtmlBtnSaveNotify().then(html => {
      btnC.html(html);
      btnG.html(html);
      btnU.html(html);
    });
    btnC.one("click", () => { // Add new handler.
      btnC.off("click"); // When clicked, remove handler.
      renderHtmlBtnSavingNotify().then(html => btnC.html(html));
      socket.emit(
        "saveSlackNotifyReq",
        $("select[id=defaultChannelSelect]").val(),
        "channel"
      );
    });
    btnG.one("click", () => { // Add new handler.
      btnG.off("click"); // When clicked, remove handler.
      renderHtmlBtnSavingNotify().then(html => btnG.html(html));
      socket.emit(
        "saveSlackNotifyReq",
        $("select[id=defaultGroupSelect]").val(),
        "group"
      );
    });
    btnU.one("click", () => { // Add new handler.
      btnU.off("click"); // When clicked, remove handler.
      renderHtmlBtnSavingNotify().then(html => btnU.html(html));
      socket.emit(
        "saveSlackNotifyReq",
        $("select[id=defaultUserSelect]").val(),
        "user"
      );
    });
    resolve();
  });
}

/**
 * Attach a handler to the click event for the saveToken button element.
 * When clicked; Replace the button html with a loader animation, and then emit
 * a saveSlackTokenReq event via Socket.io containing the value from the
 * slackToken input element.
 */
function enableSaveTokenBtn() {
  return new P(resolve => {
    let btn = $("#saveToken");
    btn.off("click"); // Remove previous handler to start with none.
    renderHtmlBtnSaveToken().then(html => btn.html(html));
    btn.one("click", () => { // Add new handler.
      btn.off("click"); // When clicked, remove handler.
      renderHtmlBtnSavingToken().then(html => btn.html(html));
      socket.emit("saveSlackTokenReq", $("input[id=slackToken]").val());
    });
    resolve();
  });
}

/**
 * Attach a handler to the click event for the stopSlack button element.
 * When clicked; Replace the button html with a loader animation and a
 * stopping message, and then emit a slackStopReq event via Socket.io.
 */
function enableStopSlackBtn() {
  return new P(resolve => {
    let btn = $("#stopSlack");
    btn.off("click"); // Remove previous handler to start with none.
    renderHtmlBtnSlackStop().then(html => btn.html(html));
    btn.one("click", () => { // Add new handler.
      btn.off("click"); // When clicked, remove handler.
      renderHtmlBtnSlackStopping().then(html => btn.html(html));
      socket.emit("slackStopReq");
    });
    resolve();
  });
}

/**
 * Animated change in opacity of the matched elements.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {Number} speed Duration of the animation in milliseconds.
 * @param {Number} opacity Target opacity, a number between 0 and 1.
 */
function fade(element, speed, opacity) {
  return new P(resolve => element.fadeTo(speed, opacity, resolve));
}

/**
 * 
 * @param {*} err 
 */
function handleSaveNotifyError(err) {
  return new P(resolve => {
    $("#inputChannels").addClass("has-error");
    $("#inputGroups").addClass("has-error");
    $("#inputUsers").addClass("has-error");
    resolve();
  });
}

/**
 * 
 * @param {*} notify 
 * @param {*} notifyType 
 */
function handleSaveNotifySuccess(notify, notifyType) {
  return new P(resolve => {
    $("#currentSettingsNotify").html(notifyType + " " + notify);
    if (notifyType === "channel") $("#inputChannels").addClass("has-success");
    if (notifyType === "group") $("#inputGroups").addClass("has-success");
    if (notifyType === "user") $("#inputUsers").addClass("has-success");
    resolve();
  });
}

/**
 * 
 * @param {*} err 
 */
function handleSaveTokenError(err) {
  return new P.resolve($("#slackTokenInputGroup").addClass("has-error"));
}

/**
 * 
 * @param {*} token 
 */
function handleSaveTokenSuccess(token) {
  return new P(resolve => {
    $("#settingsToken").html(token);
    $("#slackTokenInputGroup").addClass("has-success");
    $("#startSlack").removeClass("hidden-xs-up");
    $("#stopSlack").removeClass("hidden-xs-up");
    $("#defaultNotifyPanel").removeClass("hidden-xs-up");
    socket.emit("slackRestartReq");
    resolve();
  });
}

/**
 * Hide all drop down selectors for default notifications
 */
function hideDefaultNotifySelectors() {
  return new P(resolve => {
    $("#inputChannels").addClass("hidden-xs-up");
    $("#inputGroups").addClass("hidden-xs-up");
    $("#inputUsers").addClass("hidden-xs-up");
    resolve();
  });
}

/**
 * Set the HTML contents of matched elements.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {String} html HTML string to set as the content of matched elements.
 */
function htmlSet(element, html) {
  return new P.resolve(element.html(html));
}

function populateDropDown(element, array, selector) {
  return new P(resolve => {
    element.removeClass("hidden-xs-up");
    for (let i = 0; i < array.length; i++) {
      let name = array[i];
      let option = document.createElement("option");
      option.text = name;
      selector[0].add(option);
    }
    $("#progressDefaultNotifications").addClass("hidden-xs-up"); // Hide progress bar.
    resolve();
  });
}

/**
 * Remove the has-success class from inputs on focus events.
 */
function removeSuccessOnFocus() {
  return new P(resolve => {
    $("#slackToken").focus(() => $("#slackTokenInputGroup").removeClass("has-success"));
    $("#defaultChannelSelect").focus(() => $("#inputChannels").removeClass("has-success"));
    $("#defaultGroupSelect").focus(() => $("#inputGroups").removeClass("has-success"));
    $("#defaultUserSelect").focus(() => $("#inputUsers").removeClass("has-success"));
    resolve();
  });
}

/**
 * 
 */
function slackConnectionStatusReq() {
  return new P(resolve => {
    socket.emit("slackConnectionStatusReq");
    resolve();
  });
}

/**
 * Update the Slack connection status.
 * @param {Boolean} connected True if connected, false if disconnected.
 */
function slackConnectionStatusUpdate(connected) {
  return new P(resolve => {
    let element = $("#slackIntegrationStatus");
    if (connected) {
      element.removeClass("text-danger");
      element.html("connected");
      element.addClass("text-success");
    } else if (!connected) {
      element.removeClass("text-success");
      element.html("disconnected");
      element.addClass("text-danger");
    }
    resolve();
  });
}

/**
 * 
 */
function slackNotifyReq() {
  return new P.resolve(socket.emit("slackNotifyReq"));
}

/**
 * 
 */
function slackTokenReq() {
  return new P.resolve(socket.emit("slackTokenReq"));
}

/**
 * Animated slide-up to hide the matched elements.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {Number} speed Duration of the animation in milliseconds.
 */
function upSlide(element, speed) {
  return new P(resolve => {
    element.hide(speed, resolve);
  });
}