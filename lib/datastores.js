#!/usr/bin/env node

'use strict'

/**
 * Datastore wrapper functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const level = require('level')

/**
 * Instantiate the datastore.
 */
function instance () {
  return new Promise(resolve => {
    let db = level('db', { valueEncoding: 'json' })
    resolve(db)
  })
}

/**
 * Get all key-value pairs from the datastore.
 * @param {Object} db Reference to the LevelDB data store
 * @see {@link https://github.com/eslint/eslint/issues/5150 no-return-assign behavior changed with arrow functions}
 */
/*
function getAll (db) {
  return new Promise((resolve, reject) => {
    let foundData = {}
    db.createReadStream()
      .on('data', data => foundData[data.key] = data.value)
      .on('error', err => reject(err))
      .on('end', () => resolve(foundData))
  })
}
*/

/**
 * Get all keys with a given prefix.
 * @see {@link https://github.com/levelgraph/levelgraph/issues/106#issuecomment-69797211 Unicode delimiter character sequence}
 */
/*
function getValuesByKeyPrefix (db, prefix) {
  return new Promise((resolve, reject) => {
    let values = {}
    db.createReadStream({
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
*/

module.exports = {
  instance: instance
}
