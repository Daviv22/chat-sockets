const net = require('node:net');

/**
 * Definindo protocolos:
 *
 * REGISTRAR        - Fazer registro de usuário
 * ENTRAR           - Fazer login de usuário
 * SAIR             - Fazer logout de usuário
 *
 * CRIAR_GRUPO      - Criar um grupo
 * ENTRAR_GRUPO     - Entrar em um grupo
 * SAIR_GRUPO       - Sair de um grupo
 * MSG_GRUPO        - Enviar mensagem em um grupo
 *
 * ADD_CONT         - Adicionar contato
 * REM_CONT         - Remover contato
 * MSG_CONT         - Enviar mensagem a um contato
 *
 */

const users = new Map()
const groups = new Map()

const server = net.createServer((socket) => {
    // Inicializamos propriedades únicas no objeto socket desta conexão
    socket.metadata = { username: null };

    socket.on('data', (data) => {
        try {
            const { type, payload} = JSON.parse(data.toString());

            switch (type) {

                // Cases relacionados ao usuário
                case 'REGISTRAR':
                    if (users.has(payload.username)) {
                        // Envia mensagem de erro ao cliente
                        socket.write(JSON.stringify({ type: 'ERROR', text: 'Usuário já existe!' }));
                    } else {
                        users.set(payload.username, { socket, contacts: [] });
                        console.log(`Novo usuário registrado: ${payload.username}`);
                    }
                    break;

                case 'ENTRAR':
                    if (users.has(payload.username)) {
                        users.set(payload.username, { ...users.get(payload.username), socket });
                        console.log(`Usuário logado: ${payload.username}`);
                    } else {
                        socket.write(JSON.stringify({ type: 'ERROR', text: 'Usuário não encontrado!' }));
                    }
                    break;

                case 'SAIR':
                    users.delete(socket.metadata.username);
                    socket.end();
                    break;

                // Cases relacionados aos grupos
                case 'CRIAR_GRUPO':
                    groups.set(payload.group, new Set());
                    groups.get(payload.group).add(socket.metadata.username);
                    break;

                case 'ENTRAR_GRUPO':
                    if (groups.has(payload.group)) {
                        groups.get(payload.group).add(socket.metadata.username);
                    }
                    break;

                case 'SAIR_GRUPO':
                    const grupo = groups.get(payload.group);
                    if (grupo) {
                        grupo.delete(socket.metadata.username);
                        if (grupo.size === 0) groups.delete(payload.group);
                    }
                    break;

                case 'MSG_GRUPO':
                    const members = groups.get(payload.group);
                    if (members) {
                        members.forEach(username => {
                            const user = users.get(username);
                            if (user && user.socket.writable) {
                                user.socket.write(JSON.stringify({ type: 'MSG_GRUPO', from: socket.metadata.username, text: payload.text }));
                            }
                        });
                    }
                    break;

                // Cases relacionados a contatos
                case 'ADD_CONT':
                    const u = users.get(socket.metadata.username);
                    if (u && !u.contacts.includes(payload.contact)) u.contacts.push(payload.contact);
                    break;

                case 'REM_CONT':
                    const uRem = users.get(socket.metadata.username);
                    if (uRem) uRem.contacts = uRem.contacts.filter(c => c !== payload.contact);
                    break;

                case 'MSG_CONT':
                    const target = users.get(payload.to);
                    if (target && target.socket.writable) {
                        target.socket.write(JSON.stringify({ type: 'MSG_CONT', from: socket.metadata.username, text: payload.text }));
                    }
                    break;
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