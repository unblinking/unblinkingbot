'use strict'

/**
 * ublinkingBot frontend settings page scripts.
 * @author {@link https://github.com/jmg1138 jmg1138}
 */

/* eslint-env jquery */
/* global io */

var socket = io.connect()

/**
 * Alert error animation sequence.
 * First, fade to zero opacity and slide up out of view just in case it is
 * visible. Next, set html content, slide down, and fade to full opacity. Leave
 * the error alert on the screen for the user to manually dismiss.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {String} html HTML to set as the content of each matched element.
 */
function alertAnimationError (element, html) {
  return new Promise(resolve => fade(element, 0, 0)
    .then(() => upSlide(element, 0))
    .then(() => htmlSet(element, html))
    .then(() => downSlide(element, 500))
    .then(() => fade(element, 500, 1))
    .then(() => resolve()))
}

/**
 * Alert success animation sequence.
 * First, fade to zero opacity and slide up out of view just in case it is
 * visible. Next, set html content, slide down, fade to full opacity, and sleep
 * while the alert is visible. Last, fade to zero opacity and slide up out of
 * view.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {String} html HTML to set as the content of each matched element.
 */
async function alertAnimationSuccess (element, html) {
  try {
    await fade(element, 0, 0)
    await upSlide(element, 0)
    await htmlSet(element, html)
    await downSlide(element, 500)
    await fade(element, 500, 1)
    await countTo(5)
    await fade(element, 500, 0)
    await upSlide(element, 500)
    return
  } catch (err) {
    console.log(err)
  }
}

/**
 * Show the Slack RTM Connection alert.
 * @param {String} message A message from the Slack RTM Connection event.
 */
async function alertSlackConnection (message) {
  try {
    let element = $('#restartSlackIntegrationAlert')
    let html = `<div class="alert alert-info mt-3"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Heads-up!</strong> Slack integration was started.<br><span class="small">Message: ${message}</span></div>`
    await alertAnimationSuccess(element, html)
    return
  } catch (err) {
    console.log(err)
  }


  return new Promise(resolve => renderHtmlAlertSlackConnection(message)
    .then(alert => alertAnimationSuccess(alert.element, alert.html))
    .then(() => resolve()))
}

/**
 * Show the Slack RTM Disconnection alert.
 * @param {String} message A message from the Slack RTM Disconnection event.
 */
async function alertSlackDisconnection (message) {
  try {
    let element = $('#stopSlackIntegrationAlert')
    let html = `<div class="alert alert-warning mt-3"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Warning!</strong> Slack integration was stopped.<br><span class="small">Message: ${message}</span></div>`
    await alertAnimationSuccess(element, html)
    return
  } catch (err) {
    console.log(err)
  }
}

/**
 * Count to a number of seconds and then continue.
 * @param {number} seconds How many seconds to count to.
 */
function countTo (seconds) {
  return new Promise(resolve => setTimeout(resolve, (seconds * 1000)))
}

/**
 * Animated slide-down to hide the matched elements.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {Number} speed Duration of the animation in milliseconds.
 */
function downSlide (element, speed) {
  return new Promise(resolve => element.show(speed, resolve))
}

/**
 * Attach a handler to the click event for the restartSlack button element.
 * When clicked; Replace the button html with a loader animation and a
 * restarting message, and then emit a slackRestartReq event via Socket.io.
 */
function enableRestartSlackBtn () {
  return new Promise(resolve => {
    $('#startSlack').off('click') // Start with no click handler, prevent duplicates.
    renderHtmlBtnSlackRestart().then(html => $('#startSlack').html(html))
    $('#startSlack').one('click', () => { // Add new click handler.
      $('#startSlack').off('click') // When clicked, remove handler.
      renderHtmlBtnSlackRestarting().then(html => $('#startSlack').html(html))
      socket.emit('slackRestartReq')
    })
    resolve()
  })
}

/**
 * Attach a handler to the click event for the stopSlack button element.
 * When clicked; Replace the button html with a loader animation and a
 * stopping message, and then emit a slackStopReq event via Socket.io.
 */
function enableStopSlackBtn () {
  return new Promise(resolve => {
    let btn = $('#stopSlack')
    btn.off('click') // Remove previous handler to start with none.
    renderHtmlBtnSlackStop().then(html => btn.html(html))
    btn.one('click', () => { // Add new handler.
      btn.off('click') // When clicked, remove handler.
      renderHtmlBtnSlackStopping().then(html => btn.html(html))
      socket.emit('slackStopReq')
    })
    resolve()
  })
}

