'use strict'

/**
 * Settings page scripts, ublinkingBot web based management console.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

/* eslint-env jquery */
/* global io */

var socket = io.connect()

socket.on(`fullDbRes`, data => handleFullDbRes(data))
socket.on(`motionConfFileRes`, text => handleMotionConfFileRes(text))
socket.on(`motionEyeConfFileRes`, text => handleMotionEyeConfFileRes(text))
socket.on(`motionThreadFileRes`, count => handleMotionThreadFileRes(count))
socket.on(`readSlackChannelsRes`, channelNames => handleChannelsRes(channelNames))
socket.on(`readSlackGroupsRes`, groupNames => handleReadSlackGroupsRes(groupNames))
socket.on(`readSlackUsersRes`, userNames => handleReadSlackUsersRes(userNames))
socket.on(`saveSlackNotifyRes`, (notify, notifyType, success, err) => handleSaveSlackNotifyRes(notify, notifyType, success, err))
socket.on(`saveSlackTokenRes`, (token, success, err) => handleSaveSlackTokenRes(token, success, err))
socket.on(`slackRestartFailed`, message => handleSlackRestartFailed(message))
socket.on(`slackConnectionOpened`, message => handleSlackConnectionOpened(message))
socket.on(`slackConnectionStatusRes`, connected => handleSlackConnectionStatusRes(connected))
socket.on(`slackDisconnection`, message => handleSlackDisconnection(message))
socket.on(`slackNotifyRes`, data => handleSlackNotifyRes(data))
socket.on(`slackTokenRes`, token => handleSlackTokenRes(token))

/**
 * Count to a number of seconds and then continue.
 * For announcement animations, this is used to pause while the announcement is
 * on the screen, giving the user a number of seconds to read it before
 * continuing the animation that hides the announcement.
 * @param {number} seconds How many seconds to count to.
 */
function countTo (seconds) {
  return new Promise(resolve => setTimeout(resolve, (seconds * 1000)))
}

/**
 * Announcement of error, animation sequence.
 * First, fade to zero opacity and slide up out of view just in case it is
 * visible. Next, set html content, slide down, and fade to full opacity. Leave
 * the error announcement on the screen for the user to manually dismiss.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {String} html HTML to set as the content of each matched element.
 */
function announcementAnimationError (element, html) {
  element.fadeTo(0, 0)
  element.hide(0)
  element.html(html)
  element.show(400)
  element.fadeTo(400, 1)
}

/**
 * Announcement of success, animation sequence.
 * First, fade to zero opacity and slide up out of view just in case it is
 * visible. Next, set html content, slide down, fade to full opacity, and sleep
 * while the announcement is visible. Last, fade to zero opacity and slide up
 * out of view.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {String} html HTML to set as the content of each matched element.
 */
async function announcementAnimationSuccess (element, html) {
  try {
    element.fadeTo(0, 0)
    element.hide(0)
    element.html(html)
    element.show(400)
    element.fadeTo(400, 1)
    await countTo(5)
    element.fadeTo(400, 0)
    element.hide(400)
  } catch (err) {
    window.alert(`Error: ${err.name}`)
  }
}

/**
 * Enable a button element.
 * @param {JQuery} btn The JQuery element selector for the button.
 * @param {String} label A string of html to put in the button when enabled.
 * @param {String} busy A string of html to put in the button when clicked.
 * @param {Function} emitFn A socket.emit() function for when button is clicked.
 */
function enableButton (btn, label, busy, emitFn) {
  btn.off(`click`) // Remove any previous click handler to start with none.
  btn.html(label)
  btn.one(`click`, () => { // Add a click handler, do once.
    btn.off(`click`) // Remove the click handler, prevent duplicate clicks.
    btn.html(busy)
    emitFn()
  })
}

function enableRestartSlackBtn () {
  let btn = $(`#startSlack`)
  let label = `🚀 Reconnect`
  let busy = `<div class="loader float-left"></div> &nbsp; Reconnecting`
  function emitFn () { socket.emit(`slackRestartReq`) }
  enableButton(btn, label, busy, emitFn)
}

function enableStopSlackBtn () {
  let btn = $(`#stopSlack`)
  let label = `⏹ Disconnect`
  let busy = `<div class="loader float-left"></div> &nbsp; Disconnecting`
  function emitFn () { socket.emit(`slackStopReq`) }
  enableButton(btn, label, busy, emitFn)
}

