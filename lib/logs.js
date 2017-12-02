#!/usr/bin/env node

'use strict'

/**
 * Logging wrapper functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const winston = require(`winston`)

// Logging levels: error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5
const level = process.env.LOG_LEVEL || `silly`

const logs = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      handleExceptions: true,
      humanReadableUnhandledException: true,
      level: level,
      timestamp: true
    })
  ],
  exitOnError: false
})

// The Winston Logger EventEmitter emits error events. Handle those!
logs.on(`error`, err => console.log(err.stack))

module.exports = logs
