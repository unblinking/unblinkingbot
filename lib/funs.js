#!/usr/bin/env node

'use strict'

/**
 * These functions put the fun in functions.
 * @author {@link https://github.com/jmg1138 jmg1138}
 */

const packageJson = require(`../package.json`)

/**
 * Tag the console with some application name graffiti.
 * @see {@link http://patorjk.com/software/taag/#p=display&h=0&f=Straight&t=Bremertown TAAG}
 * @see {@link https://stackoverflow.com/a/41407246 nodejs console font color}
 */
function graffiti () {
  return new Promise(resolve => {
    let art = `\x1b[1m\x1b[32m
       .  .    .         .__    ,
 . .._ |_ |*._ ;_/*._  _ [__) _-+-
 (_|[ )[_)||[ )| \\|[ )(_][__)(_)|
 \x1b[37mversion ${packageJson.version}\x1b[1m\x1b[32m        ._|\x1b[0m
`
    resolve(art)
  })
}
exports.graffiti = graffiti
