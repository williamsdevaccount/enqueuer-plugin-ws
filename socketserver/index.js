const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log('socket server has a connnected client');
    ws.on('message', function incoming(data) {
        console.log('recieved message broadcasting to all clients');
        // Broadcast to everyone else.
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });
});