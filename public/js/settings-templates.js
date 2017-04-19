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
    html: `<div class=\"alert alert-warning\"><a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">&times;</a><strong>Warning!</strong> Slack integration was stopped.<br><span class=\"small\">Message: ${message}</span></div>`
  });
}

function renderHtmlBtnSlackRestart() {
  return new P.resolve(`<span class="glyphicon glyphicon-refresh"></span> Restart Slack Integration`);
}

function renderHtmlBtnSlackRestarting() {
  return new P.resolve(`<div class=\"loader pull-left\"></div> &nbsp; Restarting Slack Integration`);
}