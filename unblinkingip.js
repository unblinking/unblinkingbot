#!/usr/bin/env node

'use strict';

var getIP = require('external-ip')();
var humanDuration = require('humanize-duration');
var moment = require('moment');
var ubslack = require('./unblinkingslack.js');
var ubdb = require('./unblinkingdb.js');

function durationSinceLastCheck(bundle) {
    //console.log(`unblinkingip.js durationSinceLastCheck`);
    // Set bundle object values and run the callback.
    function setUsingLastCheck(bundle) {
        bundle.humanLastCheck = moment(bundle.lastCheck).format('YYYY-MM-DD hh:mm a');
        bundle.duration = bundle.now - bundle.lastCheck;
        bundle.humanDuration = humanDuration(bundle.duration, {units:['d', 'h', 'm', 's'], round:true, largest:2});
        bundle.callbacks.durationSinceLastCheck(bundle);
    }
    // When was the last check
    bundle.db.get(['unblinkingIp','ipCheckHistory'], function(err, obj) {
        if (err) {
            console.log(`ERROR: ${err}`);
        } else {
            if (Object.keys(obj).length === 0) {
                // If there are no keys, set last check as zero
                bundle.lastCheck = 0;
                setUsingLastCheck(bundle);
            } else {
                // If there are keys (children), set last check as the max key
                bundle.db.children(['unblinkingIp','ipCheckHistory'], function(err, children) {
                    if (err) {
                        console.log(`ERROR: ${err}`);
                    } else {
                        bundle.lastCheck = (Math.max.apply(null, children));
                        setUsingLastCheck(bundle);
                    }
                });
            }
        }
    });
}
exports.durationSinceLastCheck = durationSinceLastCheck;

function enoughDurationOrNot(bundle) {
    //console.log(`unblinkingip.js enoughDurationOrNot`);
    if (bundle.duration > 3600000) { // 3600000 is one hour
        bundle.enoughDuration = true;
    } else {
        bundle.enoughDuration = false;
    }
    bundle.callbacks.enoughDurationOrNot(bundle);
}
exports.enoughDurationOrNot = enoughDurationOrNot;

function getExternalIp(bundle) {
    //console.log(`unblinkingip.js getExternalIp`);
    if (bundle.enoughDuration) {
        getIP(
            function (err, ip) {
                if (err) {
                    console.log(`unblinkingip.js getExternalIp ERROR: ${err}`);
                } else {
                    bundle.newIp = ip;
                    bundle.callbacks.getExternalIp(bundle);
                }
            }
        );
    } else {
        bundle.newIp = false;
        bundle.callbacks.getExternalIp(bundle);
    }
}
exports.getExternalIp = getExternalIp;

function logIpCheck(bundle) {
    //console.log(`unblinkingip.js logIpCheck`);
    // If we used the external-ip service to request our current external IP
    // address, we should record that in the levelDB data store, so that we know
    // how frequently we're doing that, and don't over-use the service.
    if (bundle.newIp) {
        bundle.db.put([], {
            unblinkingIp: {
                ipCheckHistory: {
                    [bundle.now]: {
                        ipAddress: bundle.newIp,
                        timeStamp: bundle.humanNow
                    }
                }
            }
        }, function(err){
            if (err) {
                console.log(`ERROR: ${err}`);
            }
        });
    }
    // Callback no matter if new IP or not.
    if (typeof bundle.callbacks.logIpCheck === 'function') {
        bundle.callbacks.logIpCheck(bundle);
    } else {
        console.log(`Callback is not a function.`);
    }
}
exports.logIpCheck = logIpCheck;

function trimIpLog(bundle) {
    //console.log(`unblinkingip.js trimIpLog`);
    // If we used the external-ip service, then we recorded that to the levelDB,
    // and we should trim that object's keys to keep the data store small.
    if (bundle.newIp) {
        bundle.objectPath = ['unblinkingIp','ipCheckHistory'];
        ubdb.trimObjKeys(bundle);
    }
    bundle.callbacks.trimIpLog(bundle);
}
exports.trimIpLog = trimIpLog;

function didIpChange(bundle) {
    //console.log(`unblinkingip.js didIpChange`);
    bundle.db.get(['unblinkingIp','ipCheckHistory',bundle.lastCheck.toString(),'ipAddress'], function(err, obj) {
        if (err) {
            console.log(`ERROR: ${err}`);
        } else {
            bundle.lastIp = obj;
            if (bundle.newIp && bundle.newIp !== bundle.lastIp) {
                bundle.ipChange = true;
            } else {
                bundle.ipChange = false;
            }
            bundle.callbacks.didIpChange(bundle);
        }
    });
}
exports.didIpChange = didIpChange;

function refreshResponse(bundle) {
    //console.log(`unblinkingip.js refreshResponse`);
    // Build a response report
    const N = '\n';
    bundle.responseReport = `Current time: ${bundle.humanNow}${
        N}Last verified: ${bundle.humanLastCheck}${
        N}Elapsed time: ${bundle.humanDuration}${
        N}Over 1 hour: ${bundle.enoughDuration}${
        N}Last IP: ${bundle.lastIp}${
        N}New IP: ${bundle.newIp}${
        N}IP Changed: ${bundle.ipChange}`;
    // Replace new lines with html breaks
    bundle.responseReport = bundle.responseReport.replace(/(?:\r\n|\r|\n)/g, '<br />');

    // If a socket exists, emit our ip refresh report
    if (bundle.socket) {
        bundle.socket.emit('ipRefreshRes', bundle.responseReport);
    }
    // If the IP address did change, and a default Slack channel is defined, send a slack message
    if (bundle.ipChange) {
        bundle.sending = {};
        bundle.sending.text = `I think the IP address changed.\nThe new address is http://${bundle.newIp}`;
        bundle.db.get(['unblinkingSlack','credentials','defaultNotifyId'], function(err, defaultNotifyId) {
            if (err) {
                console.log(`ERROR: ${err}`);
            } else {
                if (typeof defaultNotifyId === 'string' || defaultNotifyId instanceof String) {
                    bundle.sending.id = defaultNotifyId;
                    console.log(`unblinkingIp method sending message to ${defaultNotifyId}`);
                    ubslack.sendMessage(bundle);
                } else {
                    console.log(`Cannot send IP address change notification. Slack default notification destination is not set.`);
                }
            }
        });
    }
}
exports.refreshResponse = refreshResponse;

function refreshRequest(bundle) {
    //console.log(`unblinkingip.js refreshRequest`);
    bundle.now = new Date().getTime();
    bundle.humanNow = moment(bundle.now).format('YYYY-MM-DD hh:mm a');
    // Set the callbacks for this recipe
    bundle.callbacks = {
        refreshRequest:durationSinceLastCheck,
        durationSinceLastCheck:enoughDurationOrNot,
        enoughDurationOrNot:getExternalIp,
        getExternalIp:logIpCheck,
        logIpCheck:trimIpLog,
        trimIpLog:didIpChange,
        didIpChange:refreshResponse
    };
    //
    bundle.callbacks.refreshRequest(bundle);
}
exports.refreshRequest = refreshRequest;