/**
 * Attach a handler to the click event for the saveToken button element.
 * When clicked; Replace the button html with a loader animation, and then emit
 * a saveSlackTokenReq event via Socket.io containing the value from the
 * slackToken input element.
 */
function enableSaveTokenBtn () {
  return new Promise(resolve => {
    let btn = $('#saveToken')
    btn.off('click') // Remove previous handler to start with none.
    renderHtmlBtnSaveToken().then(html => btn.html(html))
    btn.one('click', () => { // Add new handler.
      btn.off('click') // When clicked, remove handler.
      renderHtmlBtnSavingToken().then(html => btn.html(html))
      socket.emit('saveSlackTokenReq', $('input[id=slackToken]').val())
    })
    resolve()
  })
}

/**
 *
 */
function enableSaveNotifyBtn () {
  return new Promise(resolve => {
    let btnC = $('#saveSlackDefaultNotifyChannel')
    let btnG = $('#saveSlackDefaultNotifyGroup')
    let btnU = $('#saveSlackDefaultNotifyUser')
    btnC.off('click') // Remove previous handler to start with none.
    btnG.off('click') // Remove previous handler to start with none.
    btnU.off('click') // Remove previous handler to start with none.
    renderHtmlBtnSaveNotify().then(html => {
      btnC.html(html)
      btnG.html(html)
      btnU.html(html)
    })
    btnC.one('click', () => { // Add new handler.
      btnC.off('click') // When clicked, remove handler.
      renderHtmlBtnSavingNotify().then(html => btnC.html(html))
      socket.emit(
        'saveSlackNotifyReq',
        $('select[id=defaultChannelSelect]').val(),
        'channel'
      )
    })
    btnG.one('click', () => { // Add new handler.
      btnG.off('click') // When clicked, remove handler.
      renderHtmlBtnSavingNotify().then(html => btnG.html(html))
      socket.emit(
        'saveSlackNotifyReq',
        $('select[id=defaultGroupSelect]').val(),
        'group'
      )
    })
    btnU.one('click', () => { // Add new handler.
      btnU.off('click') // When clicked, remove handler.
      renderHtmlBtnSavingNotify().then(html => btnU.html(html))
      socket.emit(
        'saveSlackNotifyReq',
        $('select[id=defaultUserSelect]').val(),
        'user'
      )
    })
    resolve()
  })
}

/**
 * Remove the has-success class from inputs on focus events.
 */
function removeSuccessOnFocus () {
  return new Promise(resolve => {
    $('#slackToken').focus(() => $('#slackTokenInputGroup').removeClass('has-success'))
    $('#defaultChannelSelect').focus(() => $('#inputChannels').removeClass('has-success'))
    $('#defaultGroupSelect').focus(() => $('#inputGroups').removeClass('has-success'))
    $('#defaultUserSelect').focus(() => $('#inputUsers').removeClass('has-success'))
    resolve()
  })
}

/**
 *
 */
function enableNotifyTypeRadioBtn () {
  return new Promise(resolve => {
    $('#radioChannel').off('click') // Remove previous handler to start with none.
    $('#radioChannel').one('click', () => { // Add new handler.
      $('#radioChannel').off('click') // When clicked, remove handler.
      hideDefaultNotifySelectors() // Start with all options hidden and an empty select element.
      $('#defaultChannelSelect')[0].options.length = 0
      $('#progressDefaultNotifications').removeClass('hidden-xs-up') // Show progress bar.
      socket.emit('channelsReq')
    })
    $('#radioGroup').off('click') // Remove previous handler to start with none.
    $('#radioGroup').one('click', () => { // Add new handler.
      $('#radioGroup').off('click') // When clicked, remove handler.
      hideDefaultNotifySelectors() // Start with all options hidden and an empty select element.
      $('#defaultGroupSelect')[0].options.length = 0
      $('#progressDefaultNotifications').removeClass('hidden-xs-up') // Show progress bar.
      socket.emit('readSlackGroupsReq')
    })
    $('#radioUser').off('click') // Remove previous handler to start with none.
    $('#radioUser').one('click', () => { // Add new handler.
      $('#radioUser').off('click') // When clicked, remove handler.
      hideDefaultNotifySelectors() // Start with all options hidden and an empty select element.
      $('#defaultUserSelect')[0].options.length = 0
      $('#progressDefaultNotifications').removeClass('hidden-xs-up') // Show progress bar.
      socket.emit('readSlackUsersReq')
    })
    resolve()
  })
}

