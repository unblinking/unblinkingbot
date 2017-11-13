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
    const directory = `/usr/local/unblinkingbot/motion/settings/`
    const file = `motion.conf`
    let found = await accessFileAsync(`${directory}${file}`)
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
    const directory = `/usr/local/unblinkingbot/motion/settings/`
    const file = `motioneye.conf`
    let found = await accessFileAsync(`${directory}${file}`)
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
    const directory = `/usr/local/unblinkingbot/motion/settings/`
    let count = 0
    const files = await readDirAsync(directory)
    files.forEach(file => {
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
    const directory = `/usr/local/unblinkingbot/motion/settings/`
    const file = `motion.conf`
    const contents = await readFileAsync(`${directory}${file}`, { encoding: `utf8` })
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
    const directory = `/usr/local/unblinkingbot/motion/settings/`
    const file = `motioneye.conf`
    const contents = await readFileAsync(`${directory}${file}`, { encoding: `utf8` })
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
    const directory = `/usr/local/unblinkingbot/motion/settings/`
    const files = await readDirAsync(directory)
    let threadFiles = []
    files.forEach(file => {
      if (file.startsWith(`thread-`)) threadFiles.push(file)
    })
    console.log(threadFiles)
    console.log(threadFiles.length)
    

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
