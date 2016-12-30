#!/usr/bin/env node

'use strict';

var spawn = require('child_process').spawn;

function unblinkingSpawn(bundle) {

    // Defaults if no command parameter was provided
    if (!bundle.command) {
        bundle.command = 'echo';
        bundle.args = ['No command provided'];
        bundle.options = '';
    }

    var process;

    // Spawn the command, only using parameters that were provided
    if (!bundle.args) { // If there are no args
        process = spawn(bundle.command, [], bundle.options);
    } else if (bundle.args) { // If there are args
        process = spawn(bundle.command, [bundle.args], bundle.options);
    }

    function logToConsole(data) {
        // Remove newlines from the data
        data = data.toString('utf8').replace(/\n$/, '');
        // Log the data to the console
        console.log(`${process.pid}:${data}`);
    }
    process.stdout.on('data', (data) => {
        logToConsole(data);
    });
    process.stderr.on('data', (data) => {
        logToConsole(data);
    });
    process.on('close', (code) => {
        logToConsole(`Closed with code ${code}`);
    });
    process.on('exit', (code) => {
        logToConsole(`Exited with code ${code}`);
    });

}
exports.unblinkingSpawn = unblinkingSpawn;