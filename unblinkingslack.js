#!/usr/bin/env node

'use strict';

var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var ubdb = require('./unblinkingdb.js');

function startup(bundle) {
    bundle.rtm.start();
    bundle.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
        console.log(`RTM Client authenticated. Rtm.start payload captured.`);
    });
    // wait for the client to connect
    bundle.rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function() {
        var user = bundle.rtm.dataStore.getUserById(bundle.rtm.activeUserId);
        var team = bundle.rtm.dataStore.getTeamById(bundle.rtm.activeTeamId);
        console.log(`RTM connection opened. RTM hello event received.`);
        console.log(`RTM connected to ${team.name} as bot user ${user.name}.`);

        bundle.socket.emit('slackRestartRes');

        function saveSlackData(object) {
            bundle.db.put([], {
                unblinkingSlack: object
            }, function(err) {
                if (err) {
                    console.log(`ERROR: ${err}`);
                } else {
                    // Success
                }
            });
        }
        saveSlackData({channels: bundle.rtm.dataStore.channels});
        saveSlackData({users: bundle.rtm.dataStore.users});
        saveSlackData({dms: bundle.rtm.dataStore.dms});
        saveSlackData({groups: bundle.rtm.dataStore.groups});
        saveSlackData({bots: bundle.rtm.dataStore.bots});
        saveSlackData({teams: bundle.rtm.dataStore.teams});

        bundle.callbacks.startup(bundle);
    });

    // Some extra logging to the console to determine why we sometimes end up
    // with multiple open websockets, presented as duplicate bot responses.
    function clientEventLogging(desc, err, code, reason) {
        if (desc) {
            console.log(`RTM Client Event: ${desc}`);
        }
        if (err) {
            console.log(`RTM Client Event: ${err}`);
        }
        if (code) {
            console.log(`RTM Client Event: ${code}`);
        }
        if (reason) {
            console.log(`RTM Client Event: ${reason}`);
        }
    }
    bundle.rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, function(err, code) {
        var desc = 'CLIENT_EVENTS.RTM.DISCONNECT';
        clientEventLogging(desc, err, code, undefined);
    });
    bundle.rtm.on(CLIENT_EVENTS.RTM.ATTEMPTING_RECONNECT, function() {
        var desc = 'CLIENT_EVENTS.RTM.ATTEMPTING_RECONNECT';
        clientEventLogging(desc, undefined, undefined, undefined);
    });
    bundle.rtm.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, function(err) {
        var desc = 'CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START';
        clientEventLogging(desc, err, undefined, undefined);
    });
    bundle.rtm.on(CLIENT_EVENTS.RTM.WS_OPENING, function() {
        var desc = 'CLIENT_EVENTS.RTM.WS_OPENING';
        clientEventLogging(desc, undefined, undefined, undefined);
    });
    bundle.rtm.on(CLIENT_EVENTS.RTM.WS_OPENED, function() {
        var desc = 'CLIENT_EVENTS.RTM.WS_OPENED';
        clientEventLogging(desc, undefined, undefined, undefined);
    });
    bundle.rtm.on(CLIENT_EVENTS.RTM.WS_CLOSE, function(code, reason) {
        var desc = 'CLIENT_EVENTS.RTM.WS_CLOSE';
        clientEventLogging(desc, undefined, code, reason);
    });
    bundle.rtm.on(CLIENT_EVENTS.RTM.WS_ERROR, function(err) {
        var desc = 'CLIENT_EVENTS.RTM.WS_ERROR';
        clientEventLogging(desc, err, undefined, undefined);
    });

}
exports.startup = startup;

function trimMessageLog(bundle) {
    bundle.objectPath = ['unblinkingSlack','history'];
    ubdb.trimObjKeys(bundle);
}
exports.trimMessageLog = trimMessageLog;

function logSlacktivity(bundle) {
    bundle.now = new Date().getTime();
    if (bundle.slacktivity) {
        bundle.db.put([], {
            unblinkingSlack: {
                history: {
                    [bundle.now]: {
                        slacktivity: bundle.slacktivity
                    }
                }
            }
        }, function(err) {
            if (err) {
                console.log(`ERROR: ${err}`);
            } else {
                // Success logging this message, now trim the message log.
                trimMessageLog(bundle);
            }
        });
    }
}
exports.logSlacktivity = logSlacktivity;

function sendMessage(bundle) {
    bundle.rtm.sendMessage(
        bundle.sending.text,
        bundle.sending.id,
        function messageSent(err, msg) {
            if (err) {
                bundle.slacktivity = err;
                logSlacktivity(bundle);
            } else {
                bundle.slacktivity = msg;
                logSlacktivity(bundle);
            }
        }
    );
}
exports.sendMessage = sendMessage;

function listenForEvents(bundle) {
    bundle.rtm.on(RTM_EVENTS.MESSAGE, function(message) {
        // Log the activity
        bundle.slacktivity = message;
        logSlacktivity(bundle);
        // Add the message to the bundle
        bundle.event = message;
        // See whats in the message text, if there is any
        if (bundle.event.text) {
            // If the unblinkingbot name or user ID is mentioned ...
            var re = new RegExp(bundle.rtm.activeUserId, 'g');
            if (bundle.event.text.match(/unblinkingbot/gi) || bundle.event.text.match(re)) {
                // Reply to the message
                bundle.sending = {};
                bundle.sending.user = bundle.rtm.dataStore.getUserById(bundle.event.user);
                bundle.sending.text = `That's my name ${bundle.sending.user.name}, don't wear it out!`;
                bundle.sending.id = bundle.event.channel;
                sendMessage(bundle);
            }
        }
    });
    bundle.rtm.on(RTM_EVENTS.GOODBYE, function(message) {
        // Log the activity
        bundle.slacktivity = message;
        logSlacktivity(bundle);
    });
}
exports.listenForEvents = listenForEvents;

// Slack integration
function slackIntegration(bundle) {
    bundle.callbacks = {
        slackIntegration:startup,
        startup:listenForEvents
    };
    //
    bundle.callbacks.slackIntegration(bundle);
}
exports.slackIntegration = slackIntegration;