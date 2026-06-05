import React, { useState, useEffect, useRef } from 'react';

const Chat = () => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [joined, setJoined] = useState(false);
    const [user, setUser] = useState({ name: '', group: '' });

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

    const sendMessage = () => {
        const packet = { type: 'SEND_MESSAGE', payload: { ...user, text: input } };
        socket.send(JSON.stringify(packet));
        setInput('');
    };

    if (!joined) {
        return (
            <div>
                <input placeholder="Nome" onChange={(e) => setUser({...user, name: e.target.value})} />
                <input placeholder="Grupo" onChange={(e) => setUser({...user, group: e.target.value})} />
                <button onClick={handleJoin}>Entrar</button>
            </div>
        );
    }

    return (
        <div>
            <h3>Grupo: {user.group}</h3>
            <div>{messages.map((m, i) => <p key={i}>{m.username}: {m.text}</p>)}</div>
            <input value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={sendMessage}>Enviar</button>
        </div>
    );
};

export default Chat;