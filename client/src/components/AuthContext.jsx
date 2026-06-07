import { createContext, useState, useRef, useEffect } from 'react';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [groups, setGroups] = useState([]);
    const [currentGroup, setCurrentGroup] = useState(null);
    const [messages, setMessages] = useState([]);

    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:8080');

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleServerMessage(data);
        };

        return () => ws.current.close();
    }, []);

    const handleServerMessage = (data) => {
        switch (data.type) {
            case 'SUCCESS':
                // Tratamento de sucesso genérico
                if (data.text === 'Login realizado!' || data.text === 'Registrado com sucesso!') {
                    setIsLoggedIn(true);
                } else if (data.text === 'Usuário saiu.') {
                    setUsername('');
                    setIsLoggedIn(false);
                    setGroups([]);
                } else if (data.group) {
                    // Confirmação de entrada ou criação de grupo
                    setGroups(prev => prev.includes(data.group) ? prev : [...prev, data.group]);
                }
                break;

            case 'ERROR':
                alert(data.text);
                break;

            case 'MSG_GRUPO':
                setMessages(prev => [...prev, data]);
                break;

            case 'MSG_CONT':
                // Lógica para mensagens privadas
                break;
        }
    };

    return (
        <AuthContext.Provider value={{
            isLoggedIn, username, setUsername, ws,
            groups, setGroups, currentGroup, setCurrentGroup,
            messages, setMessages
        }}>
            {children}
        </AuthContext.Provider>
    );
};