function enableSaveTokenBtn () {
  let btn = $(`#saveToken`)
  let label = `Save`
  let busy = `<div class="loader float-left"></div>`
  function emitFn () { socket.emit(`saveSlackTokenReq`, $(`input[id=slackToken]`).val()) }
  enableButton(btn, label, busy, emitFn)
}

function enableSaveNotifyChannelBtn () {
  let btn = $(`#saveSlackDefaultNotifyChannel`)
  let label = `Save`
  let busy = `<div class="loader float-left"></div>`
  function emitFn () { socket.emit(`saveSlackNotifyReq`, $(`select[id=defaultChannelSelect]`).val(), `channel`) }
  enableButton(btn, label, busy, emitFn)
}

function enableSaveNotifyGroupBtn () {
  let btn = $(`#saveSlackDefaultNotifyGroup`)
  let label = `Save`
  let busy = `<div class="loader float-left"></div>`
  function emitFn () { socket.emit(`saveSlackNotifyReq`, $(`select[id=defaultGroupSelect]`).val(), `group`) }
  enableButton(btn, label, busy, emitFn)
}

function enableSaveNotifyUserBtn () {
  let btn = $(`#saveSlackDefaultNotifyUser`)
  let label = `Save`
  let busy = `<div class="loader float-left"></div>`
  function emitFn () { socket.emit(`saveSlackNotifyReq`, $(`select[id=defaultUserSelect]`).val(), `user`) }
  enableButton(btn, label, busy, emitFn)
}

/**
 * Enable a default notify type button element.
 * @param {JQuery} btn The JQuery element selector for the button.
 * @param {Function} emitFn A socket.emit() function for when button is clicked.
 */
function enableNotifyTypeRadioBtn (btn, emitFn) {
  btn.off(`click`) // Remove any previous click handler to start with none.
  btn.one(`click`, () => {
    btn.off(`click`) // Remove the click handler, prevent duplicate clicks.
    // Hide the drop down selectors
    $(`#inputChannels`).addClass(`hidden-xs-up`)
    $(`#inputGroups`).addClass(`hidden-xs-up`)
    $(`#inputUsers`).addClass(`hidden-xs-up`)
    // Remove all options from the selectors
    $(`#defaultChannelSelect`)[0].options.length = 0
    $(`#defaultGroupSelect`)[0].options.length = 0
    $(`#defaultUserSelect`)[0].options.length = 0
    // Show progress bar.
    $(`#progressDefaultNotifications`).removeClass(`hidden-xs-up`)
    emitFn()
  })
}

function enableNotifyTypeChannelRadioBtn () {
  let btn = $(`#radioChannel`)
  function emitFn () { socket.emit(`readSlackChannelsReq`) }
  enableNotifyTypeRadioBtn(btn, emitFn)
}

function enableNotifyTypeGroupRadioBtn () {
  let btn = $(`#radioGroup`)
  function emitFn () { socket.emit(`readSlackGroupsReq`) }
  enableNotifyTypeRadioBtn(btn, emitFn)
}

function enableNotifyTypeUserRadioBtn () {
  let btn = $(`#radioUser`)
  function emitFn () { socket.emit(`readSlackUsersReq`) }
  enableNotifyTypeRadioBtn(btn, emitFn)
}

function enableDatastoreHideBtn () {
  let btn = $(`#hideDatastoreBtn`)
  let label = `🙈 Hide`
  let busy = `<div class="loader float-left"></div> &nbsp; Hiding`
  function emitFn () {
    // Instead of a socket.io emit, just hide the data and then enable button.
    $(`#dataStoreCardBody`).html(``)
    enableDatastoreHideBtn()
  }
  enableButton(btn, label, busy, emitFn)
}

function enableDatastoreShowBtn () {
  let btn = $(`#showDatastoreBtn`)
  let label = `🙉 Show | Refresh`
  let busy = `<div class="loader float-left"></div> &nbsp; Loading`
  function emitFn () { socket.emit(`fullDbReq`) }
  enableButton(btn, label, busy, emitFn)
}

function handleFullDbRes (data) {
  $(`#dataStoreCardBody`).html(JSON.stringify(data, undefined, 2))
  enableDatastoreShowBtn()
}

/**
 * Update the Slack connection status.
 * @param {Boolean} connected True if connected, false if disconnected.
 */
