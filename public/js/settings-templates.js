/**
 * HTML templates for the unblinkingbot frontend settings page.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://getbootstrap.com/components/#alerts Bootstrap Alerts}
 */

/* eslint-env jquery */

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
