const net = require('node:net');

const clients = [];

const server = net.createServer((socket) => {
    // Inicializamos propriedades únicas no objeto socket desta conexão
    socket.metadata = { username: '', groups: [] };

    socket.on('data', (data) => {
        try {
            const message = JSON.parse(data.toString());

            if (message.type === 'REGISTER') {
                socket.metadata.username = message.payload.name;

                if (!clients.includes(socket)) {
                    clients.push(socket);
                }
                console.log(`Usuário ${socket.metadata.username} conectou`);
            }

            else if (message.type === 'JOIN_GROUP') {

                const { group } = message.payload;

                if (!socket.metadata.groups.includes(group)) {
                    socket.metadata.groups.push(group);
                }
                console.log(`Usuário ${socket.metadata.username} entrou no grupo ${ group }`);
            }

            else if (message.type === 'SEND_MESSAGE') {
                const { group, text } = message.payload;

                // BROADCAST: Filtra pelo grupo definido no MÉTADATA do socket
                clients.forEach(client => {
                    if (client.metadata.groups.includes(group) && client.writable) {
                        client.write(JSON.stringify({
                            type: 'GROUP_MESSAGE',
                            group: group,
                            username: socket.metadata.username,
                            text: text
                        }));
                    }
                });
            }

            else if (message.type === 'DIRECT_MESSAGE') {
                const { to, text } = message.payload;
                const from = socket.metadata.username;

                // Encontra o destinatário pelo nome
                const recipient = clients.find(c => c.metadata.username === to);

                if (recipient && recipient.writable) {
                    // Entrega ao destinatário
                    recipient.write(JSON.stringify({
                        type: 'DIRECT_MESSAGE',
                        from: from,
                        text: text
                    }));

                    // Confirma ao remetente (para exibir na própria tela)
                    socket.write(JSON.stringify({
                        type: 'DIRECT_MESSAGE',
                        from: from,
                        to: to,
                        text: text,
                        self: true
                    }));
                } else {
                    // Usuário não encontrado ou desconectado
                    socket.write(JSON.stringify({
                        type: 'ERROR',
                        text: `Usuário "${to} não encontrado ou offline.`
                    }));
                }

                console.log(`DM de ${from} para ${to}: ${text}`);
            }
        } catch (e) {
            console.log("Erro no processamento:", e);
        }
    });

    socket.on('end', () => {
        const index = clients.indexOf(socket);
        if (index > -1) clients.splice(index, 1);
        console.log(`Usuário ${socket.metadata.username} desconectou`);
    });
});

server.listen(4000, '127.0.0.1');