function handleSlackConnectionStatusUpdate (connected) {
  let element = $(`#slackIntegrationStatus`)
  if (connected) {
    element.removeClass(`text-danger`)
    element.addClass(`text-success`)
    element.text(`connected`)
  } else {
    element.removeClass(`text-success`)
    element.addClass(`text-danger`)
    element.text(`disconnected`)
  }
}

/**
 * Populate a drop down selector with options from an array.
 * @param {Array} array Array of options to go into the selector.
 * @param {JQuery} selector The JQuery element selector to populate.
 */
function populateDropDown (array, selector) {
  for (let i = 0; i < array.length; i++) {
    let name = array[i]
    let option = document.createElement(`option`)
    option.text = name
    selector[0].add(option)
  }
}

function handleChannelsRes (channelNames) {
  populateDropDown(channelNames, $(`#defaultChannelSelect`))
  $(`#progressDefaultNotifications`).addClass(`hidden-xs-up`) // Hide progress bar.
  $(`#inputChannels`).removeClass(`hidden-xs-up`)
  enableNotifyTypeChannelRadioBtn()
}
function handleReadSlackGroupsRes (groupNames) {
  populateDropDown(groupNames, $(`#defaultGroupSelect`))
  $(`#progressDefaultNotifications`).addClass(`hidden-xs-up`) // Hide progress bar.
  $(`#inputGroups`).removeClass(`hidden-xs-up`)
  enableNotifyTypeGroupRadioBtn()
}
function handleReadSlackUsersRes (userNames) {
  populateDropDown(userNames, $(`#defaultUserSelect`))
  $(`#progressDefaultNotifications`).addClass(`hidden-xs-up`) // Hide progress bar.
  $(`#inputUsers`).removeClass(`hidden-xs-up`)
  enableNotifyTypeUserRadioBtn()
}

async function handleSaveSlackNotifyRes (notify, notifyType, success, err) {
  try {
    let element = $(`#saveSlackNotifyAlert`)
    if (success) {
      $(`#currentSettingsNotify`).text(`${notifyType} ${notify}`)
      $(`#currentSettingsNotify`).removeClass(`text-danger`)
      $(`#currentSettingsNotify`).addClass(`text-success`)
      if (notifyType === `channel`) $(`#inputChannels`).addClass(`has-success`)
      if (notifyType === `group`) $(`#inputGroups`).addClass(`has-success`)
      if (notifyType === `user`) $(`#inputUsers`).addClass(`has-success`)
      let html = `<div class="alert alert-success"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Success!</strong> Default notification recipient saved successfully.</div>`
      await announcementAnimationSuccess(element, html)
    } else {
      if (notifyType === `channel`) $(`#inputChannels`).addClass(`has-error`)
      if (notifyType === `group`) $(`#inputGroups`).addClass(`has-error`)
      if (notifyType === `user`) $(`#inputUsers`).addClass(`has-error`)
      let html = `<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Error!</strong> There was an error. Default notification recipient was not saved.<br><span class="small">Message: ${err}</span></div>`
      announcementAnimationError(element, html)
    }
    element.promise().done(() => {
      enableSaveNotifyChannelBtn()
      enableSaveNotifyGroupBtn()
      enableSaveNotifyUserBtn()
    })
  } catch (err) {
    window.alert(`Error: ${err.name}`)
  }
}

async function handleSaveSlackTokenRes (token, success, err) {
  try {
    let element
    if (success) {
      $(`#slackTokenInputGroup`).addClass(`has-success`)
      socket.emit(`slackRestartReq`)
      element = $(`#saveSlackTokenAlert`)
      let html = `<div class="alert alert-success"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Success!</strong> Slack token saved successfully. Slack messaging is being reconnected to use the new token.</div>`
      await announcementAnimationSuccess(element, html)
    } else {
      $(`#slackTokenInputGroup`).addClass(`has-error`)
      element = $(`#saveSlackTokenAlert`)
      let html = `<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Error!</strong> There was an error. Slack token was not saved.<br><span class="small">Message: ${err}</span></div>`
      announcementAnimationError(element, html)
    }
    element.promise().done(() => { enableSaveTokenBtn() })
  } catch (err) {
    window.alert(`Error: ${err.name}`)
  }
}

function handleSlackConnectionStatusRes (connected) {
  handleSlackConnectionStatusUpdate(connected)
}