function enableSaveMotionUrlBtn () {
  return new Promise(resolve => {
    let btn = $('#saveMotionUrl')
    btn.off('click') // Remove previous handler to start with none.
    renderHtmlBtnMotionUrlSave().then(html => btn.html(html))
    btn.one('click', () => { // Add new handler.
      btn.off('click') // When clicked, remove handler.
      renderHtmlBtnMotionUrlSaving().then(html => btn.html(html))
      socket.emit('saveMotionUrlReq', {
        'name': $('input[id=motionNickname]').val(),
        'url': $('input[id=motionSnapshotUrl]').val()
      })
    })
    resolve()
  })
}

/**
 * Animated change in opacity of the matched elements.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {Number} speed Duration of the animation in milliseconds.
 * @param {Number} opacity Target opacity, a number between 0 and 1.
 */
function fade (element, speed, opacity) {
  return new Promise(resolve => element.fadeTo(speed, opacity, resolve))
}

/**
 *
 * @param {*} err
 */
function handleSaveNotifyError (err) {
  return new Promise(resolve => {
    $('#inputChannels').addClass('has-error')
    $('#inputGroups').addClass('has-error')
    $('#inputUsers').addClass('has-error')
    resolve()
  })
}

/**
 *
 * @param {*} notify
 * @param {*} notifyType
 */
function handleSaveNotifySuccess (notify, notifyType) {
  return new Promise(resolve => {
    $('#currentSettingsNotify').html(notifyType + ' ' + notify)
    if (notifyType === 'channel') $('#inputChannels').addClass('has-success')
    if (notifyType === 'group') $('#inputGroups').addClass('has-success')
    if (notifyType === 'user') $('#inputUsers').addClass('has-success')
    resolve()
  })
}

/**
 *
 * @param {*} err
 */
function handleSaveTokenError (err) {
  return new Promise(resolve => {
    ($('#slackTokenInputGroup').addClass('has-error'))
  })
}

/**
 *
 * @param {*} token
 */
function handleSaveTokenSuccess (token) {
  return new Promise(resolve => {
    $('#slackTokenInputGroup').addClass('has-success')
    socket.emit('slackRestartReq')
    resolve()
  })
}

function handleSaveMotionUrlSuccess (object) {
  return new Promise(resolve => {
    $('#motionSnapshotUrlList').append("<a href='" + object.url + "'>" + object.name + '</a><br>')
    $('#motionUrlInputGroup').addClass('has-success')
    resolve()
  })
}

/**
 * Hide all drop down selectors for default notifications
 */
function hideDefaultNotifySelectors () {
  return new Promise(resolve => {
    $('#inputChannels').addClass('hidden-xs-up')
    $('#inputGroups').addClass('hidden-xs-up')
    $('#inputUsers').addClass('hidden-xs-up')
    resolve()
  })
}

/**
 * Set the HTML contents of matched elements.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {String} html HTML string to set as the content of matched elements.
 */
function htmlSet (element, html) {
  return new Promise(resolve => {
    element.html(html)
    resolve()
  })
}

function populateDropDown (element, array, selector) {
  return new Promise(resolve => {
    element.removeClass('hidden-xs-up')
    for (let i = 0; i < array.length; i++) {
      let name = array[i]
      let option = document.createElement('option')
      option.text = name
      selector[0].add(option)
    }
    $('#progressDefaultNotifications').addClass('hidden-xs-up') // Hide progress bar.
    resolve()
  })
}

/**
 *
 */
function motionSnapshotsReq () {
  return new Promise(resolve => {
    socket.emit('motionSnapshotsReq')
    resolve()
  })
}

/**
 * Animated slide-up to hide the matched elements.
 * @param {JQuery} element The JQuery element selector to be manipulated.
 * @param {Number} speed Duration of the animation in milliseconds.
 */
function upSlide (element, speed) {
  return new Promise(resolve => {
    element.hide(speed, resolve)
    resolve()
  })
}

/**
 *
 */
function slackConnectionStatusReq () {
  return new Promise(resolve => {
    socket.emit('slackConnectionStatusReq')
    resolve()
  })
}

/**
 *
 */
function slackTokenReq () {
  return new Promise(resolve => {
    socket.emit('slackTokenReq')
    resolve()
  })
}

/**
 *
 */
function slackNotifyReq () {
  return new Promise(resolve => {
    socket.emit('slackNotifyReq')
    resolve()
  })
}

/**
 * Update the Slack connection status.
 * @param {Boolean} connected True if connected, false if disconnected.
 */
