var socket = io.connect();

function alertDisplay(bundle) {
    bundle.alert.fadeTo(0, 0).slideUp(0, function() {
        bundle.alert[0].innerHTML = bundle.alertHtml;
        bundle.alert.slideDown(250, function() {
            bundle.alert.fadeTo(200, 1, function() {
                window.setTimeout(function() {
                    var alertHeight = bundle.alert[0].clientHeight;
                    if (alertHeight > 0) {
                        bundle.alert.fadeTo(200, 0).slideUp(500);
                    }
                }, 5000);
            });
        });
    });
}

function bindSetupSlackIntegration() {
    $("#setupSlackIntegration").click(function() {
        document.getElementById("setupSlackIntegration").classList.add('hidden');
        document.getElementById("tokenPanel").classList.remove('hidden');
        var inputValue = document.getElementById("slackToken").value;
        if (inputValue) {
            document.getElementById("defaultNotifyPanel").classList.remove('hidden');
        }
        // Scroll down to the newly visible settings
        var element = document.getElementById("tokenPanel");
        var alignWithTop = true;
        element.scrollIntoView(alignWithTop);
    });
}
bindSetupSlackIntegration();

function slackRestartOrStopRes(bundle) {
    var statusElement = document.getElementById('slackIntegrationStatus');
    statusElement.innerHTML = bundle.status;
    statusElement.classList.remove(bundle.remove);
    statusElement.classList.add(bundle.add);
    bundle.button[0].innerHTML = bundle.buttonHtml;
    alertDisplay(bundle);
}
function bindRestartSlackIntegration() {
    $("#restartSlackIntegration").click(function() {
        // Unbind the button (do not respond to clicks anymore) and show loader animation
        $(this).unbind('click');
        $(this).html("<div class=\"loader pull-left\"></div> &nbsp; Restarting Slack Integration");
        // Emit our save request with the token
        socket.emit('slackRestartReq');
    });
}
bindRestartSlackIntegration();
socket.on('slackRestartRes', function() {
    // Enable the button again
    bindRestartSlackIntegration();
    slackRestartOrStopRes({
        status:'connected',
        remove:'text-danger',
        add:'text-success',
        button:$('#restartSlackIntegration'),
        buttonHtml:'<span class=\"glyphicon glyphicon-refresh\"></span> Restart Slack Integration',
        alert:$("#restartSlackIntegrationAlert"),
        alertHtml:'<div class=\"alert alert-warning\" style=\"margin:0px; border-radius:0px;\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Warning!</strong> Slack integration was restarted.</div>'
    });
});

function bindStopSlackIntegration() {
    $("#stopSlackIntegration").click(function() {
        // Unbind the button (do not respond to clicks anymore) and show loader animation
        $(this).unbind('click');
        $(this).html("<div class=\"loader pull-left\"></div> &nbsp; Stopping Slack Integration");
        // Emit our save request with the token
        socket.emit('slackStopReq');
    });
}
bindStopSlackIntegration();
socket.on('slackStopRes', function() {
    // Enable the button again
    bindStopSlackIntegration();
    slackRestartOrStopRes({
        status:'stopped',
        remove:'text-success',
        add:'text-danger',
        button:$('#stopSlackIntegration'),
        buttonHtml:'<span class=\"glyphicon glyphicon-off\"></span> Stop Slack Integration',
        alert:$("#stopSlackIntegrationAlert"),
        alertHtml:'<div class=\"alert alert-danger\" style=\"margin:0px; border-radius:0px;\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Danger!</strong> Slack integration was stopped.</div>'
    });
});

function bindSaveSlackTokenButton() {
    $("#saveSlackTokenButton").click(function() {
        // Unbind the button (do not respond to clicks anymore) and show loader animation
        $(this).unbind('click');
        $(this).html("<div class=\"loader pull-left\"></div>");
        // Emit our save request with the token
        socket.emit('saveSlackTokenReq', {
            slackToken: $('input[id=slackToken]').val()
        });
    });
}
bindSaveSlackTokenButton();
socket.on('saveSlackTokenRes', function(bundle) {
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
        alertDisplay({
            alert:$("#saveSlackTokenAlert"),
            alertHtml:'<div class=\"alert alert-success\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Success!</strong> Slack token saved successfully. Slack integration is being restarted to use the new token.</div>'
        });
        // Restart Slack integration
        socket.emit('slackRestartReq');
    } else {
        document.getElementById("saveSlackTokenAlert").innerHTML = "<div class=\"alert alert-danger\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Error!</strong> There was an error. Slack token was not saved.</div>";
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
        alertDisplay({
            alert:$("#saveSlackNotifyAlert"),
            alertHtml:'<div class=\"alert alert-success\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Success!</strong> Default notification recipient saved successfully. Slack integration is being restarted to use the new setting.</div>'
        });
        // Restart Slack integration
        socket.emit('slackRestartReq');
    } else {
        document.getElementById("saveSlackNotifyAlert").innerHTML = "<div class=\"alert alert-danger\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Error!</strong> There was an error. Default notification recipient was not saved.</div>";
    }
}

