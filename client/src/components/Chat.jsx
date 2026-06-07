import {useContext, useEffect, useState} from 'react';
import { AuthContext } from './AuthContext';

export default function Chat() {
    const { ws, currentGroup, messages } = useContext(AuthContext);
    const [text, setText] = useState('');

    const sendMessage = () => {
        if (!text || !currentGroup) return;
        ws.current.send(JSON.stringify({
            type: 'MSG_GRUPO',
            payload: { group: currentGroup, text }
        }));
        setText('');
    };

    useEffect(() => {
        if (currentGroup && ws.current) {
            ws.current.send(JSON.stringify({
                type: 'CARREGAR_MENSAGENS',
                payload: { group: currentGroup }
            }));
        }
    }, [currentGroup]);

    return (
        <div className="flex flex-col h-full p-4 bg-white">
            <h2 className="font-bold border-b mb-2">{currentGroup || "Selecione um grupo"}</h2>
            <div className="grow overflow-y-auto">
                {messages
                    .filter(m => m.group === currentGroup)
                    .map((m, i) => <p key={i}><strong>{m.from}:</strong> {m.text}</p>)
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