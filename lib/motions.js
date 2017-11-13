#!/usr/bin/env node

'use strict'

/**
 * motionEye integration functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const fs = require(`fs`)
const {promisify} = require(`util`)

const accessFileAsync = promisify(fs.access)
const readFileAsync = promisify(fs.readFile)
const readDirAsync = promisify(fs.readdir)

/**
 * Check for accessibility of the motion.conf file.
 */
async function motionConfFileFound () {
  try {
    const file = `/usr/local/unblinkingbot/motion/settings/motion.conf`
    let found = await accessFileAsync(file)
    return true
  } catch (err) {
    console.log(err.message)
  }
}

/**
 * Check for accessibility of the motioneye.conf file.
 */
async function motionEyeConfFileFound () {
  try {
    const file = `/usr/local/unblinkingbot/motion/settings/motioneye.conf`
    let found = await accessFileAsync(file)
    return true
  } catch (err) {
    console.log(err.message)
  }
}

/**
 * Get the motionEye thread files (one per camera)
 */
async function motionThreadFileCount () {
  try {
    let count = 0
    const threadFiles = await readDirAsync(`/usr/local/unblinkingbot/motion/settings/`)
    threadFiles.forEach(file => {
      if (file.startsWith(`thread-`)) count += 1
    })
    return count
  } catch (err) {
    console.log(err.message)
  }
}

/**
 * Read the motionEye file motion.conf
 */
async function motionConfFileRead () {
  try {
    const file = `/usr/local/unblinkingbot/motion/settings/motion.conf`
    const contents = await readFileAsync(file, { encoding: `utf8` })
    return contents
  } catch (err) {
    console.log(err.message)
  }
}

/**
 * Read the motionEye file motioneye.conf
 */
async function motionEyeConfFileRead () {
  try {
    const file = `/usr/local/unblinkingbot/motion/settings/motioneye.conf`
    const contents = await readFileAsync(file, { encoding: `utf8` })
    return contents
  } catch (err) {
    console.log(err.message)
  }
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
async function getAllMotionSnapshots () {
  try {
    let motionconf = await motionConfFileRead()
    console.log(motionconf)
  } catch (err) {
    console.log(err.message)
  }
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

module.exports = {
  motionConfFileFound: motionConfFileFound,
  motionEyeConfFileFound: motionEyeConfFileFound,
  motionThreadFileCount: motionThreadFileCount,
  getAllMotionSnapshots: getAllMotionSnapshots
}