function slackConnectionStatusUpdate (connected) {
  return new Promise(resolve => {
    let element = $('#slackIntegrationStatus')
    if (connected) {
      element.removeClass('text-danger')
      element.html('connected')
      element.addClass('text-success')
    } else if (!connected) {
      element.removeClass('text-success')
      element.html('disconnected')
      element.addClass('text-danger')
    }
    resolve()
  })
}

/**
 *
 */
socket.on('channelsRes', channelNames =>
  enableNotifyTypeRadioBtn()
    .then(() => populateDropDown($('#inputChannels'), channelNames,
      $('#defaultChannelSelect'))))

socket.on('motionSnapshotsRes', text => {
  $('#motionSnapshotUrlList').append(text + '<br>')
})

/**
 *
 */
socket.on('readSlackGroupsRes', groupNames =>
  enableNotifyTypeRadioBtn()
    .then(() => populateDropDown($('#inputGroups'), groupNames,
      $('#defaultGroupSelect'))))

/**
 *
 */
socket.on('readSlackUsersRes', userNames =>
  enableNotifyTypeRadioBtn()
    .then(() => populateDropDown($('#inputUsers'), userNames,
      $('#defaultUserSelect'))))

/**
 * Register the "saveSlackNotifyRes" event handler.
 * Enable the save button, update notify on-screen, and display an alert.
 */
socket.on('saveSlackNotifyRes', (notify, notifyType, success, err) =>
  enableSaveNotifyBtn()
    .then(() => {
      if (success) {
        handleSaveNotifySuccess(notify, notifyType)
          .then(() => renderHtmlAlertNotifySavedSuccess())
          .then(alert => alertAnimationSuccess(alert.element, alert.html))
      }
      if (!success) {
        handleSaveNotifyError(err)
          .then(() => renderHtmlAlertNotifySavedError(err))
          .then(alert => alertAnimationError(alert.element, alert.html))
      }
    }))

/**
 * Register the "saveSlackTokenRes" event handler.
 * Enable the save button, update token on-screen, and display an alert.
 */
socket.on('saveSlackTokenRes', (token, success, err) => {
  enableSaveTokenBtn()
    .then(() => {
      if (success) {
        handleSaveTokenSuccess(token)
          .then(() => renderHtmlAlertTokenSavedSuccess())
          .then(alert => alertAnimationSuccess(alert.element, alert.html))
      }
      if (!success) {
        handleSaveTokenError(err)
          .then(() => renderHtmlAlertTokenSavedError(err))
          .then(alert => alertAnimationError(alert.element, alert.html))
      }
    })
})

/**
 *
 */
socket.on('slackConnectionStatusRes', connected =>
  slackConnectionStatusUpdate(connected))

/**
 * Register the "slackConnectionOpened" event handler.
 * Enable the restart button, update connection status, and display an alert.
 */
socket.on('slackConnectionOpened', message =>
  enableRestartSlackBtn()
    .then(() => slackConnectionStatusUpdate(true))
    .then(() => alertSlackConnection(message)))



/**
 * Register the "slackDisconnection" event handler.
 * Enable the stop button, update connection status, and display an alert.
 */
socket.on('slackDisconnection', message => handleSlackDisconnection(message))

async function handleSlackDisconnection (message) {
  await enableStopSlackBtn()
  await slackConnectionStatusUpdate(false)
  await alertSlackDisconnection(message)
}

/**
   *
   */
socket.on('slackNotifyRes', data =>
  $('#currentSettingsNotify').html(data.notifyType + ' ' + data.notify))

/**
   *
   */
socket.on('slackTokenRes', token => {
  $('#slackToken').val(token)
})

/**
 * TODO: render and show alert too
 */
socket.on('saveMotionUrlRes', (object, success, err) => {
  enableSaveMotionUrlBtn()
    .then(() => {
      if (success) handleSaveMotionUrlSuccess(object)
      if (!success) handleSaveMotionUrlError(err)
    })
})

/**
 * Initialize all tooltips
 * https://v4-alpha.getbootstrap.com/components/tooltips/
 */
$(() => $('[data-toggle="tooltip"]').tooltip())


/**
 * Setup the page buttons when this script is loaded.
 */
enableRestartSlackBtn()
  .then(enableStopSlackBtn())
  .then(enableSaveTokenBtn())
  .then(enableSaveNotifyBtn())
  .then(removeSuccessOnFocus())
  .then(enableNotifyTypeRadioBtn())
  .then(enableSaveMotionUrlBtn())

/**
 * Request the current Slack details.
 */
slackConnectionStatusReq()
  .then(slackTokenReq())
  .then(slackNotifyReq())

/**
 * Request the current motionEye details.
 */
motionSnapshotsReq()