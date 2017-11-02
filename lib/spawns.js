#!/usr/bin/env node

'use strict'

/**
 * Child process functions for the unblinkingBot.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

/**
 * 3rd party modules that will be used.
 * @see {@link https://nodejs.org/api/child_process.html child process}
 */
const spawn = require(`child_process`).spawn

/**
 * Module to be exported, containing the spawn child process wrapper functions.
 */
const spawns = {

  /**
   * Child process spawner.
   * @param {Object} data An object containing the command and arguments-array
   * to be spawned.
   * @example
   * const spawns = require("./spawns.js");
   * spawns.spawner({
   *   "command": "echo",
   *   "argsArray": ["This is a test"]
   * });
   */
  spawner: data => {
    /**
     * Steps to spawn the child process.
     * Handle the case where data isn't defined, and then handle the case where
     * data.command isn't defined, and then spawn the process, and then handle
     * the process output.
     */
    handleNoData(data)
      .then(data => handleNoCommand(data))
      .then(data => spawnTheCommand(data))
      .then(proc => handleProcessOutput(proc))
      .catch(err => console.log(err.message))

    /**
     * Handle the case where data isn't defined.
     * Set the command and args to echo "No data provided" when spawned.
     * @param {Object} data
     */
    function handleNoData (data) {
      return new Promise(resolve => {
        if (!data) {
          data = {}
          data.command = `echo`
          data.argsArray = [`No data provided`]
        }
        resolve(data)
      })
    }

    /**
     * Handle the case where data.command isn't defined.
     * Set the command and args to echo "No data provided" when spawned.
     * @param {Object} data
     */
    function handleNoCommand (data) {
      return new Promise(resolve => {
        if (!data.command) {
          data.command = `echo`
          data.argsArray = [`No command provided`]
        }
        resolve(data)
      })
    }

    /**
     * Spawn the command, using arguments only if they were provided.
     * @param {Object} data
     */
    function spawnTheCommand (data) {
      return new Promise(resolve => {
        if (!data.argsArray) {
          resolve(spawn(data.command, [], {
            shell: true
          }))
        } else if (data.argsArray) {
          resolve(spawn(data.command, data.argsArray, {
            shell: true
          }))
        }
      })
    }

    /**
     * Handle the process output of the spawned child process.
     * @param {*} proc
     */
    function handleProcessOutput (proc) {
      return new Promise(resolve => {
        proc.stdout.on(`data`, data => logOutput(data))
        proc.stderr.on(`data`, data => logOutput(data))
        proc.on(`close`, code => logOutput(`Closed with code ${code}`))
        proc.on(`exit`, code => logOutput(`Exited with code ${code}`))
        resolve()
      })
    }

    /**
     * Log data to the console, after removing newlines.
     * @param {*} data
     */
    function logOutput (data) {
      data = data.toString(`utf8`).replace(/\n$/, ``) // Remove newlines
      // console.log(data);
    }
  }

}

module.exports = spawns
