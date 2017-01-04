#!/usr/bin/env node

'use strict';

// Web framework courtesy of https://github.com/expressjs/express
var express = require('express');
var app = require('express')();
var server = require('http').Server(app); // https://nodejs.org/api/http.html
var path = require('path'); // https://nodejs.org/api/path.html

// Realtime application framework courtesy of https://github.com/socketio/socket.io
var io = require('socket.io')(server);

// Data store courtesy of https://github.com/juliangruber/level-pathwise
var Pathwise = require('level-pathwise');
var level = require('level');
var db = new Pathwise(level('./unblinkingbot.db'));

// Slack integration courtesy of https://github.com/slackhq/node-slack-sdk
var RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;
var rtm;

// unblinkingBot utilities https://github.com/nothingworksright/unblinkingBot
var ubproc = require('./unblinkingprocess.js');
var ubslack = require('./unblinkingslack.js');

// Just a few more things ...
var port = 1138;

console.log(`\n`);

// Start the web server, for a user interface
server.listen(port, function() {
    console.log(`Http__ Server running on http://localhost:${port}`);
});

app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', function (req, res) {
    var bundle = {};
    bundle.title = 'Dashboard';
    if (rtm && rtm.connected) {
        bundle.rtmConnected = true;
    }
    db.get(['unblinkingSlack','history'], function(err, history) {
        if (err) {
            console.log(`ERROR: ${err}`);
        } else {
            bundle.history = JSON.stringify(history, undefined, 2);
            res.render('index', bundle);
        }
    });
});
app.get('/settings', function (req, res) {
    var bundle = {};
    bundle.title = 'Settings';
    if (rtm && rtm.connected) {
        bundle.rtmConnected = true;
    }
    db.get(['unblinkingSlack','credentials','token'], function(err, token) {
        if (err) {
            console.log(`ERROR: ${err}`);
        } else {
            if (typeof token === 'string' || token instanceof String) {
                bundle.slackToken = token;
            } else {
                bundle.slackToken = undefined;
            }
            db.get(['unblinkingSlack','credentials','defaultNotify'], function(err, defaultNotify) {
                if (err) {
                    console.log(`ERROR: ${err}`);
                } else {
                    if (typeof defaultNotify === 'string' || defaultNotify instanceof String) {
                        bundle.defaultNotify = defaultNotify;
                    } else {
                        bundle.defaultNotify = undefined;
                    }
                    db.get(['unblinkingSlack','credentials','defaultNotifyType'], function(err, defaultNotifyType) {
                        if (err) {
                            console.log(`ERROR: ${err}`);
                        } else {
                            if (typeof defaultNotifyType === 'string' || defaultNotifyType instanceof String) {
                                bundle.defaultNotifyType = defaultNotifyType;
                            } else {
                                bundle.defaultNotifyType = undefined;
                            }
                            res.render('settings', bundle);
                        }
                    });
                }
            });
        }
    });
});
app.get('/datastore', function (req, res) {
    res.render('datastore', {title:'Data Store'});
});
app.use(express.static(path.join(__dirname, '/public')));

function startSlackIntegration() {
    // Get the Slack bot-user token from the levelDB data store.
    db.get(['unblinkingSlack','credentials','token'], function(err, token) {
        if (err) {
            console.log(`ERROR: ${err}`);
        } else {
            if (typeof token === 'string' || token instanceof String) {
                console.log(`Slack integration starting. Token appears to be a string.`);
                // Instantiate the new Slack RTM Client object.
                rtm = new RtmClient(token, {
                    logLevel: 'verbose',
                    dataStore: new MemoryDataStore()
                });
                // Pass the new RTM Client object to the unblinkingslack
                // integration script.
                ubslack.slackIntegration({
                    db:db,
                    rtm:rtm,
                    socket:io
                });
            } else {
                console.log(`Slack integration disabled. Token is not a string.`);
            }
        }
    });
}
startSlackIntegration();

