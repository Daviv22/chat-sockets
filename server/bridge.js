const WebSocket = require('ws');
const net = require('node:net');

const wss = new WebSocket.Server({ port: 8080 });
const tcpClient = new net.Socket();

// Conecta a Bridge ao nosso servidor TCP
tcpClient.connect(4000, '127.0.0.1');

wss.on('connection', (ws) => {
    // Quando o React enviar algo, a bridge repassa para o servidor TCP
    ws.on('message', (message) => {
        tcpClient.write(message);
    });

    // Quando o TCP responder, a bridge repassa para o React
    tcpClient.on('data', (data) => {
        ws.send(data.toString());
    });
});