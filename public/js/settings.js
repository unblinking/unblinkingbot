var socket = io.connect();

attachHandlerChangeSettings();

/**
 * Alert element animation.
 * First, fade to zero opacity and slide up out of view just in case it is
 * visible. Next, set html content, slide down, fade to full opacity, and sleep
 * while the alert is visible. Last, fade to zero opacity and slide up out of
 * view.
 * 
 * @param {Object} bundle
 */
function alertAnim(bundle) {
  fade(0, 0).then(() => {
    return up(0);
  }).then(() => {
    return setHtml(bundle.alertHtml);
  }).then(() => {
    return down(500);
  }).then(() => {
    return fade(500, 1);
  }).then(() => {
    return sleep(5000);
  }).then(() => {
    return fade(500, 0);
  }).then(() => {
    return up(500);
  });
  function fade(speed, opacity) {
    return new Promise(function (resolve) {
      bundle.alert.fadeTo(speed, opacity, resolve);
    });
  }
  function up(speed) {
    return new Promise(function (resolve) {
      bundle.alert.slideUp(speed, resolve);
    });
  }
  function setHtml(html) {
    return new Promise(function (resolve) {
      bundle.alert[0].innerHTML = html;
      resolve();
    });
  }
  function down(speed) {
    return new Promise(function (resolve) {
      bundle.alert.slideDown(speed, resolve);
    });
  }
  function sleep(speed) {
    return new Promise(function (resolve) {
      setTimeout(resolve, speed);
    });
  }
}

/**
 * Attach a handler to the click event for the changeSettings element.
 * When clicked; hide the button, un-hide the token panel, un-hide the notify
 * panel (if the token element is populated), and scroll the un-hidden panels
 * into view.
 */
function attachHandlerChangeSettings() {
  $("#changeSettings").one("click", function () {
    $(this).addClass('hidden');
    $("#tokenPanel").removeClass('hidden');
    let value = $("#slackToken").val();
    if (value) {
      $("#defaultNotifyPanel").removeClass('hidden');
    }
    $("#tokenPanel")[0].scrollIntoView();
  });
}

function slackRestartOrStopRes(bundle) {
  var statusElement = document.getElementById('slackIntegrationStatus');
  statusElement.innerHTML = bundle.status;
  statusElement.classList.remove(bundle.remove);
  statusElement.classList.add(bundle.add);
  bundle.button[0].innerHTML = bundle.buttonHtml;
  alertAnim(bundle);
}

function bindRestartSlackIntegration() {
  $("#restartSlackIntegration").unbind().click(function () {
    $(this).unbind('click');
    // Show loader animation
    $(this).html("<div class=\"loader pull-left\"></div> &nbsp; Restarting Slack Integration");
    socket.emit('slackRestartReq');
  });
}
bindRestartSlackIntegration();
socket.on('slackRestartRes', function () {
  // Enable the button again
  bindRestartSlackIntegration();
  slackRestartOrStopRes({
    status: 'connected',
    remove: 'text-danger',
    add: 'text-success',
    button: $('#restartSlackIntegration'),
    buttonHtml: '<span class=\"glyphicon glyphicon-refresh\"></span> Restart Slack Integration',
    alert: $("#restartSlackIntegrationAlert"),
    alertHtml: '<div class=\"alert alert-warning fade in\" style=\"margin:0px; border-radius:0px;\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Warning!</strong> Slack integration was restarted.</div>'
  });
});

function bindStopSlackIntegration() {
  $("#stopSlackIntegration").unbind().click(function () {
    $(this).unbind('click');
    // Show loader animation
    $(this).html("<div class=\"loader pull-left\"></div> &nbsp; Stopping Slack Integration");
    socket.emit('slackStopReq');
  });
}
bindStopSlackIntegration();
socket.on('slackStopRes', function () {
  // Enable the button again
  bindStopSlackIntegration();
  slackRestartOrStopRes({
    status: 'stopped',
    remove: 'text-success',
    add: 'text-danger',
    button: $('#stopSlackIntegration'),
    buttonHtml: '<span class=\"glyphicon glyphicon-off\"></span> Stop Slack Integration',
    alert: $("#stopSlackIntegrationAlert"),
    alertHtml: '<div class=\"alert alert-danger fade in\" style=\"margin:0px; border-radius:0px;\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Danger!</strong> Slack integration was stopped.</div>'
  });
});

