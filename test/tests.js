#!/usr/bin/env node

'use strict'

/**
 * Unit test of the root route of the web front-end.
 * @author {@link https://github.com/jmg1138 jmg1138}
 */

/**
 * Required modules.
 * @see {@link https://github.com/visionmedia/supertest supertest}
 */
const express = require('../app')
const supertest = require('supertest')

const server = supertest.agent('http://127.0.0.1:1138');

/**
 * Tests.
 */
describe('GET / (the root route)', () =>
  it('should respond.', () =>
    server
      .get('/')
      .expect(200)
  )
)
