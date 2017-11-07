#!/usr/bin/env node

'use strict'

/**
 * Express.js front-end wrapper functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const expressjs = require(`express`)
const helmet = require(`helmet`)
const http = require(`http`)
const path = require(`path`)

/**
 * Instantiate the express.js application.
 */
function expressInstance () {
  return new Promise(resolve => {
    let express = expressjs()
    resolve(express)
  })
}

/**
 * Configure the express.js application.
 * Define all express configurations here (except routes, define routes last).
 * @param {Object} express The expressjs instance.
 */
function expressConfigure (express) {
  return new Promise(resolve => {
    express.use(helmet())
    express.use(expressjs.static(path.join(__dirname, `../public`)))
    express.locals.pretty = true // Pretty html.
    express.set(`views`, `./views`)
    express.set(`view engine`, `pug`)
    resolve()
  })
}

/**
 * Define the express.js routes.
 * @param {Object} express The expressjs instance.
 */
function expressRoutes (express) {
  return new Promise(resolve => {
    express.get(`/`, (req, res) => res.render(`settings`))
    express.get(`/settings`, (req, res) => res.render(`settings`))
    express.get(`/datastore`, (req, res) => res.render(`datastore`))
    resolve()
  })
}

/**
 * Define the express.js error handling middleware.
 * @param {Object} express The expressjs instance.
 */
function expressErrors (express) {
  return new Promise(resolve => {
    express.use((req, res, next) => res.status(404).send(`four, oh four!`))
    express.use((err, req, res, next) => {
      res.status(500).send(`five hundred!`)
      console.log(err.message)
    })
    resolve()
  })
}

/**
 * Instantiate the http server.
 * @param {Object} express The expressjs instance.
 */
function serverInstance (express) {
  return new Promise(resolve => {
    let server = http.Server(express)
    resolve(server)
  })
}

/**
 * Listen for http server connections.
 * @param {Object} server The http server instance.
 */
function serverListen (server) {
  return new Promise(resolve => {
    const port = parseInt(process.env.PORT, 10) || 1138
    server.listen(port, () => {
      console.log(` Web based management console on port ${port}`)
      resolve()
    })
  })
}

module.exports = {
  expressInstance: expressInstance,
  expressConfigure: expressConfigure,
  expressRoutes: expressRoutes,
  expressErrors: expressErrors,
  serverInstance: serverInstance,
  serverListen: serverListen
}
