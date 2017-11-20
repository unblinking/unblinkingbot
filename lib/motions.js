#!/usr/bin/env node

'use strict'

/**
 * motionEye integration functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const fs = require(`fs`)
const puppeteer = require(`puppeteer`)
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
/*
async function motionEyeConfFileRead () {
  let contents
  try {
    contents = await getFileContents(`motioneye.conf`)
  } catch (err) {
    console.log(err.stack)
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
    console.log(err.stack)
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
    console.log(err.stack)
  }
  return ids
}

/**
 * Scrape motionEye page for each available Snapshot URLs
 * @return {object} An object of available snapshots by ID, with name and url.
 */
async function getSnapshotUrls () {
  let snapshotUrls = {}
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser'
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    })
    const page = await browser.newPage()
    await page.goto(`http://192.168.0.9:8000`)
    await page.waitFor(3000)
    let userName = `admin`
    let password = await getMotionEyeAdminPassword()
    await page.click(`#usernameEntry`)
    await page.keyboard.type(userName)
    await page.click(`#passwordEntry`)
    await page.keyboard.type(password)
    await page.click(`body > div.modal-container > div > table > tbody > tr > td:nth-child(2) > div`)
    await page.waitFor(2000)
    let ids = await getMotionEyeCameraIds()
    await asyncForEach(ids, async id => {
      await page.select(`select#cameraSelect`, id)
      await page.waitFor(1000)
      let name = await page.evaluate(() => {
        let element = document.querySelector(`input[id="deviceNameEntry"]`)
        return element.value
      })
      let url = await page.evaluate(() => {
        let element = document.querySelector(`input[id="streamingSnapshotUrlEntry"]`)
        return element.value
      })
      snapshotUrls[id] = {
        name: name,
        url: url
      }
    })
    browser.close()
  } catch (err) {
    logs.error(`('./lib/motions').getSnapshotUrls()\n`, {stack: err.stack})
  }
  return snapshotUrls
}

module.exports = {
  motionConfFileFound: motionConfFileFound,
  motionEyeConfFileFound: motionEyeConfFileFound,
  threadFileCount: threadFileCount,
  getSnapshotUrls: getSnapshotUrls
}
