import {useContext, useEffect, useRef, useState} from 'react';
import { AuthContext } from './AuthContext';

export default function Chat() {
    const { ws, currentGroup, messages, currentContact, isGroup } = useContext(AuthContext);
    const [text, setText] = useState('');

    const sendMessage = () => {
        if (!text) return;

        if (isGroup && currentGroup) {
            ws.current.send(JSON.stringify({
                type: 'MSG_GRUPO',
                payload: { group: currentGroup, groupText: text }
            }));
        } else if (!isGroup && currentContact) {
            ws.current.send(JSON.stringify({
                type: 'MSG_CONT',
                payload: { to: currentContact, DMtext: text }
            }));
        }
        setText('');
    };

    const loadedHistory = useRef(new Set());

    useEffect(() => {
        if (currentGroup && ws.current && !loadedHistory.current.has(currentGroup)) {
            ws.current.send(JSON.stringify({
                type: 'CARREGAR_MENSAGENS',
                payload: { group: currentGroup }
            }));
            loadedHistory.current.add(currentGroup);
        }
    }, [currentGroup]);

    useEffect(() => {
        if (!isGroup && currentContact && ws.current) {
            ws.current.send(JSON.stringify({
                type: 'CARREGAR_MENSAGENS_CONT',
                payload: { contact: currentContact }
            }));
        }
    }, [currentContact, isGroup]);

    return (
        <div className="flex flex-col h-full p-4 bg-white">
            <h2 className="font-bold border-b mb-2">{isGroup ? currentGroup || "Selecione um grupo" : currentContact || "Selecione um contato"}</h2>
            <div className="grow overflow-y-auto">
                {messages
                    .filter(m => isGroup ? m.group === currentGroup : (m.from === currentContact || m.to === currentContact))
                    .map((m, i) => (
                        <p key={i}><strong>{m.from === currentContact ? currentContact : 'Eu'}:</strong> { isGroup ? m.groupText : m.DMtext }</p>
                    ))
                }
            </div>
            <div className="flex gap-2 mt-2">
                <input
                    className="border p-2 grow rounded-lg"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Sua mensagem..."
                />
                <button onClick={sendMessage} className="bg-blue-600 text-white px-4 rounded-lg">Enviar</button>
            </div>
        </div>
    );
}