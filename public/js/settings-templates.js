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