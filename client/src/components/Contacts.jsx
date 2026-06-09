import {useContext, useState} from "react";
import {AuthContext} from "./AuthContext.jsx";

export default function Contacts() {
    const { ws, contacts, setCurrentContact, setIsGroup } = useContext(AuthContext)
    const [newContact, setNewContact] = useState('');

    const handleAdd = (type) => {
        if (!newContact) return;
        ws.current.send(JSON.stringify({
            type: type,
            payload: { contact: newContact }
        }));
        setNewContact('')
    }

    return (
        <div className="p-4">
            <h2 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-2">Contatos</h2>
            <div className="flex gap-2 my-2">
                <input
                    className="border p-1 rounded-lg text-sm flex-1 min-w-0"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="Nome do contato"
                />
                <button
                    onClick={() => handleAdd('ADD_CONT')}
                    className="bg-blue-500 text-white px-2 py-1 rounded-lg text-sm shrink-0"
                    title="Adicionar contato"
                >
                    +
                </button>
            </div>
            <ul className="space-y-1">
                {contacts.map(c => (
                    <li
                        key={c}
                        onClick={() => { setCurrentContact(c); setIsGroup(false); }}
                        className="cursor-pointer hover:bg-gray-100 active:bg-gray-200 px-2 py-1.5 rounded text-sm transition-colors"
                    >
                        @ {c}
                    </li>
                ))}
            </ul>
        </div>
    );
}