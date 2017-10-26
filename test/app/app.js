#!/usr/bin/env node
/* eslint-env mocha */

'use strict'

/**
 * Unit test of a fatal error during app.js startup.
 * @author {@link https://github.com/jmg1138 jmg1138}
 */

const intercept = require(`intercept-stdout`)
const util = require(`util`)

const setTimeoutPromise = util.promisify(setTimeout)

describe(`App.js (the main app script)`, async () => {
  it(`should start the app successfully.`, async () => {
    const exit = process.exit
    process.env.APP_EXIT = `false`
    process.exit = () => { process.env.APP_EXIT = `true` }
    let unhook = intercept(txt => { return `` }) // Begin muting stdout.
    const app = require(`../../app`)
    app.main()
    await setTimeoutPromise(3000) // Wait 3 seconds for the app to finish starting.
    process.env.APP_EXIT.should.equal(`false`)
    unhook() // Stop muting stdout.
    process.exit = exit // Reset process.exit as it was.
    delete require.cache[require.resolve(`../../app`)]
    delete process.env.APP_EXIT
  })
})
