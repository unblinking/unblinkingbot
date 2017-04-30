#!/usr/bin/env node

/**
 * The child process spawner for the unblinkingbot.
 * @namespace spawns
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * Require the 3rd party modules that will be used.
 * @see {@link https://github.com/petkaantonov/bluebird bluebird}
 * @see {@link https://nodejs.org/api/child_process.html child process}
 */
const P = require("bluebird");
const spawn = require("child_process").spawn;

/**
 * 
 */
const spawns = {

  /**
   * 
   */
  spawner: data => {

    /**
     * 
     */
    handleNoData(data)
      .then(data => handleNoCommand(data))
      .then(data => spawnTheCommand(data))
      .then(proc => handleProcessOutput(proc))
      .catch(err => console.log(err.message));

    /**
     * 
     * @param {Object} data
     */
    function handleNoData(data) {
      return new P(resolve => {
        if (!data) {
          data = {};
          data.command = "echo";
          data.argsArray = ["No data provided"];
        }
        resolve(data);
      });
    }

    /**
     * Set defaults if no command parameter was provided.
     * @param {Object} data
     */
    function handleNoCommand(data) {
      return new P(resolve => {
        if (!data.command) {
          data.command = "echo";
          data.argsArray = ["No command provided"];
        }
        resolve(data);
      });
    }

    /**
     * Spawn the command, using arguments only if they were provided.
     * @param {Object} data
     */
    function spawnTheCommand(data) {
      return new P(resolve => {
        if (!data.argsArray) {
          resolve(spawn(data.command, [], {
            shell: true
          }));
        } else if (data.argsArray) {
          resolve(spawn(data.command, data.argsArray, {
            shell: true
          }));
        }
      });
    }

    /**
     * 
     * @param {*} proc 
     */
    function handleProcessOutput(proc) {
      return new P(resolve => {
        proc.stdout.on("data", data => logOutput(data));
        proc.stderr.on("data", data => logOutput(data));
        proc.on("close", code => logOutput(`Closed with code ${code}`));
        proc.on("exit", code => logOutput(`Exited with code ${code}`));
        resolve();
      });
    }

    /**
     * 
     * @param {*} data 
     */
    function logOutput(data) {
      data = data.toString("utf8").replace(/\n$/, ''); // Remove newlines
      console.log(data);
    }

  }

};

/**
 * Assign our appRouter object to module.exports.
 * @see {@link https://nodejs.org/api/modules.html#modules_the_module_object Nodejs modules: The module object}
 * @see {@link https://nodejs.org/api/modules.html#modules_module_exports Nodejs modules: module exports}
 */
module.exports = spawns;