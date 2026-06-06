import React, { useState, useEffect } from 'react';

const Chat = () => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [registered, setRegistered] = useState(false);
    const [username, setUsername] = useState('');
    const [usernameInput, setUsernameInput] = useState('');
    const [usernameError, setUsernameError] = useState('');

    // Grupos
    const [groups, setGroups] = useState([]);        // grupos que o usuário entrou
    const [activeGroup, setActiveGroup] = useState(null);
    const [groupInput, setGroupInput] = useState(''); // input para entrar num novo grupo
    const [groupError, setGroupError] = useState('');
    const [messageInput, setMessageInput] = useState('');

    // DM
    const [dmTarget, setDmTarget] = useState('');
    const [dmInput, setDmInput] = useState('');
    const [dmError, setDmError] = useState('');
    const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'dm'

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');
        ws.onopen = () => console.log('Conectado ao bridge');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages((prev) => [...prev, data]);
        };
        setSocket(ws);
        return () => ws.close();
    }, []);

    // --- Registro ---
    const handleRegister = () => {
        const name = usernameInput.trim();
        if (!name) {
            setUsernameError('Digite um nome para continuar.');
            return;
        }
        socket.send(JSON.stringify({ type: 'REGISTER', payload: { name } }));
        setUsername(name);
        setRegistered(true);
    };

    // --- Grupos ---
    const handleJoinGroup = () => {
        const group = groupInput.trim();
        if (!group) {
            setGroupError('Digite o nome do grupo.');
            return;
        }
        if (groups.includes(group)) {
            setGroupError(`Você já está no grupo "${group}".`);
            return;
        }
        socket.send(JSON.stringify({ type: 'JOIN_GROUP', payload: { group } }));
        setGroups(prev => [...prev, group]);
        setActiveGroup(group);
        setGroupInput('');
        setGroupError('');
        setActiveTab('groups');
    };

    const sendGroupMessage = () => {
        if (!messageInput.trim() || !activeGroup) return;
        socket.send(JSON.stringify({
            type: 'SEND_MESSAGE',
            payload: { group: activeGroup, text: messageInput }
        }));
        setMessageInput('');
    };

    // --- DM ---
    const sendDM = () => {
        const target = dmTarget.trim();
        if (!dmInput.trim() || !target) return;
        if (target === username) {
            setDmError('Você não pode enviar uma mensagem direta para si mesmo.');
            return;
        }
        setDmError('');
        socket.send(JSON.stringify({
            type: 'DIRECT_MESSAGE',
            payload: { to: target, text: dmInput }
        }));
        setDmInput('');
    };

    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter') action();
    };

    // --- Filtros de mensagem ---
    const groupMessages = (group) => messages.filter(
        m => m.type === 'GROUP_MESSAGE' && m.group === group
    );
    const dmMessages = messages.filter(
        m => m.type === 'DIRECT_MESSAGE' &&
            (m.from === dmTarget.trim() || (m.self && m.to === dmTarget.trim()))
    );
    const dmErrors = messages.filter(m => m.type === 'ERROR');

    // --- Tela de registro ---
    if (!registered) {
        return (
            <div>
                <h3>Entrar no Chat</h3>
                <input
                    placeholder="Seu nome"
                    value={usernameInput}
                    onChange={(e) => { setUsernameInput(e.target.value); setUsernameError(''); }}
                    onKeyDown={(e) => handleKeyDown(e, handleRegister)}
                />
                <button onClick={handleRegister}>Entrar</button>
                {usernameError && <p style={{ color: 'red' }}>{usernameError}</p>}
            </div>
        );
    }

    return (
        <div>
            <h3>Logado como: {username}</h3>

            {/* Abas principais */}
            <div>
                <button
                    onClick={() => setActiveTab('groups')}
                    style={{ fontWeight: activeTab === 'groups' ? 'bold' : 'normal' }}
                >
                    Grupos
                </button>
                <button
                    onClick={() => setActiveTab('dm')}
                    style={{ fontWeight: activeTab === 'dm' ? 'bold' : 'normal' }}
                >
                    Mensagem Direta
                </button>
            </div>

            {/* Aba de Grupos */}
            {activeTab === 'groups' && (
                <div>
                    {/* Entrar em novo grupo */}
                    <div style={{ marginTop: 8 }}>
                        <input
                            placeholder="Nome do grupo..."
                            value={groupInput}
                            onChange={(e) => { setGroupInput(e.target.value); setGroupError(''); }}
                            onKeyDown={(e) => handleKeyDown(e, handleJoinGroup)}
                        />
                        <button onClick={handleJoinGroup}>Entrar no grupo</button>
                        {groupError && <p style={{ color: 'red' }}>{groupError}</p>}
                    </div>

                    {groups.length === 0 && (
                        <p style={{ color: '#999' }}>Você ainda não entrou em nenhum grupo.</p>
                    )}

                    {/* Lista de grupos que o usuário participa */}
                    {groups.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                            <div>
                                {groups.map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setActiveGroup(g)}
                                        style={{ fontWeight: activeGroup === g ? 'bold' : 'normal', marginRight: 4 }}
                                    >
                                        #{g}
                                    </button>
                                ))}
                            </div>

                            {/* Mensagens do grupo ativo */}
                            {activeGroup && (
                                <div>
                                    <div style={{ minHeight: 100, border: '1px solid #ccc', padding: 8, marginTop: 8 }}>
                                        {groupMessages(activeGroup).length === 0
                                            ? <p style={{ color: '#999' }}>Nenhuma mensagem ainda.</p>
                                            : groupMessages(activeGroup).map((m, i) => (
                                                <p key={i}><strong>{m.username}</strong>: {m.text}</p>
                                            ))
                                        }
                                    </div>
                                    <input
                                        value={messageInput}
                                        placeholder={`Mensagem para #${activeGroup}...`}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, sendGroupMessage)}
                                    />
                                    <button onClick={sendGroupMessage}>Enviar</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Aba de DM */}
            {activeTab === 'dm' && (
                <div>
                    <div style={{ marginTop: 8 }}>
                        <input
                            placeholder="Nome do usuário..."
                            value={dmTarget}
                            onChange={(e) => { setDmTarget(e.target.value); setDmError(''); }}
                        />
                    </div>
                    {dmError && <p style={{ color: 'red' }}>{dmError}</p>}
                    {dmErrors.map((m, i) => <p key={i} style={{ color: 'red' }}>{m.text}</p>)}
                    <div style={{ minHeight: 100, border: '1px solid #ccc', padding: 8, marginTop: 8 }}>
                        {!dmTarget.trim()
                            ? <p style={{ color: '#999' }}>Digite o nome de um usuário para iniciar.</p>
                            : dmMessages.length === 0
                                ? <p style={{ color: '#999' }}>Nenhuma mensagem ainda.</p>
                                : dmMessages.map((m, i) => (
                                    <p key={i}>
                                        <strong>{m.self ? 'Você' : m.from}</strong>: {m.text}
                                    </p>
                                ))
                        }
                    </div>
                    <input
                        value={dmInput}
                        placeholder={dmTarget.trim() ? `Mensagem para ${dmTarget.trim()}...` : 'Defina o destinatário acima'}
                        onChange={(e) => setDmInput(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, sendDM)}
                        disabled={!dmTarget.trim()}
                    />
                    <button onClick={sendDM} disabled={!dmTarget.trim()}>Enviar</button>
                </div>
            )}
        </div>
    );
};

export default Chat;