var socket = io.connect();

socket.on('reconnect', function(bundle) {
    location.reload();
});

$("#restartbutton").click(function() {
    // Disable the restart dropdown menu and show a restarting message.
    document.getElementById("restartdropdown").disabled = true;
    document.getElementById("restartdropdown").innerHTML = '<div class=\"loader pull-left\"></div> &nbsp; Restarting';
    // Emit a restart request
    socket.emit('restartReq');
});