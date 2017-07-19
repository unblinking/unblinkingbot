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
const level = require('levelup') // Node.js-style LevelDB wrapper
const thenLevel = require('then-levelup') // Promise based LevelDB interface

/**
 * Create (or open) the datastore.
 * @param {Object} bundle The main bundle of shared references from app.js.
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
 * Get all key-value pairs from the datastore.
 * @param {Object} db Reference to the LevelDB data store
 * @see {@link https://github.com/eslint/eslint/issues/5150 no-return-assign behavior changed with arrow functions}
 */
function getAll (db) {
  return new Promise((resolve, reject) => {
    let foundData = {}
    db.createReadStream()
      // eslint-disable-next-line
      .on('data', data => foundData[data.key] = data.value)
      .on('error', err => reject(err))
      .on('end', () => resolve(foundData))
  })
}
exports.getAll = getAll

/**
 * Get all keys with a given prefix.
 * @param {Object} bundle The main bundle of shared references from app.js.
 * @see {@link https://github.com/levelgraph/levelgraph/issues/106#issuecomment-69797211 Unicode delimiter character sequence}
 */
function getValuesByKeyPrefix (bundle, prefix) {
  return new Promise((resolve, reject) => {
    let values = {}
    bundle.db.createReadStream({
      gte: prefix,
      lte: prefix + '\udbff\udfff'
    })
      .on('data', data => {
        values[data.key] = data.value
      })
      .on('error', (err) => reject(err))
      .on('end', () => resolve(values))
  })
}
exports.getValuesByKeyPrefix = getValuesByKeyPrefix
