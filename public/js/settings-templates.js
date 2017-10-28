/**
 * The unblinking bot.
 * HTML templates for the unblinkingbot web UI settings page.
 * @namespace settings-templates.js
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 * @see {@link http://getbootstrap.com/components/#alerts Bootstrap Alerts}
 */

/* eslint-env jquery */

/**
 * Render the HTML for a Bootstrap alert that Slack is connected.
 * @param {String} message A message from the Slack RTM Connection event.
 */
function renderHtmlAlertSlackConnection (message) {
  return new Promise(resolve => {
    resolve({
      element: $('#restartSlackIntegrationAlert'),
      html: `<div class="alert alert-info mt-3"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Heads-up!</strong> Slack integration was started.<br><span class="small">Message: ${message}</span></div>`
    })
  })
}

/**
 * Render the HTML for a Bootstrap alert that Slack is disconnected.
 * @param {String} message A message from the Slack RTM Disconnection event.
 */
function renderHtmlAlertSlackDisconnection (message) {
  return new Promise(resolve => {
    resolve({
      element: $('#stopSlackIntegrationAlert'),
      html: `<div class="alert alert-warning mt-3"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Warning!</strong> Slack integration was stopped.<br><span class="small">Message: ${message}</span></div>`
    })
  })
}

/**
 *
 */
function renderHtmlAlertTokenSavedSuccess () {
  return new Promise(resolve => {
    resolve({
      element: $('#saveSlackTokenAlert'),
      html: `<div class="alert alert-success"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Success!</strong> Slack token saved successfully. Slack integration is being restarted to use the new token.</div>`
    })
  })
}

/**
 *
 */
function renderHtmlAlertTokenSavedError (err) {
  return new Promise(resolve => {
    resolve({
      element: $('#saveSlackTokenAlert'),
      html: `<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Error!</strong> There was an error. Slack token was not saved. &nbsp; <span class="badge badge-warning small"><a data-toggle="collapse" data-target="#errorDetails" aria-expanded="false" aria-controls="errorDetails">Details</a></span><br><br><div class="container-fluid rounded p-3 collapse" id="errorDetails" style="background-color:#000; overflow:hidden"> ${err} </div></div>`})
  })
}

function renderHtmlAlertNotifySavedSuccess () {
  return new Promise(resolve => {
    resolve({
      element: $('#saveSlackNotifyAlert'),
      html: `<div class="alert alert-success"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Success!</strong> Default notification recipient saved successfully.</div>`
    })
    
  })
}

function renderHtmlAlertNotifySavedError (err) {
  return new Promise(resolve => {
    resolve({
      element: $('#saveSlackNotifyAlert'),
      html: `<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Error!</strong> There was an error. Default notification recipient was not saved. &nbsp; <span class="badge badge-warning small"><a data-toggle="collapse" data-target="#errorDetails" aria-expanded="false" aria-controls="errorDetails">Details</a></span><br><br><div class="container-fluid rounded p-3 collapse" id="errorDetails" style="background-color:#000; overflow:hidden"> ${err} </div></div>`
    })
    
  })
}

/**
 * Render the HTML for the Slack restart button when it is available to click.
 */
function renderHtmlBtnSlackRestart () {
  return new Promise(resolve => {
    resolve(`Restart Slack RTM Client`)
  })
}

/**
 * Render the HTML for the Slack restart button when it is unavailable during restart.
 */
function renderHtmlBtnSlackRestarting () {
  return new Promise(resolve => {
    resolve(`<div class="loader float-left"></div> &nbsp; Restarting Slack RTM Client`)
  })
}

/**
 * Render the HTML for the Slack stop button when it is available to click.
 */
function renderHtmlBtnSlackStop () {
  return new Promise(resolve => {
    resolve(`Stop Slack RTM Client`)
  })
}

/**
 * Render the HTML for the Slack stop button when it is unavailable during stop.
 */
function renderHtmlBtnSlackStopping () {
  return new Promise(resolve => {
    resolve(`<div class="loader float-left"></div> &nbsp; Stopping Slack RTM Client`)
  })
}

/**
 * Render the HTML for the Slack save token button when it is available to click.
 */
function renderHtmlBtnSaveToken () {
  return new Promise(resolve => {
    resolve(`Save`)
  })
}

/**
 * Render the HTML for the Slack save token button when it is unavailable during save.
 */
function renderHtmlBtnSavingToken () {
  return new Promise(resolve => {
    resolve(`<div class="loader float-left"></div>`)
  })
}

/**
 * Render the HTML for the Slack save notify button when it is available to click.
 */
function renderHtmlBtnSaveNotify () {
  return new Promise(resolve => {
    resolve(`Save`)
  })
}

function renderHtmlBtnSavingNotify () {
  return new Promise(resolve => {
    resolve(`<div class="loader float-left"></div>`)
  })
}

/**
 * Render the HTML for the Slack save token button when it is available to click.
 */
function renderHtmlBtnMotionUrlSave () {
  return new Promise(resolve => {
    resolve(`Save`)
  })
}

/**
 * Render the HTML for the Slack save token button when it is unavailable during save.
 */
function renderHtmlBtnMotionUrlSaving () {
  return new Promise(resolve => {
    resolve(`<div class="loader float-left"></div>`)
  })
}
