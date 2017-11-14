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
 * A forEach method that works with async/await.
 * @param {array} array
 * @param {function} callback
 * @see https://gist.github.com/Atinux/fd2bcce63e44a7d3addddc166ce93fb2
 */
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

/**
 * Check for accessibility of a motionEye conf file.
 * @param {string} file The filename.
 * @returns {boolean} True if the file is accessible.
 */
async function fileAccessible (file) {
  let accessible
  try {
    const directory = `/usr/local/unblinkingbot/motion/settings/`
    await accessFileAsync(`${directory}${file}`)
    accessible = true
  } catch (err) {
    accessible = false
  }
  return accessible
}

/**
 * Check for accessibility of the motion.conf file.
 * @returns {boolean} True if the file is accessible
 */
async function motionConfFileFound () {
  let accessible = await fileAccessible(`motion.conf`)
  return accessible
}

/**
 * Check for accessibility of the motioneye.conf file.
 * @returns {boolean} True if the file is accessible
 */
async function motionEyeConfFileFound () {
  let accessible = await fileAccessible(`motioneye.conf`)
  return accessible
}

/**
 * Get motionEye conf file names by prefix.
 * @param  {string} prefix Filename prefix to look for.
 * @return {array} files The found filenames matching the given prefix.
 */
async function getFilenamesByPrefix (prefix) {
  let directory = `/usr/local/unblinkingbot/motion/settings/`
  let files = []
  try {
    let allFiles = await readDirAsync(directory)
    await asyncForEach(allFiles, async file => {
      if (file.startsWith(prefix)) files.push(file)
    })
  } catch (err) {
    console.log(err.stack)
  }
  return files
}

/**
 * Count the motionEye thread files (one per camera)
 * @returns {number} count The number of files starting with "thread-"
 */
async function threadFileCount () {
  let files = []
  try {
    files = await getFilenamesByPrefix(`thread-`)
  } catch (err) {
    console.log(err.stack)
  }
  return files.length
}

/**
 * Get the contents of one motionEye conf file.
 * @param {string} file The filename.
 * @return {string} The file contents of the given filename.
 */
async function getFileContents (file) {
  let contents
  const directory = `/usr/local/unblinkingbot/motion/settings/`
  try {
    contents = await readFileAsync(`${directory}${file}`, { encoding: `utf8` })
  } catch (err) {
    console.log(err.stack)
  }
  return contents
}

/**
 * Get the contents of multiple motionEye conf files.
 * @param  {array} files An array of filenames.
 * @return {array} An array of the file contents of the given filenames.
 */
async function getFilesContents (files) {
  let contents = []
  const directory = `/usr/local/unblinkingbot/motion/settings/`
  try {
    await asyncForEach(files, async file => {
      contents.push(await getFileContents(file))
    })
  } catch (err) {
    console.log(err.stack)
  }
  return contents
}

/**
 * Read the motionEye file motion.conf
 * @return {string} The file contents of motion.conf.
 */
async function motionConfFileRead () {
  let contents
  try {
    contents = await getFileContents(`motion.conf`)
  } catch (err) {
    console.log(err.stack)
  }
  return contents
}

/**
 * Read the motionEye file motioneye.conf
 * @return {string} The file contents of motioneye.conf.
 */
async function motionEyeConfFileRead () {
  let contents
  try {
    contents = await getFileContents(`motioneye.conf`)
  } catch (err) {
    console.log(err.stack)
  }
  return contents
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

async function getSnapshotUrls () {
  try {
    let files = await getFilenamesByPrefix(`thread-`)
    let contents = await getFilesContents(files)
    // console.log(contents.length)
    




  } catch (err) {
    console.log(err.stack)
  }
  console.log(`------------------- done ------------------------------------`)
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

module.exports = {
  motionConfFileFound: motionConfFileFound,
  motionEyeConfFileFound: motionEyeConfFileFound,
  threadFileCount: threadFileCount,
  getSnapshotUrls: getSnapshotUrls
}
