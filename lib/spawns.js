#!/usr/bin/env node

'use strict'

/**
 * Spawn child process wrapper functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const spawn = require(`child_process`).spawn

/**
 * Handle the case where proc.command isn't defined.
 * Set proc.command and proc.argsArray to echo "No command provided".
 * @param {Object} proc The process.command and process.argsArray to spawn.
 */
function handleNoCommandProvided (proc) {
  return new Promise(resolve => {
    if (proc.command === undefined) proc = {command: `echo`, argsArray: [`No command provided`]}
    resolve(proc)
  })
}

/**
 * Spawn the child process, using arguments only if they were provided.
 * @param {Object} proc The process.command and process.argsArray to spawn.
 */
function spawnTheChildProcess (proc) {
  return new Promise(resolve => {
    if (proc.argsArray === undefined) proc.argsArray = []
    resolve(spawn(proc.command, proc.argsArray, {shell: true}))
  })
}

/**
 * Handle the process output of the spawned child process.
 * @param {Object} spawned The spawned child process.
 * @see {@link https://stackoverflow.com/a/10805292 regex match all newlines}
 */
function handleSpawnedOutput (spawned) {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve('Gave up after 30 seconds.') }, 30000)
    let output = []
    spawned.stdout.on('data', data => {
      output = output.concat(data.toString('utf8').split(/\r?\n|\r/g))
      output = output.filter(line => line.length > 0)
    })
    spawned.stderr.on('data', data => reject(data))
    spawned.on('exit', () => resolve(output))
  })
}

function cleanupSpawnedProcess (spawned) {
  return new Promise(resolve => {
    spawnTheChildProcess({command: 'kill', argsArray: ['-9', spawned.pid]})
    // TODO: Rewrite this workaround
    // This is to kill the orphaned phantomjs process.
    // spawnTheChildProcess({command: 'kill', argsArray: ['-9', spawned.pid + 1]})
    resolve()
  })
}

/**
 * Spawn a child process using given command and arguments.
 * @param  {String} command Command to be spawned.
 * @param  {Array} argsArray Command arguments (array of strings).
 * @return {Object} output
 */
async function childProcess (command, argsArray) {
  let proc = {command: command, argsArray: argsArray}
  proc = await handleNoCommandProvided(proc)
  let spawned = await spawnTheChildProcess(proc)
  let output = await handleSpawnedOutput(spawned)
  cleanupSpawnedProcess(spawned)
  return output
}
exports.childProcess = childProcess
