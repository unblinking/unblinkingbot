/**
 * The unblinking bot.
 * HTML templates for the unblinkingbot web UI datastore page.
 * @namespace datastore-templates.js
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 * @see {@link http://getbootstrap.com/components/#alerts Bootstrap Alerts}
 */

/* exported renderHtmlBtnDatastoreRefresh */
/* exported renderHtmlBtnDatastoreRefreshing */
/* exported renderHtmlBtnDatastoreHide */
/* exported renderHtmlBtnDatastoreHiding */


/**
 * Render the HTML for the Datastore Refresh button.
 */
function renderHtmlBtnDatastoreRefresh () {
  Promise.resolve(`Refresh`)
}

/**
 * Render the HTML for the Datastore Refresh button during a refresh.
 */
function renderHtmlBtnDatastoreRefreshing () {
  return new Promise.resolve(`<div class="loader float-left"></div> &nbsp; Refreshing`)
}

/**
 * Render the HTML for the Datastore Hide button.
 */
function renderHtmlBtnDatastoreHide () {
  return new Promise.resolve(`Hide`)
}

/**
 * Render the HTML for the Datastore Hide button during a hide.
 */
function renderHtmlBtnDatastoreHiding () {
  return new Promise.resolve(`<div class="loader float-left"></div> &nbsp; Hiding`)
}
