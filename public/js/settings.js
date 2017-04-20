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
 * Enable buttons appropriately.
 */
enableChangeSettingsBtn();
enableRestartSlackBtn();
enableStopSlackBtn();
enableSaveTokenBtn();

// Success and error messages on save default notify requests
function alertSaveSlackNotifyResponse(bundle) {
  if (bundle.success === true) {
    document.getElementById("currentSettingsNotify").innerHTML = bundle.defaultNotifyType + " " + bundle.defaultNotify;
    if (bundle.defaultNotifyType === "channel") {
      document.getElementById("inputChannels").classList.add("has-success");
    }
    if (bundle.defaultNotifyType === "group") {
      document.getElementById("inputGroups").classList.add("has-success");
    }
    if (bundle.defaultNotifyType === "user") {
      document.getElementById("inputUsers").classList.add("has-success");
    }
    alertSuccessAnimation($("#saveSlackNotifyAlert"), `<div class=\"alert alert-success\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Success!</strong> Default notification recipient saved successfully.</div>`);
  } else {
    document.getElementById("saveSlackNotifyAlert").innerHTML = "<div class=\"alert alert-danger\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Error!</strong> There was an error. Default notification recipient was not saved.</div>";
  }
}

// Remove has-success from inputs when modified
$("#slackToken").keyup(() => $("#slackTokenInputGroup").removeClass("has-success"));
$("#defaultChannelSelect").change(() => $("#inputChannels").removeClass("has-success"));
$("#defaultGroupSelect").change(() => $("#inputGroups").removeClass("has-success"));
$("#defaultUserSelect").change(() => $("#inputUsers").removeClass("has-success"));

function readSlackChannelsGroupsUsersRes(bundle) {
  // Show the input drop down
  bundle.inputDropdown.classList.remove("hidden");
  // Populate options in the selector
  var length = bundle.dropDownOptions.length;
  for (var i = 0; i < length; i++) {
    var name = bundle.dropDownOptions[i];
    var option = document.createElement("option");
    option.text = name;
    bundle.selector.add(option);
  }
  // Hide the progress bar
  document.getElementById("progressDefaultNotifications").classList.add("hidden");
}

function bindSaveSlackDefaultNotifyButton(bundle) {
  bundle.buttonElement.unbind().click(function () {
    // Unbind the button (do not respond to clicks anymore) and show loader animation
    $(this).unbind("click");
    $(this).html("<div class=\"loader pull-left\"></div>");
    if (bundle.defaultNotifyType === "channel") {
      bundle.defaultNotify = $("select[id=defaultChannelSelect]").val();
    }
    if (bundle.defaultNotifyType === "group") {
      bundle.defaultNotify = $("select[id=defaultGroupSelect]").val();
    }
    if (bundle.defaultNotifyType === "user") {
      bundle.defaultNotify = $("select[id=defaultUserSelect]").val();
    }
    // Emit request to save the default notification target
    socket.emit("saveSlackNotifyReq", {
      type: bundle.defaultNotifyType,
      notify: bundle.defaultNotify
    });
  });
}

function bindDefaultNotifyTypeRadioButton(bundle) {
  bundle.radioElement.unbind().click(function () {
    // Start with all options hidden and an empty select element.
    hideDefaultNotifySelectors();
    bundle.selectElement.options.length = 0;
    // Show the progress bar while the data is loaded.
    document.getElementById("progressDefaultNotifications").classList.remove("hidden");
    // Emit request for options.
    socket.emit(bundle.socketReq);
  });
}

socket.on("saveSlackNotifyRes", (bundle) => {
  if (bundle.defaultNotifyType === "channel") {
    bundle.buttonElement = $("#saveSlackDefaultNotifyChannel");
  }
  if (bundle.defaultNotifyType === "group") {
    bundle.buttonElement = $("#saveSlackDefaultNotifyGroup");
  }
  if (bundle.defaultNotifyType === "user") {
    bundle.buttonElement = $("#saveSlackDefaultNotifyUser");
  }
  // Enable the button again
  bindSaveSlackDefaultNotifyButton({
    buttonElement: bundle.buttonElement,
    defaultNotifyType: bundle.defaultNotifyType
  });
  bundle.buttonElement[0].innerHTML = "<span class=\"glyphicon glyphicon-save\"></span> Save";
  // Display an alert with the response.
  alertSaveSlackNotifyResponse(bundle);
});

