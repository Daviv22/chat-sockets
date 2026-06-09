const net = require('node:net');

/**
 * Definindo protocolos:
 *
 * REGISTRAR            - Fazer registro de usuário
 * ENTRAR               - Fazer login de usuário
 * SAIR                 - Fazer logout de usuário
 *
 * CRIAR_GRUPO          - Criar um grupo
 * ENTRAR_GRUPO         - Entrar em um grupo
 * MSG_GRUPO            - Enviar mensagem em um grupo
 * LISTAR_GRUPOS        - Lista todos os grupos do usuário
 * CARREGAR_MSG_GRUPOS  - Carrega mensagens dos grupos
 *
 * ADD_CONT             - Adicionar contato
 * MSG_CONT             - Enviar mensagem a um contato
 * LISTAR_CONT          - Lista todos os contatos do usuário
 * CARREGAR_MSG_CONT    - Carrega mensagens dos contatos
 *
 */

const users = new Map()
const groups = new Map()
const mensagensDoGrupo = {};
const mensagensPrivadas = {};

const getChatKey = (userA, userB) => {
    return [userA, userB].sort().join('-');
};

const server = net.createServer((socket) => {
    // Inicializa propriedades únicas no objeto socket desta conexão
    socket.metadata = { username: null };

    socket.on('data', (data) => {
        const stringData = data.toString().trim();

        // PROTEÇÃO CONTRA REQUISIÇÕES HTTP HTTP/HEAD FANTASMAS:
        if (stringData.startsWith('HEAD') || stringData.startsWith('GET') || stringData.startsWith('HTTP')) {
            return; // Aborta e ignora para não quebrar o JSON.parse
        }

        try {
            const { type, payload } = JSON.parse(data.toString());
            switch (type) {

                // Cases relacionados ao usuário
                case 'REGISTRAR':
                    if (users.has(payload.username)) {
                        // Envia mensagem de erro ao cliente
                        socket.write(JSON.stringify({ type: 'ERROR', text: 'Usuário já existe!' }));
                    } else {
                        users.set(payload.username, { socket, contacts: [] });
                        socket.metadata.username = payload.username;
                        socket.write(JSON.stringify({ type: 'REG_SUCCESS', text: 'Registrado com sucesso!' }));
                        console.log(`Novo usuário registrado: ${payload.username}`);
                    }
                    break;

                case 'ENTRAR':
                    if (users.has(payload.username)) {
                        users.set(payload.username, { ...users.get(payload.username), socket });
                        socket.metadata.username = payload.username;
                        socket.write(JSON.stringify({ type: 'LOGIN_SUCCESS', text: 'Login realizado!' }));

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
                    socket.write(JSON.stringify({ type: 'EXIT_SUCCESS', text: 'Usuário saiu.'}));
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
                        socket.write(JSON.stringify({ type: 'CRIAR_GRUPO_SUCCESS', text: 'Grupo criado!', group: payload.group }));
                    }
                    break;

                case 'ENTRAR_GRUPO':
                    if (!groups.has(payload.group)) {
                        // O grupo não existe no servidor
                        socket.write(JSON.stringify({ type: 'ERROR', text: 'Grupo não encontrado!' }));
                    } else {
                        groups.get(payload.group).add(socket.metadata.username);
                        socket.write(JSON.stringify({ type: 'ENTRAR_GRUPO_SUCCESS', text: 'Entrou no grupo!', group: payload.group }));
                    }
                    break;

                case 'MSG_GRUPO':
                    const { group, groupText } = payload;

                    if (!mensagensDoGrupo[group]) {
                        mensagensDoGrupo[group] = [];
                    }

                    const novaMensagem = { from: socket.metadata.username, groupText, group };
                    mensagensDoGrupo[group].push(novaMensagem);

                    const members = groups.get(payload.group);
                    console.log(`Tentando enviar para o grupo ${payload.group}. Membros:`, members + "MSG: " + payload.text );

                    if (members) {
                        members.forEach(username => {
                            const user = users.get(username);
                            if (user && user.socket.writable) {
                                user.socket.write(JSON.stringify({ type: 'MSG_GRUPO', from: socket.metadata.username, groupText: groupText, group: group }));
                            }
                        });
                    }
                    break;

                case 'LISTAR_GRUPOS':
                    // Filtra quais grupos contêm o usuário logado
                    const meusGrupos = Array.from(groups.entries())
                        .filter(([groupName, members]) => members.has(socket.metadata.username))
                        .map(([groupName]) => groupName);

                    socket.write(JSON.stringify({ type: 'SYNC_GROUPS', groups: meusGrupos }));
                    break;

                case 'CARREGAR_MSG_GRUPOS':
                    const historico = mensagensDoGrupo[payload.group] || [];
                    socket.write(JSON.stringify({ type: 'HISTORICO_MENSAGENS', group: payload.group, messages: historico }));
                    break;

                // Cases relacionados a contatos
                case 'ADD_CONT':
                    const userA = users.get(socket.metadata.username);
                    const userB = users.get(payload.contact);

                    // Validar existência de usuário
                    if (!userB) {
                        socket.write(JSON.stringify({ type: 'ERROR', text: 'Usuário não existe!' }));
                        return;
                    }

                    // Impede usuário adicionar a si mesmo
                    if (userA === userB) {
                        socket.write(JSON.stringify({ type: 'ERROR', text: 'Você não pode adicionar a si mesmo como um contato!' }));
                        return
                    }

                    // Adicionar B em A
                    if (!userA.contacts.includes(payload.contact)) {
                        userA.contacts.push(payload.contact);
                        socket.write(JSON.stringify({ type: 'UPDATE_CONTACTS', contacts: userA.contacts }));
                    }

                    // Adicionar A em B
                    if (!userB.contacts.includes(socket.metadata.username)) {
                        userB.contacts.push(socket.metadata.username);

                        // NOTIFICA O B (usando o socket que está salvo no objeto userB)
                        if (userB.socket && userB.socket.writable) {
                            userB.socket.write(JSON.stringify({
                                type: 'UPDATE_CONTACTS',
                                contacts: userB.contacts
                            }));
                        }
                    }
                    break;

                case 'MSG_CONT':
                    const { to, DMtext } = payload;
                    const from = socket.metadata.username;
                    const chatKey = getChatKey(from, to);

                    if (!mensagensPrivadas[chatKey]) mensagensPrivadas[chatKey] = [];

                    const novaMsg = { from, to, DMtext };
                    mensagensPrivadas[chatKey].push(novaMsg);
                    console.log(mensagensPrivadas)

                    const destino = users.get(payload.to);
                    const origem = users.get(socket.metadata.username);

                    // Envia para o destinatário
                    if (destino && destino.socket && destino.socket.writable) {
                        destino.socket.write(JSON.stringify({
                            type: 'MSG_CONT',
                            from: socket.metadata.username,
                            DMtext: DMtext
                        }));
                    }

                    // Envia de volta para o remetente (confirmação)
                    if (origem && origem.socket && origem.socket.writable) {
                        origem.socket.write(JSON.stringify({
                            type: 'MSG_CONT',
                            from: socket.metadata.username,
                            DMtext: DMtext,
                            to: payload.to
                        }));
                    }
                    break;

                case 'LISTAR_CONT':
                    const usuarioLogado = users.get(socket.metadata.username);

                    if (usuarioLogado) {
                        socket.write(JSON.stringify({
                            type: 'SYNC_CONT',
                            contacts: usuarioLogado.contacts
                        }));
                    } else {
                        socket.write(JSON.stringify({ type: 'ERROR', text: 'Usuário não encontrado.' }));
                    }
                    break;

                case 'CARREGAR_MENSAGENS_CONT':
                    const key = getChatKey(socket.metadata.username, payload.contact);
                    const historicoDM = mensagensPrivadas[key] || [].map(msg => ({...msg, to: msg.to || payload.contact}));
                    socket.write(JSON.stringify({ type: 'HISTORICO_MENSAGENS_CONT', contact: payload.contact, messages: historicoDM }));
                    break;
            }
        } catch (e) {
            console.log("Erro no processamento:", e);
        }
    });

    socket.on('end', () => {
        if (socket.metadata.username) {
            const user = users.get(socket.metadata.username);
            if (user) user.socket = null;
        }
    });
});

server.listen(4000, '127.0.0.1');