#!/usr/bin/env node

'use strict'

/**
 * Socket.io websocket wrapper functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const datastores = require(`./datastores`)
const fs = require(`fs`)
const slacks = require(`./slacks`)
const socketio = require(`socket.io`)
const {promisify} = require(`util`)

const readFileAsync = promisify(fs.readFile)
const readDirAsync = promisify(fs.readdir)

function instance (server) {
  return new Promise(resolve => {
    let io = socketio(server)
    resolve(io)
  })
}

/**
 * Socket.io event listeners.
 */
function listen (db, io, slack) {
  io.on(`connection`, socket => {
    socket.on(`fullDbReq`, () => handleFullDbReq())
    socket.on(`motionConfFileReq`, () => handleMotionConfFileReq())
    socket.on(`motionEyeConfFileReq`, () => handleMotionEyeConfFileReq())
    socket.on(`motionThreadFileReq`, () => handleMotionThreadFileReq())
    socket.on(`readSlackChannelsReq`, () => handleReadSlackChannelsReq())
    socket.on(`readSlackGroupsReq`, () => handleReadSlackGroupsReq())
    socket.on(`readSlackUsersReq`, () => handleReadSlackUsersReq())
    socket.on(`saveSlackNotifyReq`, (notify, notifyType) => handleSaveSlackNotifyReq(notify, notifyType))
    socket.on(`saveSlackTokenReq`, token => handleSaveSlackTokenReq(token))
    socket.on(`slackConnectionStatusReq`, () => handleSlackConnectionStatusReq())
    socket.on(`slackNotifyReq`, () => handleSlackNotifyReq())
    socket.on(`slackRestartReq`, () => handleSlackRestartReq())
    socket.on(`slackStopReq`, () => handleSlackStopReq())
    socket.on(`slackTokenReq`, () => handleSlackTokenReq())

    // let handshake = JSON.stringify(socket.handshake, null, 2);
    // console.log(`Socket.io connection handshake: ${handshake}.`)

    // socket.on("disconnect", () => console.log("Socket.io disconnection."))

    /**
     * Get a JSON object of the full LevelDB datastore and emit it.
     */
    async function handleFullDbReq () {
      try {
        let data = await datastores.getAll(db)
        socket.emit(`fullDbRes`, data)
      } catch (err) {
        console.log(err.message)
      }
    }

    /**
     * Get an array of channel names where the bot user is a member, and then
     * emit the channel names.
     */
    async function handleReadSlackChannelsReq () {
      try {
        let channelNames = await getJoinedChannelNamesArray()
        socket.emit(`readSlackChannelsRes`, channelNames)
      } catch (err) {
        console.log(err.message)
      }
    }

    /**
     * Get an array of group names where the bot user is a member, and then
     * emit the group names.
     */
    async function handleReadSlackGroupsReq () {
      try {
        let groupNames = await getJoinedGroupNamesArray()
        socket.emit(`readSlackGroupsRes`, groupNames)
      } catch (err) {
        console.log(err.message)
      }
    }

    /**
     * Get an array of user names where the bot user is in a direct message
     * with the user, and then emit the user names.
     */
    async function handleReadSlackUsersReq () {
      try {
        let userNames = await getJoinedDmUserNamesArray()
        socket.emit(`readSlackUsersRes`, userNames)
      } catch (err) {
        console.log(err.message)
      }
    }

    /**
     * Save the Slack bot-user token to the LevelDB datastore, and then emit a
     * response that includes the token, a boolean success, and an error if
     * one exists.
     */
    async function handleSaveSlackTokenReq (token) {
      try {
        if (token !== undefined && token !== ``) {
          token = token.replace(/[\n\t\r]/g, ``)
          await datastores.putValueByKey(db, `slack::settings::token`, token)
          socket.emit(`saveSlackTokenRes`, token, true, null)
        } else {
          socket.emit(`saveSlackTokenRes`, token, false, `No token provided.`)
        }
      } catch (err) {
        socket.emit(`saveSlackTokenRes`, token, false, `Error: ${err.message}`)
        console.log(err)
      }
    }

    /**
     * Save the Slack default notification recipient to the LevelDB datastore,
     * and then emit a response that includes the notify, notifyType, a
     * boolean success, and an error if one exists.
     */
    async function handleSaveSlackNotifyReq (notify, notifyType) {
      try {
        if (notify !== undefined && notifyType !== undefined &&
          notify !== null && notifyType !== null &&
          slack.rtm !== undefined && slack.rtm.connected === true
        ) {
          await datastores.putValueByKey(db, `slack::settings::notify`, notify)
          await datastores.putValueByKey(db, `slack::settings::notifyType`, notifyType)
          let id
          if (notifyType === `channel`) id = await getChannelIdByName(notify)
          else if (notifyType === `group`) id = await getGroupIdByName(notify)
          else if (notifyType === `user`) id = await getDmIdByUserName(notify)
          await datastores.putValueByKey(db, `slack::settings::notifyId`, id)
          socket.emit(`saveSlackNotifyRes`, notify, notifyType, true, null)
        } else {
          socket.emit(`saveSlackNotifyRes`, notify, notifyType, false, `Slack RTM Client is not connected, or no default notify was selected.`)
        }
      } catch (err) {
        socket.emit(`saveSlackNotifyRes`, notify, notifyType, false, `Error: ${err.message}`)
        console.log(err)
      }
    }

    /**
     * Emit a boolean connected status of the Slack real time messaging API.
     */
    async function handleSlackConnectionStatusReq () {
      try {
        let status = (slack.rtm !== undefined && slack.rtm.connected === true)
        socket.emit(`slackConnectionStatusRes`, status)
      } catch (err) {
        console.log(err.message)
      }
    }

    /**
     * Restart the Slack real time messaging API connection.
     */
    async function handleSlackRestartReq () {
      try {
        let token = await datastores.getSlackToken(db)
        let result = await slacks.restart(slack, token)
        if (result.done === true) {
          slacks.listen(db, io, slack)
        }
        if (result.done === false) {
          io.emit(`slackRestartFailed`, `${result.message}`)
        }
      } catch (err) {
        console.log(err.message)
      }
    }

    /**
     * Stop the Slack real time messaging API connection.
     */
    async function handleSlackStopReq () {
      try {
        let result = await slacks.disconnect(slack)
        if (result.done === false) {
          io.emit(`slackDisconnection`, result.message)
        }
      } catch (err) {
        console.log(err.message)
      }
    }

    /**
     * Get the default notify (name) and notifyType from the LevelDB datastore
     * and then emit them.
     */
    async function handleSlackNotifyReq () {
      try {
        let data = {}
        data.notify = await datastores.getSlackNotify(db)
        data.notifyType = await datastores.getSlackNotifyType(db)
        socket.emit(`slackNotifyRes`, data)
      } catch (err) {
        console.log(err.message)
      }
    }

    /**
     * Get the Slack bot-user token from the LevelDB datastore and emit it.
     */
    async function handleSlackTokenReq () {
      try {
        let token = await datastores.getSlackToken(db)
        socket.emit(`slackTokenRes`, token)
      } catch (err) {
        console.log(err.message)
      }
    }

    /**
     * Get the motionEye file motion.conf
     */
    async function handleMotionConfFileReq () {
      try {
        const file = `/usr/local/unblinkingbot/motion/settings/motion.conf`
        const contents = await readFileAsync(file, { encoding: `utf8` })
        // console.log(contents)
        socket.emit(`motionConfFileRes`, true)
      } catch (err) {
        console.log(`ERROR:\nNAME: ${err.name}\nMESSAGE: ${err.message}`)
        socket.emit(`motionConfFileRes`, false)
      }
    }

    /**
     * Get the motionEye file motioneye.conf
     */
    async function handleMotionEyeConfFileReq () {
      try {
        const file = `/usr/local/unblinkingbot/motion/settings/motioneye.conf`
        const contents = await readFileAsync(file, { encoding: `utf8` })
        // console.log(contents)
        socket.emit(`motionEyeConfFileRes`, true)
      } catch (err) {
        console.log(`ERROR:\nNAME: ${err.name}\nMESSAGE: ${err.message}`)
        socket.emit(`motionEyeConfFileRes`, false)
      }
    }

    /**
     * Get the motionEye thread files (one per camera)
     */
    async function handleMotionThreadFileReq () {
      try {
        let count = 0
        const threadFiles = await readDirAsync(`/usr/local/unblinkingbot/motion/settings/`)
        threadFiles.forEach(file => {
          if (file.startsWith(`thread-`)) count += 1
        })
        // console.log(count)
        socket.emit(`motionThreadFileRes`, count)
      } catch (err) {
        console.log(`ERROR:\nNAME: ${err.name}\nMESSAGE: ${err.message}`)
        socket.emit(`motionThreadFileRes`, 0)
      }
    }

    /**
     * Return an array of the Slack channel names where the bot-user is a
     * member.
     */
    function getJoinedChannelNamesArray () {
      let channelNames = []
      if (slack.rtm !== undefined && slack.rtm.connected === true) {
        let ds = slack.rtm.dataStore
        Object.keys(ds.channels).forEach(key => {
            if (ds.channels[key].is_member) { // Only if the bot is a member.
              channelNames.push(ds.channels[key].name)
            }
          })
      }
      return channelNames
    }

    /**
     * Return the Slack group (private channel) names.
     */
    function getJoinedGroupNamesArray () {
      let groupNames = []
      if (slack.rtm !== undefined && slack.rtm.connected === true) {
        let ds = slack.rtm.dataStore
        Object.keys(ds.groups).forEach(key =>
          groupNames.push(ds.groups[key].name))
      }
      return groupNames
    }

    /**
     * Return the user names for all Slack direct messages that the bot is in.
     */
    function getJoinedDmUserNamesArray () {
      let directMessageUserIds = []
      let directMessageUserNames = []
      if (slack.rtm !== undefined && slack.rtm.connected === true) {
        let ds = slack.rtm.dataStore
        Object.keys(ds.dms).forEach(key =>
          directMessageUserIds.push(ds.dms[key].user))
        directMessageUserIds.forEach(id =>
          directMessageUserNames.push(ds.users[id].name))
      }
      return directMessageUserNames
    }

    /**
     * Return a Slack channel ID for a given channel name.
     */
    function getChannelIdByName (name) {
      let id
      let ds = slack.rtm.dataStore
      Object.keys(ds.channels).forEach(key => {
        if (ds.channels[key].name === name) { id = key.toString() }
      })
      return id
    }

    /**
     * Return a Slack group ID for a given group name.
     */
    function getGroupIdByName (name) {
      let id
      let ds = slack.rtm.dataStore
      Object.keys(ds.groups).forEach(key => {
        if (ds.groups[key].name === name) { id = key.toString() }
      })
      return id
    }

    /**
     * Return a Slack user ID for a given user name.
     */
    function getDmIdByUserName (name) {
      let id
      let ds = slack.rtm.dataStore
      Object.keys(ds.users).forEach(usersKey => {
        if (ds.users[usersKey].name === name) {
          Object.keys(ds.dms).forEach(dmsKey => {
            if (ds.dms[dmsKey].user ===
              ds.users[usersKey].id) { id = dmsKey.toString() }
          })
        }
      })
      return id
    }

  })
}

module.exports = {
  instance: instance,
  listen: listen
}
