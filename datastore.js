#!/usr/bin/env node

'use strict'

/**
 * Datastore functions for the unblinkingBot.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

/**
 * 3rd party modules that will be used.
 * @see {@link https://github.com/Level/level level}
 * @see {@link https://github.com/then/then-levelup then-levelup}
 */
const level = require('levelup')
const thenLevel = require('then-levelup')

/**
 * Create (or open) the datastore.
 * Uses the main bundle object, which holds a copy of a reference to the
 * datastore as bundle.db, to create (or open) the LevelDB store.
 */
function create (bundle) {
  return new Promise(resolve => {
    bundle.db = thenLevel(level('db', {
      valueEncoding: 'json'
    }))
    resolve()
  })
}
exports.create = create

/**
 * Get all key-value pairs.
 * @function getAllData
 * @param {Object} db Reference to the LevelDB data store
 *
 */
function getAll (db) {
  return new Promise((resolve, reject) => {
    let foundData = {}
    db.createReadStream()
      // @see {@link https://github.com/eslint/eslint/issues/5150 `no-return-assign` behavior changed with arrow functions}
      // eslint-disable-next-line
      .on("data", data => foundData[data.key] = data.value)
      .on('error', err => reject(err))
      // .on("close", () => console.log("closing"))
      .on('end', () => resolve(foundData))
  })
}
exports.getAll = getAll

/**
 * Get all keys with a given prefix.
 * @function getKeysByPrefix
 * @param {Object} bundle References to the LevelDB data store, Slack RTM Client, and Socket.io server.
 * @param {Function} callback A callback function
 */
function getValuesByKeyPrefix (bundle, prefix) {
  return new Promise((resolve, reject) => {
    let values = {}
    bundle.db.createReadStream()
      .on('data', data => {
        if (data.key.startsWith(prefix)) {
          values[data.key] = data.value
        }
      })
      .on('error', (err) => reject(err))
      /* .on("close", () => console.log("closing")) */
      .on('end', () => resolve(values))
  })
}
exports.getValuesByKeyPrefix = getValuesByKeyPrefix

/**
 * @param {Object} bundle References to the LevelDB data store, Slack RTM Client, and Socket.io server.
 * @param {Function} callback A callback function
 */
function trimByKeyPrefix () {
  return new Promise((resolve, reject) => {
    let matchingKeys = []
    bundle.db.createReadStream({
      keys: true,
      values: false
    })
      .on('data', key => {
        if (key.startsWith(prefix)) matchingKeys.push(key)
      })
      .on('error', (err) => reject(err))
      // .on("close", () => console.log("closing"))
      .on('end', () => {
        matchingKeys.sort().reverse()
        Object.keys(matchingKeys).forEach(key => {
          if (key > 4) bundle.db.del(matchingKeys[key])
        })
        resolve(bundle)
      })
  })
}
exports.trimByKeyPrefix = trimByKeyPrefix
