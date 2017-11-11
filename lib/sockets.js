#!/usr/bin/env node

'use strict'

/**
 * Websocket functions for the unblinkingBot.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
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
  return new Promise(resolve => {
    io.on(`connection`, socket => {
      socket.on(`fullDbReq`, () => handleFullDbReq())

      // let handshake = JSON.stringify(socket.handshake, null, 2);
      // console.log(`Socket.io connection handshake: ${handshake}.`)

      // socket.on("disconnect", () => console.log("Socket.io disconnection."))

      /**
       * Read the full LevelDB datastore and emit it.
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
       * Register the "channelsReq" event handler.
       * If the Slack RTM Client is currently connected, get an array of all of
       * the channel names where the bot user is a member of the channel, and
       * then emit the channel names back out.
       */
      socket.on(`readSlackChannelsReq`, () =>
        getJoinedChannelNamesArray()
          .then(channelNames => socket.emit(`readSlackChannelsRes`, channelNames)))

      /**
       * Register the "readSlackGroupsReq" event handler.
       * If the Slack RTM Client is currently connected, get an array of all of
       * the group names where the bot user is a member of the group, and then
       * emit the group names back out.
       */
      socket.on(`readSlackGroupsReq`, () =>
        getJoinedGroupNamesArray()
          .then(groupNames => socket.emit(`readSlackGroupsRes`, groupNames)))

      /**
       * Register the "readSlackUsersReq" event handler.
       * If the Slack RTM Client is currently connected, get an array of all of
       * the user names where the bot user is in a direct message with the user,
       * and then emit the user names back out.
       */
      socket.on(`readSlackUsersReq`, () =>
        getJoinedDmUserNamesArray()
          .then(userNames => socket.emit(`readSlackUsersRes`, userNames)))

      socket.on(`saveSlackTokenReq`, token => handleSaveSlackTokenReq(token))

      /**
       * Try to save the token to the LevelDB Datastore, and then emit a
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
          socket.emit(`saveSlackTokenRes`, token, false, `Error: ${err.name}`)
          console.log(err)
        }
      }

      /**
       * TODO: Add a "no notify/notifyType provided" catch, like in saveSlackTokenReq
       */
      socket.on(`saveSlackNotifyReq`, (notify, notifyType) => handleSaveSlackNotifyReq(notify, notifyType))

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
          socket.emit(`saveSlackNotifyRes`, notify, notifyType, false, `Error: ${err.name}`)
          console.log(err)
        }
      }

      /*
      // TODO: Add a "no name/url provided" catch, like in saveSlackTokenReq
      socket.on(`saveMotionUrlReq`, object => {
        // console.log("heard req to save motion URL");
        db.put(`motion::snapshot::` + object.name, object)
          .then(() => socket.emit(`saveMotionUrlRes`, object, true, null))
          .catch(err =>
            socket.emit(`saveMotionUrlRes`, object, false,
              `Error: ${err.name}`
            )
          )
      })
      */

      socket.on(`slackConnectionStatusReq`, () =>
        socket.emit(`slackConnectionStatusRes`,
          slack.rtm !== undefined && slack.rtm.connected === true)
      )

      socket.on(`slackRestartReq`, () => handleSlackRestartReq())

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

      socket.on(`slackStopReq`, () => handleSlackStopReq())

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
       * Register the "slackNotifyReq" event handler.
       * Get the default notification recipient name and type from the LevelDB
       * Datastore, and then emit them back out as a response.
       */
      socket.on(`slackNotifyReq`, () => {
        let data = {}
        datastores.getValueByKey(db, `slack::settings::notify`)
          .then(notify => {
            data.notify = notify
          })
          .then(() => {
            return datastores.getValueByKey(db, `slack::settings::notifyType`)
          })
          .then(notifyType => {
            data.notifyType = notifyType
          })
          .then(() => socket.emit(`slackNotifyRes`, data))
          .catch(err => console.log(err.message))
      })

      /**
       * Register the "slackTokenReq" event handler.
       * Get the bot user token from the LevelDB Datastore, and then emit it
       * back out as a response.
       */
      socket.on(`slackTokenReq`, () =>
        datastores.getValueByKey(db, `slack::settings::token`)
          .then(token => socket.emit(`slackTokenRes`, token))
          .catch(err => console.log(err.message)))

      socket.on(`motionConfFileReq`, () => handleMotionConfFileReq())
      socket.on(`motionEyeConfFileReq`, () => handleMotionEyeConfFileReq())
      socket.on(`motionThreadFileReq`, () => handleMotionThreadFileReq())

      async function handleMotionConfFileReq () {
        try {
          const file = `/usr/local/unblinkingbot/motion/settings/motion.conf`
          const contents = await readFileAsync(file, { encoding: `utf8` })
          console.log(contents)
          socket.emit(`motionConfFileRes`, true)
        } catch (err) {
          console.log(`ERROR:\nNAME: ${err.name}\nMESSAGE: ${err.message}`)
          socket.emit(`motionConfFileRes`, false)
        }
      }

      async function handleMotionEyeConfFileReq () {
        try {
          const file = `/usr/local/unblinkingbot/motion/settings/motioneye.conf`
          const contents = await readFileAsync(file, { encoding: `utf8` })
          console.log(contents)
          socket.emit(`motionEyeConfFileRes`, true)
        } catch (err) {
          console.log(`ERROR:\nNAME: ${err.name}\nMESSAGE: ${err.message}`)
          socket.emit(`motionEyeConfFileRes`, false)
        }
      }

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
       *
       */
      function getJoinedChannelNamesArray () {
        return new Promise(resolve => {
          let channelNames = []
          if (slack.rtm !== undefined && slack.rtm.connected === true) {
            Object.keys(slack.rtm.dataStore.channels).forEach(key => {
              if (slack.rtm.dataStore.channels[key].is_member) { // Only if the bot is a member.
                channelNames.push(slack.rtm.dataStore.channels[key].name)
              }
            })
          }
          resolve(channelNames)
        })
      }

      /**
       *
       */
      function getJoinedGroupNamesArray () {
        return new Promise(resolve => {
          let groupNames = []
          if (slack.rtm !== undefined && slack.rtm.connected === true) {
            Object.keys(slack.rtm.dataStore.groups).forEach(key =>
              groupNames.push(slack.rtm.dataStore.groups[key].name))
          }
          resolve(groupNames)
        })
      }

      /**
       *
       */
      function getJoinedDmUserNamesArray () {
        return new Promise(resolve => {
          let directMessageUserIds = []
          let directMessageUserNames = []
          if (slack.rtm !== undefined && slack.rtm.connected === true) {
            Object.keys(slack.rtm.dataStore.dms).forEach(key =>
              directMessageUserIds.push(slack.rtm.dataStore.dms[key].user))
            directMessageUserIds.forEach(id =>
              directMessageUserNames.push(slack.rtm.dataStore.users[id].name))
          }
          resolve(directMessageUserNames)
        })
      }

      /**
       *
       * @param {*} name
       */
      function getChannelIdByName (name) {
        return new Promise(resolve => {
          let id
          Object.keys(slack.rtm.dataStore.channels).forEach(key => {
            if (slack.rtm.dataStore.channels[key].name === name) { id = key.toString() }
          })
          resolve(id)
        })
      }

      /**
       *
       * @param {*} name
       */
      function getGroupIdByName (name) {
        return new Promise(resolve => {
          let id
          Object.keys(slack.rtm.dataStore.groups).forEach(key => {
            if (slack.rtm.dataStore.groups[key].name === name) { id = key.toString() }
          })
          resolve(id)
        })
      }

      /**
       *
       * @param {*} name
       */
      function getDmIdByUserName (name) {
        return new Promise(resolve => {
          let id
          Object.keys(slack.rtm.dataStore.users).forEach(usersKey => {
            if (slack.rtm.dataStore.users[usersKey].name === name) {
              Object.keys(slack.rtm.dataStore.dms).forEach(dmsKey => {
                if (slack.rtm.dataStore.dms[dmsKey].user ===
                  slack.rtm.dataStore.users[usersKey].id) { id = dmsKey.toString() }
              })
            }
          })
          resolve(id)
        })
      }
    })
    resolve()
  })
}

module.exports = {
  instance: instance,
  listen: listen
}