// Realtime application framework connection listeners
io.on('connection', function(socket) {
    //console.log(`Socket.io__ someone connected.`);
    socket.on('disconnect', function() {
        //console.log(`Socket.io__ someone disconnected.`);
    });

    // Read full data store
    socket.on('readFullDbReq', function() {
        db.get([], function(err, obj) {
            if (err) {
                console.log(`ERROR: ${err}`);
            } else {
                socket.emit('readFullDbRes', obj);
            }
        });
    });

    // Read available Slack channels
    socket.on('readSlackChannelsReq', function() {
        db.get(['unblinkingSlack','channels'], function(err, channels) {
            if (err) {
                console.log(`ERROR: ${err}`);
            } else {
                var channelNames = [];
                Object.keys(channels).forEach(function(key) {
                    // Only if the bot is a member of the channel.
                    if (channels[key].is_member) {
                        channelNames.push(channels[key].name);
                    }
                });
                socket.emit('readSlackChannelsRes', channelNames);
            }
        });
    });

    // Read available Slack groups
    socket.on('readSlackGroupsReq', function() {
        db.get(['unblinkingSlack','groups'], function(err, groups) {
            if (err) {
                console.log(`ERROR: ${err}`);
            } else {
                var groupNames = [];
                Object.keys(groups).forEach(function(key) {
                    groupNames.push(groups[key].name);
                });
                socket.emit('readSlackGroupsRes', groupNames);
            }
        });
    });


    // Read available Slack users
    socket.on('readSlackUsersReq', function() {
        db.get(['unblinkingSlack','dms'], function(err, dms) {
            if (err) {
                console.log(`ERROR: ${err}`);
            } else {
                var dmUserIds = [];
                Object.keys(dms).forEach(function(key) {
                    dmUserIds.push(dms[key].user);
                });
                db.get(['unblinkingSlack','users'], function(err, users) {
                    if (err) {
                        console.log(`ERROR: ${err}`);
                    } else {
                        var userNames = [];
                        dmUserIds.forEach(function(id) {
                            userNames.push(users[id].name);
                        });
                        socket.emit('readSlackUsersRes', userNames);
                    }
                });
            }
        });
    });


    // Save Slack token
    socket.on('saveSlackTokenReq', function(bundle) {
        db.put([], {
            unblinkingSlack: {
                credentials: {
                    token: bundle.slackToken
                }
            }
        }, function(err){
            if (err) {
                bundle.success = false;
                bundle.err = err;
            } else {
                bundle.success = true;
            }
            socket.emit('saveSlackTokenRes', {
                token:bundle.slackToken,
                success:bundle.success,
                err:bundle.err
            });
        });
    });

    // Save Slack default-notify
    socket.on('saveSlackNotifyReq', function(bundle) {
        var slackObjectName;
        if (bundle.defaultNotifyType === 'channel') {
            slackObjectName = 'channels';
        }
        if (bundle.defaultNotifyType === 'group') {
            slackObjectName = 'groups';
        }
        if (bundle.defaultNotifyType === 'user') {
            slackObjectName = 'users';
        }
        function saveSlackNotifyAndEmitRes(bundle) {
            db.put([], {
                unblinkingSlack: {
                    credentials: {
                        defaultNotifyId: bundle.defaultNotifyId,
                        defaultNotifyType: bundle.defaultNotifyType,
                        defaultNotify: bundle.defaultNotify
                    }
                }
            }, function(err){
                if (err) {
                    bundle.success = false;
                    bundle.err = err;
                } else {
                    bundle.success = true;
                }
                socket.emit('saveSlackNotifyRes', {
                    defaultNotifyType: bundle.defaultNotifyType,
                    defaultNotify: bundle.defaultNotify,
                    success:bundle.success,
                    err:bundle.err
                });
            });
        }
        db.get(['unblinkingSlack',slackObjectName], function(err, obj) {
            if (err) {
                console.log(`ERROR: ${err}`);
            } else {
                Object.keys(obj).forEach(function(key) {
                    if (obj[key].name === bundle.defaultNotify) {
                        bundle.defaultNotifyId = key.toString();
                        if (bundle.defaultNotifyType !== 'user') {
                            saveSlackNotifyAndEmitRes(bundle);
                        } else {
                            // If its a user, get the correct DM id number
                            db.get(['unblinkingSlack','dms'], function(err, obj) {
                                if (err) {
                                    console.log(`ERROR: ${err}`);
                                } else {
                                    Object.keys(obj).forEach(function(key) {
                                        if (obj[key].user === bundle.defaultNotifyId) {
                                            bundle.defaultNotifyId = key;
                                            saveSlackNotifyAndEmitRes(bundle);
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });
    });

    function rtmCloseDisconnect() {
        if (rtm && rtm.connected) {
            // Set autoReconnect to false
            rtm.autoReconnect = false;
            // Close the Slack client websocket
            rtm.handleWsClose('1', 'User request');
            // Disconnect the Slack RTM client
            rtm.disconnect('User request', '1');
            // Emit notice of Slack client stop
            socket.emit('slackStopRes');
        } else {
            console.log(`RTM close and disconnect requested without a connection.`);
        }
    }

    // Restart Slack integration
    socket.on('slackRestartReq', function() {
        rtmCloseDisconnect();
        startSlackIntegration();
    });

    // Stop Slack integration
    socket.on('slackStopReq', function() {
        rtmCloseDisconnect();
    });

    // Restart the unblinkingBot application
    socket.on('restartReq', function() {
        console.log('Request to restart unblinkingBot application.');
        process.exit(1);
        /*
        ubproc.unblinkingSpawn({
            command:'npm',
            args:'restart',
            options:undefined
        });
        */
    });

});

// define web server error-handling middleware last, after other app.use() and routes calls
app.use(function(req, res, next) {
    // res.status(404).send('Sorry cant find that!');
    res.status(404).render('404');
});
app.use(function(err, req, res, next) {
    if (err) {
        console.log(`Express error`);
        console.error(err.stack);
    }
    res.status(500).send('Something broke!');
});

// exit the main server process gracefully when the time comes
process.on('exit', (code) => {
    console.log(`Server.js__ Process exiting with code ${code}`);

});