function bindSaveSlackTokenButton() {
  $("#saveSlackTokenButton").unbind().click(function () {
    $(this).unbind('click');
    // Show loader animation
    $(this).html("<div class=\"loader pull-left\"></div>");
    // Emit our save request with the token
    socket.emit('saveSlackTokenReq', $('input[id=slackToken]').val());
  });
}
bindSaveSlackTokenButton();
socket.on('saveSlackTokenRes', function (bundle) {
  // Enable the button again
  bindSaveSlackTokenButton();
  document.getElementById("saveSlackTokenButton").innerHTML = "<span class=\"glyphicon glyphicon-save\"></span> Save";
  // Show a success or error message
  if (bundle.success === true) {
    document.getElementById("currentSettingsToken").innerHTML = bundle.token;
    document.getElementById("slackTokenInputGroup").classList.add('has-success');
    document.getElementById("restartSlackIntegration").classList.remove('hidden');
    document.getElementById("stopSlackIntegration").classList.remove('hidden');
    document.getElementById("defaultNotifyPanel").classList.remove('hidden');
    alertAnim({
      alert: $("#saveSlackTokenAlert"),
      alertHtml: '<div class=\"alert alert-success fade in\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Success!</strong> Slack token saved successfully. Slack integration is being restarted to use the new token.</div>'
    });
    // Restart Slack integration
    socket.emit('slackRestartReq');
  } else {
    document.getElementById("saveSlackTokenAlert").innerHTML = "<div class=\"alert alert-danger fade in\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Error!</strong> There was an error. Slack token was not saved. &nbsp; <a class=\"label label-default small\" type=\"button\" data-toggle=\"collapse\" data-target=\"#errorDetails\" aria-expanded=\"false\" aria-controls=\"errorDetails\">Details</a><br><br><div class=\"well collapse\" id=\"errorDetails\" style=\"background-color:#000; overflow:hidden\">" + bundle.err + "</div></div>";
    /*
    document.getElementById("saveSlackTokenAlert").innerHTML = "<div class=\"alert alert-danger fade in\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Error!</strong> There was an error. Slack token was not saved.</div>";
    */
  }
});

// Methods for setting the default notifications target

// Hide all drop down selectors for default notifications
function hideDefaultNotifySelectors() {
  document.getElementById("inputChannels").classList.add('hidden');
  document.getElementById("inputGroups").classList.add('hidden');
  document.getElementById("inputUsers").classList.add('hidden');
}

// Success and error messages on save default notify requests
function alertSaveSlackNotifyResponse(bundle) {
  if (bundle.success === true) {
    document.getElementById("currentSettingsNotify").innerHTML = bundle.defaultNotifyType + ' ' + bundle.defaultNotify;
    if (bundle.defaultNotifyType === 'channel') {
      document.getElementById("inputChannels").classList.add('has-success');
    }
    if (bundle.defaultNotifyType === 'group') {
      document.getElementById("inputGroups").classList.add('has-success');
    }
    if (bundle.defaultNotifyType === 'user') {
      document.getElementById("inputUsers").classList.add('has-success');
    }
    alertAnim({
      alert: $("#saveSlackNotifyAlert"),
      alertHtml: '<div class=\"alert alert-success fade in\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Success!</strong> Default notification recipient saved successfully. Slack integration is being restarted to use the new setting.</div>'
    });
    // Restart Slack integration
    socket.emit('slackRestartReq');
  } else {
    document.getElementById("saveSlackNotifyAlert").innerHTML = "<div class=\"alert alert-danger fade in\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Error!</strong> There was an error. Default notification recipient was not saved.</div>";
  }
}

