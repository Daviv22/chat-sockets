const WebSocket = require('ws');
const net = require('node:net');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {

    // Cada cliente WebSocket ganha sua própria conexão TCP dedicada.
    // Isso garante que o servidor TCP trate cada aba/página como um
    // usuário independente, com seu próprio socket.metadata.
    const tcpClient = new net.Socket();
    tcpClient.connect(4000, '127.0.0.1');

    // Quando o React enviar algo, a bridge repassa para o servidor TCP
    ws.on('message', (message) => {
        tcpClient.write(message);
    });

    // Respostas do servidor TCP -> apenas este cliente WebSocket
    tcpClient.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data.toString());
        }
    });

    // Limpeza: se o WebSocket fechar, encerra o TCP correspondente
    ws.on('close', () => {
        tcpClient.destroy();
    });

    // Limpeza: se o TCP fechar, encerra o WebSocket correspondente
    tcpClient.on('close', () => {
        ws.close();
    });

    tcpClient.on('error', (err) => {
        console.error('Erro TCP:', err.message);
        ws.close();
    });
});

console.log('Bridge WebSocket rodando na porta 8080');