async function handleSlackConnectionOpened (message) {
  try {
    handleSlackConnectionStatusUpdate(true)
    let element = $(`#restartSlackIntegrationAlert`)
    let html = `<div class="alert alert-info mt-3"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Heads-up!</strong> Slack messaging was connected.<br><span class="small">Message: ${message}</span></div>`
    await announcementAnimationSuccess(element, html)
    element.promise().done(() => { enableRestartSlackBtn() })
  } catch (err) {
    window.alert(`Error: ${err.name}`)
  }
}

function handleSlackRestartFailed (message) {
  handleSlackConnectionStatusUpdate(false)
  let element = $(`#restartSlackIntegrationAlert`)
  let html = `<div class="alert alert-danger mt-3"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Error!</strong> Slack messaging was not connected.<br><span class="small">Message: ${message}</span></div>`
  announcementAnimationError(element, html)
  element.promise().done(() => { enableRestartSlackBtn() })
}

async function handleSlackDisconnection (message) {
  try {
    await handleSlackConnectionStatusUpdate(false)
    let element = $(`#stopSlackIntegrationAlert`)
    let html = `<div class="alert alert-warning mt-3"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Warning!</strong> Slack messaging was disconnected.<br><span class="small">Message: ${message}</span></div>`
    await announcementAnimationSuccess(element, html)
    element.promise().done(() => { enableStopSlackBtn() })
  } catch (err) {
    window.alert(`Error: ${err.name}`)
  }
}

function handleSlackNotifyRes (data) {
  let element = $(`#currentSettingsNotify`)
  if (
    data !== undefined && data.notify !== undefined &&
    data.notifyType !== undefined
  ) {
    element.addClass(`text-success`)
    element.text(`${data.notifyType} ${data.notify}`)
  } else {
    element.addClass(`text-danger`)
    element.text(`a black hole`)
  }
}

function handleSlackTokenRes (token) {
  $(`#slackToken`).val(token)
}

function handleMotionConfFileRes (loaded) {
  let element = $(`#motionConfFileStatus`)
  if (loaded) {
    element.removeClass(`text-danger`)
    element.addClass(`text-success`)
    element.text(`loaded`)
  } else {
    element.removeClass(`text-success`)
    element.addClass(`text-danger`)
    element.text(`not found`)
  }
}

function handleMotionEyeConfFileRes (loaded) {
  let element = $(`#motionEyeConfFileStatus`)
  if (loaded) {
    element.removeClass(`text-danger`)
    element.addClass(`text-success`)
    element.text(`loaded`)
  } else {
    element.removeClass(`text-success`)
    element.addClass(`text-danger`)
    element.text(`not found`)
  }
}

function handleMotionThreadFileRes (count) {
  let element = $(`#motionThreadFileCount`)
  if (count > 0) {
    element.removeClass(`text-danger`)
    element.addClass(`text-success`)
    element.text(count)
  } else {
    element.removeClass(`text-success`)
    element.addClass(`text-danger`)
    element.text(`not found`)
  }
}

/**
 * Remove the has-success class from inputs on focus events.
 */
function removeSuccessOnFocus () {
  $(`#slackToken`).focus(() => $(`#slackTokenInputGroup`).removeClass(`has-success`))
  $(`#defaultChannelSelect`).focus(() => $(`#inputChannels`).removeClass(`has-success`))
  $(`#defaultGroupSelect`).focus(() => $(`#inputGroups`).removeClass(`has-success`))
  $(`#defaultUserSelect`).focus(() => $(`#inputUsers`).removeClass(`has-success`))
}

// https://getbootstrap.com/docs/4.0/components/popovers/
$(() => { $(`[data-toggle="popover"]`).popover() })

/**
 * Get everything ready to use.
 */
function main () {
  try {
    enableDatastoreShowBtn()
    enableDatastoreHideBtn()
    enableRestartSlackBtn()
    enableStopSlackBtn()
    enableSaveTokenBtn()
    enableSaveNotifyChannelBtn()
    enableSaveNotifyGroupBtn()
    enableSaveNotifyUserBtn()
    enableNotifyTypeChannelRadioBtn()
    enableNotifyTypeGroupRadioBtn()
    enableNotifyTypeUserRadioBtn()
    removeSuccessOnFocus()
    socket.emit(`slackConnectionStatusReq`)
    socket.emit(`slackTokenReq`)
    socket.emit(`slackNotifyReq`)
    socket.emit(`motionConfFileReq`)
    socket.emit(`motionEyeConfFileReq`)
    socket.emit(`motionThreadFileReq`)
  } catch (err) {
    window.alert(`Error: ${err.message}`)
  }
}

main()
