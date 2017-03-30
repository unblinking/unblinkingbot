#!/usr/bin/env node

/**
 * The application end points (routes) for the unblinking bot.
 * @namespace routes
 * @public
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * Invoke strict mode for the entire script.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode Strict mode}
 */
"use strict";

/**
 * @public
 * @namespace router
 * @memberof routes
 * @param {object} app - The Express application instance.
 * @see {@link https://expressjs.com/en/guide/routing.html Express routing}
 * @see {@link http://expressjs.com/en/api.html Express API}
 */
const router = function (app, bundle) {

  app.get('/', function (req, res) {
    let params = {};
    params.title = 'Dashboard';
    if (bundle.rtm !== null && bundle.rtm.connected) {
      params.rtmConnected = true;
    }
    bundle.db.get(['unblinkingSlack', 'history'], function (err, history) {
      if (err) {
        console.log(`ERROR: ${err}`);
      } else {
        params.history = JSON.stringify(history, undefined, 2);
        res.render('index', params);
      }
    });
  });

  app.get('/settings', function (req, res) {
    let settingsBundle = {};
    settingsBundle.title = 'Settings';
    if (bundle.rtm !== null && bundle.rtm.connected) {
      settingsBundle.rtmConnected = true;
    }
    bundle.db.get(['unblinkingSlack', 'credentials', 'token'], function (err, token) {
      if (err) {
        console.log(`ERROR: ${err}`);
      } else {
        if (typeof token === 'string' || token instanceof String) {
          settingsBundle.slackToken = token;
        } else {
          settingsBundle.slackToken = undefined;
        }
        bundle.db.get(['unblinkingSlack', 'credentials', 'defaultNotify'], function (err, defaultNotify) {
          if (err) {
            console.log(`ERROR: ${err}`);
          } else {
            if (typeof defaultNotify === 'string' || defaultNotify instanceof String) {
              settingsBundle.defaultNotify = defaultNotify;
            } else {
              settingsBundle.defaultNotify = undefined;
            }
            bundle.db.get(['unblinkingSlack', 'credentials', 'defaultNotifyType'], function (err, defaultNotifyType) {
              if (err) {
                console.log(`ERROR: ${err}`);
              } else {
                if (typeof defaultNotifyType === 'string' || defaultNotifyType instanceof String) {
                  settingsBundle.defaultNotifyType = defaultNotifyType;
                } else {
                  settingsBundle.defaultNotifyType = undefined;
                }
                res.render('settings', settingsBundle);
              }
            });
          }
        });
      }
    });
  });

  app.get('/datastore', function (req, res) {
    res.render('datastore', {
      title: 'Data Store'
    });
  });

};

/**
 * Assign our appRouter object to module.exports.
 * @see {@link https://nodejs.org/api/modules.html#modules_the_module_object Nodejs modules: The module object}
 * @see {@link https://nodejs.org/api/modules.html#modules_module_exports Nodejs modules: module exports}
 */
module.exports = router;