#!/usr/bin/env node

'use strict'

/**
 * motionEye integration functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const Chromy = require(`chromy`)
const fs = require(`fs`)
const {promisify} = require(`util`)
const logs = require(`./logs`)

const accessFileAsync = promisify(fs.access)
const readFileAsync = promisify(fs.readFile)
const readDirAsync = promisify(fs.readdir)

/**
 * A forEach method that works with async/await.
 * @param {array} array
 * @param {function} callback
 * @see https://gist.github.com/Atinux/fd2bcce63e44a7d3addddc166ce93fb2
 */
async function asyncForEach (array, callback) {
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
    const directory = `/usr/local/unblinkingbot/motioneye/`
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
  let directory = `/usr/local/unblinkingbot/motioneye/`
  let files = []
  try {
    let allFiles = await readDirAsync(directory)
    await asyncForEach(allFiles, async file => {
      if (file.startsWith(prefix)) files.push(file)
    })
  } catch (err) {
    logs.error(`./lib/motions.js\n`, {stack: err.stack})
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
    logs.error(`./lib/motions.js\n`, {stack: err.stack})
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
  const directory = `/usr/local/unblinkingbot/motioneye/`
  try {
    contents = await readFileAsync(`${directory}${file}`, { encoding: `utf8` })
  } catch (err) {
    logs.error(`./lib/motions.js\n`, {stack: err.stack})
  }
  return contents
}

/**
 * Get the contents of multiple motionEye conf files.
 * @param {array} files An array of filenames.
 * @return {array} An array of the file contents of the given filenames.
 */
async function getFilesContents (files) {
  let contents = []
  try {
    await asyncForEach(files, async file => {
      contents.push(await getFileContents(file))
    })
  } catch (err) {
    logs.error(`./lib/motions.js\n`, {stack: err.stack})
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
    logs.error(`./lib/motions.js\n`, {stack: err.stack})
  }
  return contents
}

/**
 * Read the motionEye file motioneye.conf
 * @return {string} The file contents of motioneye.conf.
 */
/*
async function motionEyeConfFileRead () {
  let contents
  try {
    contents = await getFileContents(`motioneye.conf`)
  } catch (err) {
    logs.error(`./lib/motions.js\n`, {stack: err.stack})
  }
  return contents
}
*/

/**
 * Get the motionEye admin user password.
 * @return {string} The admin_password value from motion.conf.
 */
async function getMotionEyeAdminPassword () {
  let password
  try {
    let content = await motionConfFileRead()
    content = content.split(`\n`)
    await asyncForEach(content, async line => {
      if (line.startsWith(`# @admin_password `)) {
        password = line.replace(`# @admin_password `, ``)
      }
    })
  } catch (err) {
    logs.error(`./lib/motions.js\n`, {stack: err.stack})
  }
  return password
}

/**
 * Get all camera ID numbers from the motionEye thread conf files.
 * @return {array} An array of the available camera ID numbers.
 */
async function getMotionEyeCameraIds () {
  let ids = []
  try {
    let files = await getFilenamesByPrefix(`thread-`)
    let contents = await getFilesContents(files)
    await asyncForEach(contents, async content => {
      content = content.split(`\n`)
      await asyncForEach(content, async line => {
        if (line.startsWith(`# @id `)) ids.push(line.replace(`# @id `, ``))
      })
    })
  } catch (err) {
    logs.error(`./lib/motions.js\n`, {stack: err.stack})
  }
  return ids
}

/**
 * Scrape motionEye page for each available Snapshot URLs
 * @return {object} An object of available snapshots by ID, with name and url.
 */
async function getSnapshotUrls () {
  let chrome = new Chromy()
  let snapshotUrls = {}
  try {
    let username = `admin`
    let password = await getMotionEyeAdminPassword()
    let ids = await getMotionEyeCameraIds()
    await chrome.goto(`http://127.0.0.1:8765/`)
    await chrome.wait(`#usernameEntry`)
    await chrome.type(`#usernameEntry`, username)
    await chrome.type(`#passwordEntry`, password)
    await chrome.click(`body > div.modal-container > div > table > tbody > tr > td:nth-child(2) > div`)
    await chrome.wait(`body > div.header > div > div.settings-top-bar.closed > div.button.icon.settings-button.mouse-effect`)
    await chrome.click(`body > div.header > div > div.settings-top-bar.closed > div.button.icon.settings-button.mouse-effect`)
    await asyncForEach(ids, async id => {
      await chrome.wait(`#cameraSelect`)
      await chrome.select(`#cameraSelect`, id)
      // eslint-disable-next-line
      await chrome.evaluate(() => { $('#cameraSelect').change() })
      await chrome.sleep(1000)
      let name = await chrome.evaluate(() => {
        return document.querySelector(`#deviceNameEntry`).value
      })
      await chrome.wait(`#streamingSnapshotUrlHtml > a`)
      await chrome.click(`#streamingSnapshotUrlHtml > a`)
      await chrome.wait(`body > div.modal-container > div > div > span > span`)
      let url = await chrome.evaluate(() => {
        return document.querySelector(`body > div.modal-container > div > div > span > span`).innerText
      })
      snapshotUrls[id] = {
        name: name,
        url: url
      }
    })
    await chrome.close()
  } catch (err) {
    logs.error(`./lib/motions.js\n`, {stack: err.stack})
    chrome.close()
  }
  return snapshotUrls
}

/**
 * Scrape motionEye page for a quick snapshot of everything.
 * @return {object} A png screenshot (preview) of the motionEye front-end.
 */
async function getPreviewScreenshot () {
  let chrome = new Chromy()
  let preview
  try {
    let username = `admin`
    let password = await getMotionEyeAdminPassword()
    await chrome.goto(`http://127.0.0.1:8765/`)
    await chrome.wait(`#usernameEntry`)
    await chrome.type(`#usernameEntry`, username)
    await chrome.type(`#passwordEntry`, password)
    await chrome.click(`body > div.modal-container > div > table > tbody > tr > td:nth-child(2) > div`)
    await chrome.sleep(20000)
    preview = await chrome.screenshotDocument()
    await chrome.close()
  } catch (err) {
    logs.error(`./lib/motions.js\n`, {stack: err.stack})
    chrome.close()
  }
  return preview
}

module.exports = {
  motionConfFileFound: motionConfFileFound,
  motionEyeConfFileFound: motionEyeConfFileFound,
  threadFileCount: threadFileCount,
  getSnapshotUrls: getSnapshotUrls,
  getPreviewScreenshot: getPreviewScreenshot
}