// Remove has-success from inputs when modified
function removeHasSuccess(bundle) {bundle.element[0].classList.remove('has-success');}
$("#slackToken").keyup(function() {removeHasSuccess({element:$("#slackTokenInputGroup")});});
$("#defaultChannelSelect").change(function() {removeHasSuccess({element:$("#inputChannels")});});
$("#defaultGroupSelect").change(function() {removeHasSuccess({element:$("#inputGroups")});});
$("#defaultUserSelect").change(function() {removeHasSuccess({element:$("#inputUsers")});});

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
    bundle.buttonElement.click(function() {
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
            defaultNotifyType:bundle.defaultNotifyType,
            defaultNotify:bundle.defaultNotify
        });
    });
}

function bindDefaultNotifyTypeRadioButton(bundle) {
    bundle.radioElement.click(function() {
        // Start with all options hidden and an empty select element.
        hideDefaultNotifySelectors();
        bundle.selectElement.options.length = 0;
        // Show the progress bar while the data is loaded.
        document.getElementById("progressDefaultNotifications").classList.remove('hidden');
        // Emit request for options.
        socket.emit(bundle.socketReq);
    });
}

socket.on('saveSlackNotifyRes', function(bundle) {
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
        buttonElement:bundle.buttonElement,
        defaultNotifyType:bundle.defaultNotifyType
    });
    bundle.buttonElement[0].innerHTML = "<span class=\"glyphicon glyphicon-save\"></span> Save";
    // Display an alert with the response.
    alertSaveSlackNotifyResponse(bundle);
});

// Channels - Define behavior when the Channel radio button is selected
bindDefaultNotifyTypeRadioButton({
    radioElement:$("#radioChannel"),
    selectElement:document.getElementById("defaultChannelSelect"),
    socketReq:'readSlackChannelsReq'
});
socket.on('readSlackChannelsRes', function(channelNames) {
    readSlackChannelsGroupsUsersRes({
        inputDropdown:document.getElementById("inputChannels"),
        dropDownOptions:channelNames,
        selector:document.getElementById("defaultChannelSelect")
    });
});
bindSaveSlackDefaultNotifyButton({
    buttonElement:$("#saveSlackDefaultNotifyChannel"),
    defaultNotifyType:'channel'
});

// Groups - Define behavior when the Groups radio button is selected
bindDefaultNotifyTypeRadioButton({
    radioElement:$("#radioGroup"),
    selectElement:document.getElementById("defaultGroupSelect"),
    socketReq:'readSlackGroupsReq'
});
socket.on('readSlackGroupsRes', function(groupNames) {
    readSlackChannelsGroupsUsersRes({
        inputDropdown:document.getElementById("inputGroups"),
        dropDownOptions:groupNames,
        selector:document.getElementById("defaultGroupSelect")
    });
});
bindSaveSlackDefaultNotifyButton({
    buttonElement:$("#saveSlackDefaultNotifyGroup"),
    defaultNotifyType:'group'
});

// Users - Define behavior when the Direct Messages radio button is selected
bindDefaultNotifyTypeRadioButton({
    radioElement:$("#radioUser"),
    selectElement:document.getElementById("defaultUserSelect"),
    socketReq:'readSlackUsersReq'
});
socket.on('readSlackUsersRes', function(userNames) {
    readSlackChannelsGroupsUsersRes({
        inputDropdown:document.getElementById("inputUsers"),
        dropDownOptions:userNames,
        selector:document.getElementById("defaultUserSelect")
    });
});
bindSaveSlackDefaultNotifyButton({
    buttonElement:$("#saveSlackDefaultNotifyUser"),
    defaultNotifyType:'user'
});