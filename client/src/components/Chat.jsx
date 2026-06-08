import {useContext, useEffect, useRef, useState} from 'react';
import { AuthContext } from './AuthContext';
import { ChevronLeft } from 'lucide-react';

export default function Chat({ onBack }) {
    const { ws, currentGroup, messages, currentContact, isGroup, username } = useContext(AuthContext);
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
                type: 'CARREGAR_MSG_GRUPOS',
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
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-white shrink-0">
                <button onClick={onBack} className="md:hidden p-1 -ml-1 rounded hover:bg-gray-100 text-gray-500 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="font-semibold text-gray-800 truncate">{isGroup ? currentGroup || "Selecione um grupo" : currentContact || "Selecione um contato"}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                {messages
                    .filter(m => isGroup ? m.group === currentGroup : (m.from === currentContact || m.to === currentContact))
                    .map((m, i) => (
                        <p key={i}><strong>{ isGroup ? ( m.from === username ? 'Eu' : m.from ) : ( m.from === currentContact ? currentContact : 'Eu')}:</strong> { isGroup ? m.groupText : m.DMtext }</p>
                    ))
                }
            </div>
            <div className="flex gap-2 px-4 py-3 border-t bg-white shrink-0">
                <input
                    className="border p-2 flex-1 min-w-0 rounded-full text-sm px-4 focus:outline-none"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Sua mensagem..."
                />
                <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm shrink-0 disabled:opacity-40 hover:bg-blue-700 transition-colors">Enviar</button>
            </div>
        </div>
    );
}

