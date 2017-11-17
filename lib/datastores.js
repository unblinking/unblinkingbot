#!/usr/bin/env node

'use strict'

/**
 * LevelDB datastore wrapper functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const level = require(`level`)

/**
 * Instantiate the datastore.
 */
function instance () {
  return new Promise(resolve => {
    let db = level(`db`, { valueEncoding: `json` })
    resolve(db)
  })
}

/**
 * Get all key/value pairs from the datastore.
 * @param {Object} db Reference to the LevelDB data store
 * @see {@link https://github.com/eslint/eslint/issues/5150 no-return-assign behavior changed with arrow functions}
 */
function getAll (db) {
  return new Promise((resolve, reject) => {
    let foundData = {}
    db.createReadStream()
      // eslint-disable-next-line
      .on(`data`, data => foundData[data.key] = data.value)
      .on(`error`, err => reject(err))
      .on(`end`, () => resolve(foundData))
  })
}

/**
 * Get all values from key/value pairs in the datastore with a given key prefix.
 * @see {@link https://github.com/levelgraph/levelgraph/issues/106#issuecomment-69797211 Unicode delimiter character sequence}
 */
function getValuesByKeyPrefix (db, prefix) {
  return new Promise((resolve, reject) => {
    let values = {}
    db.createReadStream({
      gte: prefix,
      lte: prefix + `\udbff\udfff`
    })
      .on(`data`, data => {
        values[data.key] = data.value
      })
      .on(`error`, (err) => reject(err))
      .on(`end`, () => resolve(values))
  })
}

/**
 * Get a value from a key/value pair in the datastore with a given key.
 */
async function getValueByKey (db, key) {
  try {
    let value = await db.get(key)
    return value
  } catch (err) {
    if (err.name === `NotFoundError`) {
      // Do nothing, not-found isn't bad.
    } else {
      console.log(err.message)
    }
  }
}

/**
 * Put a key/value pair into the datastore.
 */
async function putValueByKey (db, key, value) {
  try {
    await db.put(key, value)
    return
  } catch (err) {
    console.log(err.message)
  }
}

/**
 * Get the Slack bot-user token from the datastore.
 */
async function getSlackToken (db) {
  try {
    let token = await db.get(`slack::settings::token`)
    return token
  } catch (err) {
    if (err.name === `NotFoundError`) {
      // Do nothing, not-found isn't bad.
    } else {
      console.log(err.message)
    }
  }
}

/**
 * Get the Slack notify (name) from the datastore.
 */
async function getSlackNotify (db) {
  try {
    let notify = await db.get(`slack::settings::notify`)
    return notify
  } catch (err) {
    if (err.name === `NotFoundError`) {
      // Do nothing, not-found isn't bad.
    } else {
      console.log(err.message)
    }
  }
}

/**
 * Get the Slack notifyType from the datastore.
 */
async function getSlackNotifyType (db) {
  try {
    let notifyType = await db.get(`slack::settings::notifyType`)
    return notifyType
  } catch (err) {
    if (err.name === `NotFoundError`) {
      // Do nothing, not-found isn't bad.
    } else {
      console.log(err.message)
    }
  }
}

module.exports = {
  instance: instance,
  getAll: getAll,
  getValueByKey: getValueByKey,
  getValuesByKeyPrefix: getValuesByKeyPrefix,
  putValueByKey: putValueByKey,
  getSlackToken: getSlackToken,
  getSlackNotify: getSlackNotify,
  getSlackNotifyType: getSlackNotifyType
}
