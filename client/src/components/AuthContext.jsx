import { createContext, useState, useRef, useEffect } from 'react';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [groups, setGroups] = useState([]);
    const [currentGroup, setCurrentGroup] = useState(null);
    const [currentContact, setCurrentContact] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isGroup, setIsGroup] = useState(true);

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
            case 'LOGIN_SUCCESS':
                setIsLoggedIn(true);
                ws.current.send(JSON.stringify({ type: 'LISTAR_GRUPOS' }));
                ws.current.send(JSON.stringify({ type: 'LISTAR_CONT' }));
                break;

            case 'REG_SUCCESS':
                setIsLoggedIn(true);
                break;

            case 'EXIT_SUCCESS':
                window.location.reload();
                break;

            case 'CRIAR_GRUPO_SUCCESS':
                console.log(data.group)
                setGroups(prev => prev.includes(data.group) ? prev : [...prev, data.group]);
                break;

            case 'ERROR':
                alert(data.text);
                break;

            case 'MSG_GRUPO':
                setMessages(prev => [...prev, data]);
                break;

            case 'SYNC_GROUPS':
                setGroups(data.groups);
                break;

            case 'HISTORICO_MENSAGENS':
                setMessages(prev => [...prev, ...data.messages]);
                break;

            case 'UPDATE_CONTACTS':
                setContacts(prev => [...prev, ...data.contacts]);
                break;

            case 'MSG_CONT':
                console.log("Mensagem recebida:", data);
                setMessages(prev => [...prev, {from: data.from, text: data.text, to: data.to}]);
                break;

            case 'SYNC_CONT':
                setContacts(data.contacts)
                break
        }
    };

    return (
        <AuthContext.Provider value={{
            isLoggedIn, username, setUsername, ws,
            groups, setGroups, currentGroup, setCurrentGroup,
            messages, setMessages, contacts, setCurrentContact, currentContact, isGroup, setIsGroup,
        }}>
            {children}
        </AuthContext.Provider>
    );
};