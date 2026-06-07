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
                        socket.metadata.username = payload.username;
                        socket.write(JSON.stringify({ type: 'SUCCESS', text: 'Registrado com sucesso!' }));
                        console.log(`Novo usuário registrado: ${payload.username}`);
                    }
                    break;

                case 'ENTRAR':
                    if (users.has(payload.username)) {
                        users.set(payload.username, { ...users.get(payload.username), socket });
                        socket.metadata.username = payload.username;
                        socket.write(JSON.stringify({ type: 'SUCCESS', text: 'Login realizado!' }));
                        console.log(`Usuário logado: ${payload.username}`);
                    } else {
                        socket.write(JSON.stringify({ type: 'ERROR', text: 'Usuário não encontrado!' }));
                    }
                    break;

                case 'SAIR':
                    const user = users.get(socket.metadata.username);
                    if (user) {
                        user.socket = null; // Remove a referência do socket
                        socket.metadata.username = null;
                    }
                    socket.write(JSON.stringify({ type: 'SUCCESS', text: 'Usuário saiu.'}));
                    console.log(`Usuário ${payload.username} saiu.`);
                    break;

                // Cases relacionados aos grupos
                case 'CRIAR_GRUPO':
                    if (groups.has(payload.group)) {
                        // Envie um erro para o cliente se o grupo já existe
                        socket.write(JSON.stringify({ type: 'ERROR', text: 'Este grupo já existe!' }));
                    } else {
                        groups.set(payload.group, new Set());
                        groups.get(payload.group).add(socket.metadata.username);
                        // Confirma a criação
                        socket.write(JSON.stringify({ type: 'SUCCESS', text: 'Grupo criado!', group: payload.group }));
                    }
                    break;

                case 'ENTRAR_GRUPO':
                    if (!groups.has(payload.group)) {
                        // O grupo não existe no servidor
                        socket.write(JSON.stringify({ type: 'ERROR', text: 'Grupo não encontrado!' }));
                    } else {
                        groups.get(payload.group).add(socket.metadata.username);
                        socket.write(JSON.stringify({ type: 'SUCCESS', text: 'Entrou no grupo!', group: payload.group }));
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
                    console.log(`Tentando enviar para o grupo ${payload.group}. Membros:`, members + "MSG: " + payload.text );
                    if (members) {
                        members.forEach(username => {
                            const user = users.get(username);
                            if (user && user.socket.writable) {
                                user.socket.write(JSON.stringify({ type: 'MSG_GRUPO', from: socket.metadata.username, text: payload.text, group: payload.group }));
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
        if (socket.metadata.username) users.delete(socket.metadata.username);
    });
});

server.listen(4000, '127.0.0.1');