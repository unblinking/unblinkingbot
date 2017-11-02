#!/usr/bin/env node

'use strict'

/**
 * Websocket functions for the unblinkingBot.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const moment = require(`moment`)
const socketio = require(`socket.io`)
const datastores = require(`./datastores`)
const slacks = require(`./slacks`)

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
      // let handshake = JSON.stringify(socket.handshake, null, 2);
      // console.log(`Socket.io connection handshake: ${handshake}.`)
      // console.log(`Socket.io connection.`)

      /**
       * Register the "disconnect" event handler.
       */
      // socket.on("disconnect", () => console.log("Socket.io disconnection."))

      /**
       * Register the "fullDbReq" event handler.
       * Read the entire LevelDB Datastore and emit it back out.
       */
      socket.on(`fullDbReq`, () =>
        datastores.getAll(db)
          .then(allData => socket.emit(`fullDbRes`, allData))
          .catch(err => socket.emit(`fullDbRes`, err.message))) // TODO: Do a pretty error here

      /**
       * Register the "channelsReq" event handler.
       * If the Slack RTM Client is currently connected, get an array of all of
       * the channel names where the bot user is a member of the channel, and
       * then emit the channel names back out.
       */
      socket.on(`channelsReq`, () =>
        getJoinedChannelNamesArray()
          .then(channelNames => socket.emit(`channelsRes`, channelNames)))

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

      /**
       * Register the "saveSlackTokenReq" event handler.
       * Try to save the token to the LevelDB Datastore, and then emit a
       * response that includes the token, a boolean success, and an error if
       * one exists. The error is formatted using pretty-error and ansi-to-html.
       */
      socket.on(`saveSlackTokenReq`, token => handleSaveSlackTokenReq(token))

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
          socket.emit(`saveSlackTokenRes`, token, false, `Like, error even.`)
          console.log(err)
        }
      }

      socket.on(`saveMotionUrlReq`, object => {
        // console.log("heard req to save motion URL");
        db.put(`motion::snapshot::` + object.name, object)
          .then(() => socket.emit(`saveMotionUrlRes`, object, true, null))
          .catch(err => socket.emit(`saveMotionUrlRes`, object, false,
            convert.toHtml(pretty.render(err))))
      })

      /**
       * Register the "saveSlackNotifyReq" event handler.
       */
      socket.on(`saveSlackNotifyReq`, (notify, notifyType) =>
        db.put(`slack::settings::notify`, notify)
          .then(() => db.put(`slack::settings::notifyType`, notifyType))
          .then(() => {
            if (slack.rtm !== undefined && slack.rtm.connected === true) {
              if (notifyType === `channel`) return getChannelIdByName(notify)
              else if (notifyType === `group`) return getGroupIdByName(notify)
              else if (notifyType === `user`) return getDmIdByUserName(notify)
            }
          })
          .then(id => db.put(`slack::settings::notifyId`, id))
          .then(() => socket.emit(`saveSlackNotifyRes`, notify, notifyType, true, null))
          .catch(err => socket.emit(`saveSlackNotifyRes`, notify, notifyType, false,
            convert.toHtml(pretty.render(err)))))

      /**
       * Register the "slackConnectionStatusReq" event handler.
       */
      socket.on(`slackConnectionStatusReq`, () =>
        socket.emit(`slackConnectionStatusRes`,
          slack.rtm !== undefined && slack.rtm.connected === true)
      )

      /**
       * Register the "slackRestartReq" event handler.
       * Connect the Slack Real-Time-Messaging Client.
       */
      socket.on(`slackRestartReq`, () => slacks.connect(db, io, slack))

      /**
       * Register the "slackStopReq" event handler.
       * Disconnect the Slack RTM Client.
       */
      socket.on(`slackStopReq`, () => slacks.disconnect(io, slack))

      /**
       * Register the "slackNotifyReq" event handler.
       * Get the default notification recipient name and type from the LevelDB
       * Datastore, and then emit them back out as a response.
       */
      socket.on(`slackNotifyReq`, () => {
        let data = {}
        datastores.getValueByKey(db, `slack::settings::notify`)
          .then(notify => data.notify = notify)
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

      /**
       * Register the "motionSnapshotReq" event handler.
       * Get the motionEye snapshot URLs from the LevelDB Datastore, and then
       * emit them back out as a response.
       */
      socket.on(`motionSnapshotsReq`, async () => {
        try {
          let snapshots = await datastores.getValuesByKeyPrefix(db, `motion::snapshot::`)
          Object.keys(snapshots).forEach(key => {
            socket.emit(
                `motionSnapshotsRes`,
                `<a href="${snapshots[key].url}">${snapshots[key].name}</a>`
            )
          })
        } catch (err) {
          console.log(err)
        }
      })

      /**
       * Register the "restartReq" event handler.
       * Exit the current process. The process is running as a systemd based
       * service, and will restart itself.
       */
      socket.on(`restartReq`, () => process.exit(1)) // TODO: Restart the systemd service differently?

      /**
       * TODO: Clean up this long mess
       */
      socket.on(`dashRecentActivityReq`, async () => {
        try {
          const notify = await datastores.getValueByKey(db, `slack::settings::notify`)
          const notifyId = await datastores.getValueByKey(db, `slack::settings::notifyId`)
          const notifyType = await datastores.getValueByKey(db, `slack::settings::notifyType`)
          let history
          if (notifyType === `channel`) {
            history = slack.web.channels.history(notifyId, {
              count: 5
            })
          } else if (notifyType === `group`) {
            history = slack.web.groups.history(notifyId, {
              count: 5
            })
          } else if (notifyType === `user`) {
            history = slack.web.im.history(notifyId, {
              count: 5
            })
          }
          if (history !== undefined && history.messages !== undefined) {
            history.messages.sort((a, b) => {
              return a.ts - b.ts // Sort by timestamp
            })
            history.messages.forEach(activity => {
              if (
                activity.type === `message` &&
                slack.rtm !== undefined &&
                slack.rtm.connected === true
              ) {
                let name = `unknown`
                Object.keys(slack.rtm.dataStore.users).forEach(usersKey => {
                  if (slack.rtm.dataStore.users[usersKey].id === activity.user) { name = slack.rtm.dataStore.users[usersKey].name }
                })
                let time = moment(activity.ts.split(`.`)[0] * 1000).format(`HH:mma`)
                let text = activity.text.replace(/[\<\>]/g, ``)
                let dashActivity = `Message [${name} ${time}] ${text}`
                io.emit(`slacktivity`, dashActivity)
              } else {
                io.emit(`slacktivity`, `Bot is disconnected.`)
              }
            })
          } else {
            io.emit(`slacktivity`, `No default channel or no activity.`)
          }
        } catch (err) {
          console.log(err)
        }
      })

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
