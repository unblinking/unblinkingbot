#!/usr/bin/env node

'use strict'

/**
 * Inbound Slack message processing functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const motions = require(`./motions`)
const request = require(`request`)

/**
 * Inbox for new messages from the Slack RTM Client RTM_EVENTS.MESSAGE event.
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
 * Look for the command word(s) in a message text.
 * @param {Object} db The Level datastore object.
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
function findCommandWords (db, message, slack) {
  return new Promise(resolve => {
    let botId = slack.rtm.activeUserId
    let botName = slack.rtm.dataStore.getUserById(botId).name
    if (
      (/snapshot/gi.test(message.text) && /list/gi.test(message.text))
    ) {
      getSnapshotList(db, message, slack)
    } else if (
      (/snapshot/gi.test(message.text))
    ) {
      getSnapshot(db, message, slack)
    } else if (
      (/preview/gi.test(message.text))
    ) {
      getPreview(db, message, slack)
    } else if (
      (new RegExp(botId, `g`).test(message.text) && /thank/gi.test(message.text)) ||
      (new RegExp(botName, `gi`).test(message.text) && /thank/gi.test(message.text)) ||
      (new RegExp(`bot`, `gi`).test(message.text) && /thank/gi.test(message.text))
    ) {
      youreWelcome(message, slack)
    } else if (
      (new RegExp(botId, `g`).test(message.text)) ||
      (new RegExp(botName, `gi`).test(message.text)) ||
      (new RegExp(`bot`, `gi`).test(message.text))
    ) { // Mentioned bot's name, but no known request was made.
      thatsMyName(message, slack)
    }
    resolve()
  })
}

/**
 * Get the list of motionEye snapshots that are available.
 * @param {Object} db The Level datastore object.
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
async function getSnapshotList (db, message, slack) {
  try {
    let snapshots = await motions.getSnapshotUrls()
    if (Object.keys(snapshots).length === 0 && snapshots.constructor === Object) {
      // Empty object, no snapshots came back from the datastore
      let res = await slack.web.chat.postMessage(
        message.channel,
        `There are no snapshots available.`,
        { as_user: true, parse: `full` }
      )
      return res
    } else {
      let names = []
      names.push(`📃 Here are the snapshot names that you requested.\n`)
      Object.keys(snapshots).forEach(key => {
        let name = snapshots[key].name
        names.push(`► ${name}`)
      })
      let firstSnapshotName
      for (var i in snapshots) {
        firstSnapshotName = snapshots[i].name
        break
      }
      let res = await slack.web.chat.postMessage(
        message.channel,
        `${names.join(`\n`)}\n\n\`\`\`Examples requesting a snapshot\n\n> bot snapshot ${firstSnapshotName}\n> get the ${firstSnapshotName} snapshot please.\`\`\``,
        { as_user: true, parse: `full` }
      )
      return res
    }
  } catch (err) {
    console.log(err)
  }
}

/**
 * Get a snapshot jpg image from a motionEye system.
 * @param {Object} db The Level datastore object.
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
async function getSnapshot (db, message, slack) {
  try {
    let snapshots = await motions.getSnapshotUrls()
    let names = {}
    let matchingNames = {}
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
        `❓ Did you want a snapshot? If so, next time ask for one that exists. If you need a list of available snapshots, just ask.\n\n\`\`\`Examples requesting the snapshot list\n\n> bot snapshot list\n> get me the snapshot list, please.\n> @${slack.rtm.dataStore.getUserById(slack.rtm.activeUserId).name}, list the available snapshots.\n> ${slack.rtm.dataStore.getUserById(slack.rtm.activeUserId).name}, i know that i want a snapshot, but i forgot the name, please get me that list.\n> bot list snapshots\`\`\``,
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
        initial_comment: `🖼 Here's that picture of the ${matchingNames[key].name} that you wanted.`
      })
      return res
    })
  } catch (err) {
    console.log(err)
  }
}

/**
 * Get a preview screenshot from a motionEye system.
 * @param {Object} db The Level datastore object.
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
async function getPreview (db, message, slack) {
  try {
    let preview = await motions.getPreviewScreenshot()
    // https://github.com/slackapi/node-slack-sdk/issues/307#issuecomment-289231737
    let res = slack.web.files.upload(
                `preview_${new Date().getTime()}.png`,
                {
                  file: {
                    value: preview,
                    options: {
                      filename: `preview_${new Date().getTime()}.png`,
                      contentType: 'mime-type',
                      knownLength: preview.length
                    }
                  }
                }
              )
    return res
  } catch (e) {
    console.log(e.stack)
  }
}

/**
 * Be polite when thanked.
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
function youreWelcome (message, slack) {
  return new Promise(resolve => {
    let user = slack.rtm.dataStore.getUserById(message.user).name
    slack.web.chat.postMessage(
      message.channel,
      `It was my pleasure @${user}, I know you'd do the same for me. 😉`,
      { as_user: true, parse: `full` }
    )
    resolve()
  })
}

/**
 * Be playful when named.
 * @param {Object} message A message object from the Slack RTM_EVENTS.MESSAGE.
 * @param {Object} slack The Slack RTM and WEB interfaces.
 */
function thatsMyName (message, slack) {
  return new Promise(resolve => {
    let user = slack.rtm.dataStore.getUserById(message.user).name
    slack.web.chat.postMessage(
      message.channel,
      `That's my name @${user}, don't wear it out! 🤓`,
      { as_user: true, parse: `full` }
    )
    resolve()
  })
}

module.exports = {
  inbox: inbox
}
