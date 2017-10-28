#!/usr/bin/env node
/* eslint-env mocha */

'use strict'

/**
 * Unit test of the root route of the web front-end.
 * @author {@link https://github.com/jmg1138 jmg1138}
 */

describe(`Unit testing`, () => {
  it(`should find that NODE_ENV has been set to test.`, () =>
    process.env.NODE_ENV.should.equal(`test`)
  )
  after(() => {
    // Unit tests, required in special order of execution.
    require(`./app/app`)
  })
})
