import React, { useState, useEffect } from 'react';

const Chat = () => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [joined, setJoined] = useState(false);
    const [user, setUser] = useState({ name: '', group: '' });


    // Estado do chat direto
    const [dmTarget, setDmTarget] = useState('');
    const [dmInput, setDmInput] = useState('');
    const [activeTab, setActiveTab] = useState('group'); // 'group' | 'dm'

    useEffect(() => {
        // Conecta ao nosso servidor de "Bridge" (WebSocket)
        const ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => console.log('Conectado ao bridge');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages((prev) => [...prev, data]);
        };

        setSocket(ws);
        return () => ws.close();
    }, []);

    const handleJoin = () => {
        const packet = { type: 'JOIN_GROUP', payload: user };
        socket.send(JSON.stringify(packet));
        setJoined(true);
    };

    const sendGroupMessage = () => {
        if (!input.trim()) return;
        const packet = { type: 'SEND_MESSAGE', payload: { ...user, text: input } };
        socket.send(JSON.stringify(packet));
        setInput('');
    };

    const sendDM = () => {
        if (!dmInput.trim() || !dmTarget.trim()) return;
        const packet = {
            type: 'DIRECT_MESSAGE',
            payload: { to: dmTarget, text: dmInput }
        };
        socket.send(JSON.stringify(packet));
        setDmInput('');
    };

    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter') action();
    };

    // Filtra mensagens por contexto
    const groupMessages = messages.filter(
        m => m.type === 'GROUP_MESSAGE' || m.type === 'ERROR'
    );
    const dmMessages = messages.filter(
        m => m.type === 'DIRECT_MESSAGE' &&
            (m.from === dmTarget || m.to === dmTarget || m.self)
    );

    if (!joined) {
        return (
            <div>
                <input
                    placeholder="Nome"
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                />
                <input
                    placeholder="Grupo"
                    onChange={(e) => setUser({ ...user, group: e.target.value })}
                />
                <button onClick={handleJoin}>Entrar</button>
            </div>
        );
    }

    return (
        <div>
            <h3>Logado como: {user.name}</h3>

            {/* Abas */}
            <div>
                <button
                    onClick={() => setActiveTab('group')}
                    style={{ fontWeight: activeTab === 'group' ? 'bold' : 'normal' }}
                >
                    Grupo: {user.group}
                </button>
                <button
                    onClick={() => setActiveTab('dm')}
                    style={{ fontWeight: activeTab === 'dm' ? 'bold' : 'normal' }}
                >
                    Mensagem Direta
                </button>
            </div>

            {/* Aba de Grupo */}
            {activeTab === 'group' && (
                <div>
                    <div style={{ minHeight: 100, border: '1px solid #ccc', padding: 8, marginTop: 8 }}>
                        {groupMessages.map((m, i) =>
                            m.type === 'ERROR'
                                ? <p key={i} style={{ color: 'red' }}>{m.text}</p>
                                : <p key={i}><strong>{m.username}</strong>: {m.text}</p>
                        )}
                    </div>
                    <input
                        value={input}
                        placeholder="Mensagem para o grupo..."
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, sendGroupMessage)}
                    />
                    <button onClick={sendGroupMessage}>Enviar</button>
                </div>
            )}

            {/* Aba de DM */}
            {activeTab === 'dm' && (
                <div>
                    <div style={{ marginTop: 8 }}>
                        <input
                            placeholder="Nome do usuário..."
                            value={dmTarget}
                            onChange={(e) => setDmTarget(e.target.value)}
                        />
                    </div>
                    <div style={{ minHeight: 100, border: '1px solid #ccc', padding: 8, marginTop: 8 }}>
                        {dmTarget
                            ? dmMessages.map((m, i) => (
                                <p key={i}>
                                    <strong>{m.self ? 'Você' : m.from}</strong>: {m.text}
                                </p>
                            ))
                            : <p style={{ color: '#999' }}>Digite o nome de um usuário para iniciar.</p>
                        }
                    </div>
                    <input
                        value={dmInput}
                        placeholder={dmTarget ? `Mensagem para ${dmTarget}...` : 'Defina o destinatário acima'}
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