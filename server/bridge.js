const WebSocket = require('ws');
const net = require('node:net');

// Usa a porta do Render ou a 8080 se rodar localmente
const PORTA_WEB = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORTA_WEB });

wss.on('connection', (ws) => {

    // Cada cliente WebSocket ganha sua própria conexão TCP dedicada.
    const tcpClient = new net.Socket();
    
    // Como o index.js vai rodar na mesma máquina pelo start.js, mantém o 127.0.0.1:4000
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
        console.error('Erro TCP interno da bridge:', err.message);
        ws.close();
    });
});

console.log(`WebSocket rodando na porta ${PORTA_WEB}`);