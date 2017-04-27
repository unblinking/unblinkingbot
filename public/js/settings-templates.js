/**
 * The unblinking bot.
 * HTML templates for the unblinkingbot web UI settings page.
 * @namespace settings-templates.js
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 * @see {@link http://getbootstrap.com/components/#alerts Bootstrap Alerts}
 */

/**
 * Render the HTML for a Bootstrap alert that Slack is connected.
 * @param {String} message A message from the Slack RTM Connection event.
 */
function renderHtmlAlertSlackConnection(message) {
  return new P.resolve({
    element: $("#restartSlackIntegrationAlert"),
    html: `<div class="alert alert-info"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Heads-up!</strong> Slack integration was started.<br><span class="small">Message: ${message}</span></div>`
  });
}

/**
 * Render the HTML for a Bootstrap alert that Slack is disconnected.
 * @param {String} message A message from the Slack RTM Disconnection event.
 */
function renderHtmlAlertSlackDisconnection(message) {
  return new P.resolve({
    element: $("#stopSlackIntegrationAlert"),
    html: `<div class="alert alert-warning"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Warning!</strong> Slack integration was stopped.<br><span class="small">Message: ${message}</span></div>`
  });
}

/**
 * 
 */
function renderHtmlAlertTokenSavedSuccess() {
  return new P.resolve({
    element: $("#saveSlackTokenAlert"),
    html: `<div class="alert alert-success"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Success!</strong> Slack token saved successfully. Slack integration is being restarted to use the new token.</div>`
  });
}

/**
 * 
 */
function renderHtmlAlertTokenSavedError(err) {
  return new P.resolve({
    element: $("#saveSlackTokenAlert"),
    html: `<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Error!</strong> There was an error. Slack token was not saved. &nbsp; <span class="badge badge-warning small"><a data-toggle="collapse" data-target="#errorDetails" aria-expanded="false" aria-controls="errorDetails">Details</a></span><br><br><div class="container-fluid rounded p-3 collapse" id="errorDetails" style="background-color:#000; overflow:hidden"> ${err} </div></div>`
  });
}

function renderHtmlAlertNotifySavedSuccess() {
  return new P.resolve({
    element: $("#saveSlackNotifyAlert"),
    html: `<div class="alert alert-success"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Success!</strong> Default notification recipient saved successfully.</div>`
  });
}

function renderHtmlAlertNotifySavedError(err) {
  return new P.resolve({
    element: $("#saveSlackNotifyAlert"),
    html: `<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Error!</strong> There was an error. Default notification recipient was not saved. &nbsp; <span class="badge badge-warning small"><a data-toggle="collapse" data-target="#errorDetails" aria-expanded="false" aria-controls="errorDetails">Details</a></span><br><br><div class="container-fluid rounded p-3 collapse" id="errorDetails" style="background-color:#000; overflow:hidden"> ${err} </div></div>`
  });
}

/**
 * Render the HTML for the Change Settings button.
 */
function renderHtmlBtnChangeSettings() {
  return new P.resolve(`Change Settings`);
}

/**
 * Render the HTML for the Slack restart button when it is available to click.
 */
function renderHtmlBtnSlackRestart() {
  return new P.resolve(`Restart`);
}

/**
 * Render the HTML for the Slack restart button when it is unavailable during restart.
 */
function renderHtmlBtnSlackRestarting() {
  return new P.resolve(`<div class="loader float-left"></div> &nbsp; Restarting`);
}

/**
 * Render the HTML for the Slack stop button when it is available to click.
 */
function renderHtmlBtnSlackStop() {
  return new P.resolve(`Stop`);
}

/**
 * Render the HTML for the Slack stop button when it is unavailable during stop.
 */
function renderHtmlBtnSlackStopping() {
  return new P.resolve(`<div class="loader float-left"></div> &nbsp; Stopping`);
}

/**
 * Render the HTML for the Slack save token button when it is available to click.
 */
function renderHtmlBtnSaveToken() {
  return new P.resolve(`Save`);
}

/**
 * Render the HTML for the Slack save token button when it is unavailable during save.
 */
function renderHtmlBtnSavingToken() {
  return new P.resolve(`<div class="loader float-left"></div>`);
}

/**
 * Render the HTML for the Slack save notify button when it is available to click.
 */
function renderHtmlBtnSaveNotify() {
  return new P.resolve(`Save`);
}

function renderHtmlBtnSavingNotify() {
  return new P.resolve(`<div class="loader float-left"></div>`);
}
