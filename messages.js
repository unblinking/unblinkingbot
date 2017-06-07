#!/usr/bin/env node

/**
 * The child process wrapper functions for the unblinkingBot.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @copyright 2015-2017 {@link https://github.com/nothingworksright nothingworksright}
 * @license MIT License
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

/**
 * Require the 3rd party modules that will be used.
 * @see {@link https://github.com/petkaantonov/bluebird bluebird}
 * @see {@link https://github.com/request/request request}
 */
const P = require("bluebird");
const request = require("request");

/**
 * Require the local modules/functions that will be used.
 */
const getValuesByKeyPrefix = require("./datastore.js").getValuesByKeyPrefix;

/**
 * Handle a new message from the Slack RTM Client RTM_EVENTS.MESSAGE event. If
 * the message includes text, and it was not posted from the bot's own user ID,
 * then see if the text includes any magic words.
 */
function inbox(bundle, message) {
  return new P(resolve => {
    let botUser = bundle.rtm.activeUserId;
    if (
      message.text !== undefined &&
      message.user !== botUser
    )
      findMagicWords(bundle, message);
    resolve();
  });
}
exports.inbox = inbox;

/**
 * Look for the magic word(s) in a message text, using the bot's ID or name as
 * the magic words.
 */
function findMagicWords(bundle, message) {
  return new P(resolve => {
    let botId = bundle.rtm.activeUserId;
    let botName = bundle.rtm.dataStore.getUserById(botId).name;
    if (
      new RegExp(botId, "g").test(message.text) ||
      new RegExp(botName, "gi").test(message.text)
    )
      findCommandWords(bundle, message);
    resolve();
  });
}

/**
 *
 */
function findCommandWords(bundle, message) {
  return new P(resolve => {
    if (/snapshot list/gi.test(message.text))
      getSnapshotList(bundle, message);
    else if (/snapshot/gi.test(message.text))
      getSnapshot(bundle, message);
    else
      thatsMyName(bundle, message);
    resolve();
  });
}

/**
 *
 */
function getSnapshotList(bundle, message) {
  return new P(resolve => {
    getValuesByKeyPrefix(bundle, "motion::snapshot::")
      .then(snapshots => {
        let names = [];
        names.push("Here are the snapshot names that you requested:")
        Object.keys(snapshots).forEach(key => {
          let name = snapshots[key].name;
          names.push("• " + name);
        });
        return names;
      })
      .then(names => {
        return bundle.web.chat.postMessage(
          message.channel,
          names.join("\n"), {
            "as_user": true,
            "parse": "full"
          }
        )
      })
      .then(res => {
        console.log(`Got a response after giving the snapshot names list.`);
      });
    resolve();
  });
}

function getSnapshot(bundle, message) {
  return new P(resolve => {
    getValuesByKeyPrefix(bundle, "motion::snapshot::")
      .then(snapshots => {
        let names = {};
        Object.keys(snapshots).forEach(key => {
          names[key] = snapshots[key];
        });
        return names;
      })
      .then(names => {
        let matchingNames = {};
        Object.keys(names).forEach(key => {
          if (new RegExp(names[key].name, "gi").test(message.text)) {
            matchingNames[key] = names[key];
          }
        });
        return matchingNames;
      })
      .then(matchingNames => {
        if (Object.keys(matchingNames).length === 0) { // No names were found :(
          bundle.web.chat.postMessage(
            message.channel,
            "Did you want a snapshot? If so, next time ask for one that exists. (hint: ask for the snapshot list)", {
              "as_user": true,
              "parse": "full"
            }
          );
        } else { // Some names were found!
          Object.keys(matchingNames).forEach(key => {
            bundle.web.files.upload(`snapshot_${matchingNames[key].name}_${new Date().getTime()}.jpg`, {
                "file": request(matchingNames[key].url),
                "filename": `snapshot_${matchingNames[key].name}_${new Date().getTime()}.jpg`,
                "title": `Snapshot of ${matchingNames[key].name}`,
                "channels": message.channel,
                "initial_comment": `Here's that picture of the ${matchingNames[key].name} that you wanted.`,
              })
              .then(res => {
                console.log(`Got a res from the file upload to Slack`);
              })
              .catch(err => console.log(err.message));
          });
        }
      })
      .catch(err => console.log(err.message));
    resolve();
  });
}

function thatsMyName(bundle, message) {
  return new P(resolve => {
    let user = bundle.rtm.dataStore.getUserById(message.user).name;
    bundle.web.chat.postMessage(
      message.channel,
      `That's my name @${user}, don't wear it out!`, {
        "as_user": true,
        "parse": "full"
      }
    );
    resolve();
  });
}