// Channels - Define behavior when the Channel radio button is selected
bindDefaultNotifyTypeRadioButton({
  radioElement: $("#radioChannel"),
  selectElement: document.getElementById("defaultChannelSelect"),
  socketReq: "readSlackChannelsReq"
});
socket.on("readSlackChannelsRes", function (channelNames) {
  readSlackChannelsGroupsUsersRes({
    inputDropdown: document.getElementById("inputChannels"),
    dropDownOptions: channelNames,
    selector: document.getElementById("defaultChannelSelect")
  });
});
bindSaveSlackDefaultNotifyButton({
  buttonElement: $("#saveSlackDefaultNotifyChannel"),
  defaultNotifyType: "channel"
});

// Groups - Define behavior when the Groups radio button is selected
bindDefaultNotifyTypeRadioButton({
  radioElement: $("#radioGroup"),
  selectElement: document.getElementById("defaultGroupSelect"),
  socketReq: "readSlackGroupsReq"
});
socket.on("readSlackGroupsRes", function (groupNames) {
  readSlackChannelsGroupsUsersRes({
    inputDropdown: document.getElementById("inputGroups"),
    dropDownOptions: groupNames,
    selector: document.getElementById("defaultGroupSelect")
  });
});
bindSaveSlackDefaultNotifyButton({
  buttonElement: $("#saveSlackDefaultNotifyGroup"),
  defaultNotifyType: "group"
});

// Users - Define behavior when the Direct Messages radio button is selected
bindDefaultNotifyTypeRadioButton({
  radioElement: $("#radioUser"),
  selectElement: document.getElementById("defaultUserSelect"),
  socketReq: "readSlackUsersReq"
});
socket.on("readSlackUsersRes", function (userNames) {
  readSlackChannelsGroupsUsersRes({
    inputDropdown: document.getElementById("inputUsers"),
    dropDownOptions: userNames,
    selector: document.getElementById("defaultUserSelect")
  });
});
bindSaveSlackDefaultNotifyButton({
  buttonElement: $("#saveSlackDefaultNotifyUser"),
  defaultNotifyType: "user"
});



/* *****************************************************************************
   *****************************************************************************
   *****************************************************************************
   Reworked versions of functions are being pasted below here as I complete
   them. I'll remove this ugly comment block when I'm done.
   *****************************************************************************
   *****************************************************************************
   *****************************************************************************
*/

/**
 * Register the "slackConnectionOpened" event handler.
 * Enable the restart button, update connection status, and display an alert.
 */
socket.on("slackConnectionOpened", message =>
  enableRestartSlackBtn()
  .then(() => slackConnectionStatusUpdate(true))
  .then(() => alertSlackConnection(message))
);

/**
 * Register the "slackDisconnection" event handler.
 * Enable the stop button, update connection status, and display an alert.
 */
socket.on("slackDisconnection", message =>
  enableStopSlackBtn()
  .then(() => slackConnectionStatusUpdate(false))
  .then(() => alertSlackDisconnection(message))
);

socket.on("saveSlackTokenRes", (token, success, err) => {
  enableSaveTokenBtn()
    .then(() => {
      if (success) handleSaveTokenSuccess(token)
        .then(() => renderHtmlAlertTokenSavedSuccess())
        .then(alert => alertSuccessAnimation(alert.element, alert.html));
      if (!success) handleSaveTokenError(err)
        .then(() => renderHtmlAlertTokenSavedError(err))
        .then(alert => alertErrorAnimation(alert.element, alert.html));
    });
});

/**
 * Show the Slack RTM Connection alert.
 * @param {String} message A message from the Slack RTM Connection event.
 */
function alertSlackConnection(message) {
  return new P(resolve => renderHtmlAlertSlackConnection(message)
    .then(alert => alertSuccessAnimation(alert.element, alert.html))
    .then(() => resolve())
  );
}

/**
 * Show the Slack RTM Disconnection alert.
 * @param {String} message A message from the Slack RTM Disconnection event.
 */
