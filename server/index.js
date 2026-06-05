const net = require('node:net');

const clients = [];

const server = net.createServer((socket) => {
    // Inicializamos propriedades únicas no objeto socket desta conexão
    socket.metadata = { username: '', group: '' };

    socket.on('data', (data) => {
        try {
            const message = JSON.parse(data.toString());

            if (message.type === 'JOIN_GROUP') {
                // Atribuímos ao objeto específico desta conexão (socket.metadata)
                socket.metadata.username = message.payload.name;
                socket.metadata.group = message.payload.group;

                // Adicionamos ao array apenas se ainda não estiver lá
                if (!clients.includes(socket)) {
                    clients.push(socket);
                }
                console.log(`Usuário ${socket.metadata.username} entrou no grupo ${socket.metadata.group}`);
            }

            else if (message.type === 'SEND_MESSAGE') {
                const { group, text } = message.payload;

                // BROADCAST: Filtra pelo grupo definido no MÉTADATA do socket
                clients.forEach(client => {
                    if (client.metadata.group === group && client.writable) {
                        client.write(JSON.stringify({
                            username: socket.metadata.username,
                            text: text
                        }));
                    }
                });
            }
        } catch (e) {
            console.log("Erro no processamento:", e);
        }
    });

    socket.on('end', () => {
        const index = clients.indexOf(socket);
        if (index > -1) clients.splice(index, 1);
    });
});

server.listen(4000, '127.0.0.1');