// Remove has-success from inputs when modified
function removeHasSuccess(bundle) {
  bundle.element[0].classList.remove('has-success');
}
$("#slackToken").keyup(function () {
  removeHasSuccess({
    element: $("#slackTokenInputGroup")
  });
});
$("#defaultChannelSelect").change(function () {
  removeHasSuccess({
    element: $("#inputChannels")
  });
});
$("#defaultGroupSelect").change(function () {
  removeHasSuccess({
    element: $("#inputGroups")
  });
});
$("#defaultUserSelect").change(function () {
  removeHasSuccess({
    element: $("#inputUsers")
  });
});

function readSlackChannelsGroupsUsersRes(bundle) {
  // Show the input drop down
  bundle.inputDropdown.classList.remove('hidden');
  // Populate options in the selector
  var length = bundle.dropDownOptions.length;
  for (var i = 0; i < length; i++) {
    var name = bundle.dropDownOptions[i];
    var option = document.createElement("option");
    option.text = name;
    bundle.selector.add(option);
  }
  // Hide the progress bar
  document.getElementById("progressDefaultNotifications").classList.add('hidden');
}

function bindSaveSlackDefaultNotifyButton(bundle) {
  bundle.buttonElement.unbind().click(function () {
    // Unbind the button (do not respond to clicks anymore) and show loader animation
    $(this).unbind('click');
    $(this).html("<div class=\"loader pull-left\"></div>");
    if (bundle.defaultNotifyType === 'channel') {
      bundle.defaultNotify = $('select[id=defaultChannelSelect]').val();
    }
    if (bundle.defaultNotifyType === 'group') {
      bundle.defaultNotify = $('select[id=defaultGroupSelect]').val();
    }
    if (bundle.defaultNotifyType === 'user') {
      bundle.defaultNotify = $('select[id=defaultUserSelect]').val();
    }
    // Emit request to save the default notification target
    socket.emit('saveSlackNotifyReq', {
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
    document.getElementById("progressDefaultNotifications").classList.remove('hidden');
    // Emit request for options.
    socket.emit(bundle.socketReq);
  });
}

socket.on('saveSlackNotifyRes', function (bundle) {
  if (bundle.defaultNotifyType === 'channel') {
    bundle.buttonElement = $("#saveSlackDefaultNotifyChannel");
  }
  if (bundle.defaultNotifyType === 'group') {
    bundle.buttonElement = $("#saveSlackDefaultNotifyGroup");
  }
  if (bundle.defaultNotifyType === 'user') {
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
  socketReq: 'readSlackChannelsReq'
});
socket.on('readSlackChannelsRes', function (channelNames) {
  readSlackChannelsGroupsUsersRes({
    inputDropdown: document.getElementById("inputChannels"),
    dropDownOptions: channelNames,
    selector: document.getElementById("defaultChannelSelect")
  });
});
bindSaveSlackDefaultNotifyButton({
  buttonElement: $("#saveSlackDefaultNotifyChannel"),
  defaultNotifyType: 'channel'
});

// Groups - Define behavior when the Groups radio button is selected
bindDefaultNotifyTypeRadioButton({
  radioElement: $("#radioGroup"),
  selectElement: document.getElementById("defaultGroupSelect"),
  socketReq: 'readSlackGroupsReq'
});
socket.on('readSlackGroupsRes', function (groupNames) {
  readSlackChannelsGroupsUsersRes({
    inputDropdown: document.getElementById("inputGroups"),
    dropDownOptions: groupNames,
    selector: document.getElementById("defaultGroupSelect")
  });
});
bindSaveSlackDefaultNotifyButton({
  buttonElement: $("#saveSlackDefaultNotifyGroup"),
  defaultNotifyType: 'group'
});

// Users - Define behavior when the Direct Messages radio button is selected
bindDefaultNotifyTypeRadioButton({
  radioElement: $("#radioUser"),
  selectElement: document.getElementById("defaultUserSelect"),
  socketReq: 'readSlackUsersReq'
});
socket.on('readSlackUsersRes', function (userNames) {
  readSlackChannelsGroupsUsersRes({
    inputDropdown: document.getElementById("inputUsers"),
    dropDownOptions: userNames,
    selector: document.getElementById("defaultUserSelect")
  });
});
bindSaveSlackDefaultNotifyButton({
  buttonElement: $("#saveSlackDefaultNotifyUser"),
  defaultNotifyType: 'user'
});