function alertSlackDisconnection(message) {
  return new P(resolve => renderHtmlAlertSlackDisconnection(message)
    .then(alert => alertSuccessAnimation(alert.element, alert.html))
    .then(() => resolve())
  );
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
function alertSuccessAnimation(element, html) {
  return new P(resolve => fade(element, 0, 0)
    .then(() => upSlide(element, 0))
    .then(() => htmlSet(element, html))
    .then(() => downSlide(element, 500))
    .then(() => fade(element, 500, 1))
    .then(() => countTo(5))
    .then(() => fade(element, 500, 0))
    .then(() => upSlide(element, 500))
    .then(() => resolve()));
}

/**
 * Alert error animation sequence.
 * First, fade to zero opacity and slide up out of view just in case it is
 * visible. Next, set html content, slide down, and fade to full opacity. Leave
 * the error alert on the screen for the user to manually dismiss.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {String} html HTML to set as the content of each matched element.
 */
function alertErrorAnimation(element, html) {
  return new P(resolve => fade(element, 0, 0)
    .then(() => upSlide(element, 0))
    .then(() => htmlSet(element, html))
    .then(() => downSlide(element, 500))
    .then(() => fade(element, 500, 1))
    .then(() => resolve()));
}

/**
 * Attach a handler to the click event for the changeSettings element.
 * When clicked; hide the button, un-hide the token panel, un-hide the notify
 * panel (if the token element is populated), and scroll the un-hidden panels
 * into view.
 */
function enableChangeSettingsBtn() {
  return new P(resolve => {
    let btn = $("#changeSettings");
    btn.one("click", () => {
      let btn = $("#changeSettings");
      let tokenPanel = $("#tokenPanel");
      let notifyPanel = $("#defaultNotifyPanel");
      btn.off("click");
      btn.addClass("hidden");
      tokenPanel.removeClass("hidden");
      if ($("#slackToken").val()) notifyPanel.removeClass("hidden");
      tokenPanel[0].scrollIntoView();
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
    let btn = $("#slackRestartBtn");
    btn.off("click"); // Start with no click handler, prevent duplicates.
    renderHtmlBtnSlackRestart().then(html => btn.html(html));
    btn.one("click", () => { // Add new click handler.
      btn.off("click"); // When clicked, remove handler.
      renderHtmlBtnSlackRestarting().then(html => btn.html(html));
      socket.emit("slackRestartReq");
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
 * 
 */
function handleSaveTokenSuccess(token) {
  return new P(resolve => {
    $("#currentSettingsToken").html(token);
    $("#slackTokenInputGroup").addClass("has-success");
    $("#slackRestartBtn").removeClass("hidden");
    $("#stopSlack").removeClass("hidden");
    $("#defaultNotifyPanel").removeClass("hidden");
    socket.emit("slackRestartReq");
    resolve();
  });
}

/**
 * 
 */
function handleSaveTokenError() {
  return new P.resolve($("#slackTokenInputGroup").addClass("has-error"));
}

/**
 * Hide all drop down selectors for default notifications
 */
function hideDefaultNotifySelectors() {
  return new P(resolve => {
    $("#inputChannels").addClass("hidden");
    $("#inputGroups").addClass("hidden");
    $("#inputUsers").addClass("hidden");
    resolve();
  });
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
  return new P(resolve => element.slideDown(speed, resolve));
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
 * Set the HTML contents of matched elements.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {String} html HTML string to set as the content of matched elements.
 */
function htmlSet(element, html) {
  return new P.resolve(element.html(html));
}

/**
 * Update the Slack connection status.
 * @param {Boolean} connected True if connected, false if disconnected.
 */
function slackConnectionStatusUpdate(connected) {
  return new P(resolve => {
    let element = $("#slackIntegrationStatus");
    if (connected) {
      element.html("connected");
      element.removeClass(); // Remove all classes
      element.addClass("text-success");
    } else if (!connected) {
      element.html("disconnected");
      element.removeClass(); // Remove all classes
      element.addClass("text-danger");
    }
    resolve();
  });
}

/**
 * Animated slide-up to hide the matched elements.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {Number} speed Duration of the animation in milliseconds.
 */
function upSlide(element, speed) {
  return new P(resolve => element.slideUp(speed, resolve));
}