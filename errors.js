#!/usr/bin/env node

'use strict'

/**
 * Error handling for the unblinkingBot web front-end.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

 /**
  * Require the modules that will be used.
  * @see {@link https://github.com/rburns/ansi-to-html ansi-to-html}
  * @see {@link https://github.com/AriaMinaei/pretty-error pretty-error}
  */
 const ansi_to_html = require('ansi-to-html')
 const pretty_error = require('pretty-error')

/**
* Using pretty-error along with ansi-to-html to display error messages to the
* user in a nice format.
*/
const ansiConvert = new ansi_to_html({
  newline: true
})
const prettyError = new pretty_error().skipNodeFiles()

/**
 * @param {Object} app The Express application instance.
 */
const errors = app => {
  app.use(function (req, res, next) {
    res.status(404).render('404')
  })
  app.use(function (err, req, res, next) {
    if (err) {
      let params = {
        error: ansiConvert.toHtml(prettyError.render(err))
      }
      res.render('error', params)
    }
  })
}
module.exports = errors
