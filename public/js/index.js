/**
 * unblinkingBot front-end landing page (index.html)
 * @author {@link https://github.com/jmg1138 jmg1138}
 */

/* eslint-env jquery */
/* global io */

var socket = io.connect()

socket.on('slacktivity', text => {
  $('#activityCard').append(`${text}<br>`)
})

socket.emit('dashRecentActivityReq')
