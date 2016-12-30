var socket = io.connect();

socket.on('ipRefreshRes', function(data) {
    document.getElementById("ipaddresspanelbody").innerHTML = data;
});