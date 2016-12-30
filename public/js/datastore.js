var socket = io.connect();

$("#datastorerefreshbutton").click(function() {
    socket.emit('readFullDbReq');
})
socket.on('readFullDbRes', function(bundle) {
    document.getElementById("datastorepanelbody").innerHTML = JSON.stringify(bundle, undefined, 2);
});
$("#datastorehidebutton").click(function() {
    document.getElementById("datastorepanelbody").innerHTML = '';
})