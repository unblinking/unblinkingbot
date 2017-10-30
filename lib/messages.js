#!/usr/bin/env node

'use strict'

/**
 * Message processing functions for the unblinkingBot (Slack messages).
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const request = require(`request`)
const datastores = require(`./datastores`)

/**
 * Inbox for new messages from the Slack RTM Client RTM_EVENTS.MESSAGE event.
 * Verify that the message includes text and was not posted from the bot's
 * own user ID, then see if the text includes any magic words.
 * @param {Object} db The Level datastore object.
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
function inbox (db, message, slack) {
  return new Promise(resolve => {
    let botUser = slack.rtm.activeUserId
    if (
      message.text !== undefined && // The message does have some text.
      message.user !== botUser // The message is not from this bot user.
    ) {
      findMagicWords(db, message, slack)
    }
    resolve()
  })
}

/**
 * Look for the magic word(s) in a message text, using the bot's ID, name, the
 * word 'bot', or the word 'get' as the magic words.
 * @param {Object} db The Level datastore object.
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
function findMagicWords (db, message, slack) {
  return new Promise(resolve => {
    let botId = slack.rtm.activeUserId
    let botName = slack.rtm.dataStore.getUserById(botId).name
    if (
      new RegExp(botId, `g`).test(message.text) ||
      new RegExp(botName, `gi`).test(message.text) ||
      new RegExp(`bot`, `gi`).test(message.text) ||
      new RegExp(`get`, `gi`).test(message.text)
    ) {
      findCommandWords(db, message, slack)
    }
    resolve()
  })
}

/**
 * Look for the command word(s) in a message text, and process those commands.
 * @param {Object} db The Level datastore object.
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
function findCommandWords (db, message, slack) {
  return new Promise(resolve => {
    let botId = slack.rtm.activeUserId
    let botName = slack.rtm.dataStore.getUserById(botId).name
    if (
      /snapshot list/gi.test(message.text) ||
      /camera list/gi.test(message.text)
    ) {
      getSnapshotList(db, message, slack)
    } else if (
      /snapshot/gi.test(message.text)
    ) {
      getSnapshot(db, message, slack)
    } else if (
      new RegExp(botId, `g`).test(message.text) ||
      new RegExp(botName, `gi`).test(message.text) ||
      new RegExp(`bot`, `gi`).test(message.text)
    ) { // Mentioned bot's name, but no known request was made.
      thatsMyName(message, slack)
    }
    resolve()
  })
}

/**
 * Get the list of motionEye camera snapshots that are available.
 * @param {Object} db The Level datastore object.
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
async function getSnapshotList (db, message, slack) {
  try {
    let snapshots = await datastores.getValuesByKeyPrefix(db, `motion::snapshot::`)
    if (snapshots === {}) {
      let res = await slack.web.chat.postMessage(
        message.channel,
        `There are no snapshots configured.`,
        { as_user: true, parse: `full` }
      )
      return res
    } else {
      let names = []
      names.push(`Here are the snapshot names that you requested:`)
      Object.keys(snapshots).forEach(key => {
        let name = snapshots[key].name
        names.push(`• ` + name)
      })
      let res = await slack.web.chat.postMessage(
        message.channel,
        names.join(`\n`), { as_user: true, parse: `full` }
      )
      return res
    }
  } catch (err) {
    console.log(err)
  }
}

/**
 * Get a snapshot jpg image from a motionEye camera.
 * @param {Object} db The Level datastore object.
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
async function getSnapshot (db, message, slack) {
  try {
    let snapshots = await datastores.getValuesByKeyPrefix(db, `motion::snapshot::`)
    let names
    let matchingNames
    Object.keys(snapshots).forEach(key => {
      names[key] = snapshots[key]
    })
    Object.keys(names).forEach(key => {
      if (new RegExp(names[key].name, `gi`).test(message.text)) {
        matchingNames[key] = names[key]
      }
    })
    if (Object.keys(matchingNames).length === 0) { // No names were found :(
      let res = slack.web.chat.postMessage(
        message.channel,
        `Did you want a snapshot? If so, next time ask for one that exists. (hint: ask for the snapshot list)`,
        { as_user: true, parse: `full` }
      )
      return res
    }
    Object.keys(matchingNames).forEach(key => {
      let res = slack.web.files.upload(`snapshot_${matchingNames[key].name}_${new Date().getTime()}.jpg`, {
        file: request(matchingNames[key].url),
        filename: `snapshot_${matchingNames[key].name}_${new Date().getTime()}.jpg`,
        title: `Snapshot of ${matchingNames[key].name}`,
        channels: message.channel,
        initial_comment: `Here's that picture of the ${matchingNames[key].name} that you wanted.`
      })
      return res
    })
  } catch (err) {
    console.log(err)
  }
}

function getSnapshot (db, message, slack) {
  return new Promise(resolve => {
    datastores.getValuesByKeyPrefix(db, `motion::snapshot::`)
      .then(snapshots => {
        let names = {}
        Object.keys(snapshots).forEach(key => {
          names[key] = snapshots[key]
        })
        return names
      })
      .then(names => {
        let matchingNames = {}
        Object.keys(names).forEach(key => {
          if (new RegExp(names[key].name, `gi`).test(message.text)) {
            matchingNames[key] = names[key]
          }
        })
        return matchingNames
      })
      .then(matchingNames => {
        if (Object.keys(matchingNames).length === 0) { // No names were found :(
          slack.web.chat.postMessage(
            message.channel,
            `Did you want a snapshot? If so, next time ask for one that exists. (hint: ask for the snapshot list)`, {
              as_user: true,
              parse: `full`
            }
          )
        } else { // Some names were found!
          Object.keys(matchingNames).forEach(key => {
            slack.web.files.upload(`snapshot_${matchingNames[key].name}_${new Date().getTime()}.jpg`, {
              file: request(matchingNames[key].url),
              filename: `snapshot_${matchingNames[key].name}_${new Date().getTime()}.jpg`,
              title: `Snapshot of ${matchingNames[key].name}`,
              channels: message.channel,
              initial_comment: `Here's that picture of the ${matchingNames[key].name} that you wanted.`
            })
              .then(res => {
                // console.log(`Got a res from the file upload to Slack`);
              })
              .catch(err => console.log(err.message))
          })
        }
      })
      .catch(err => console.log(err.message))
    resolve()
  })
}


/**
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
function thatsMyName (message, slack) {
  return new Promise(resolve => {
    let user = slack.rtm.dataStore.getUserById(message.user).name
    slack.web.chat.postMessage(
      message.channel,
      `That's my name @${user}, don't wear it out!`, {
        as_user: true,
        parse: `full`
      }
    )
    resolve()
  })
}

module.exports = {
  inbox: inbox
}