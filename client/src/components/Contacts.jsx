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
            <h2 className="font-bold">Contatos</h2>
            <div className="flex gap-2 my-2">
                <input
                    className="border p-1 rounded-lg"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="Nome do contato"
                />
                <button onClick={() => handleAdd('ADD_CONT')} className="bg-blue-500 text-white p-1 rounded-lg">+</button>
                <button  className="bg-red-500 text-white p-1 rounded-lg">Remover</button>
            </div>
            <ul>
                {contacts.map(c => (
                    <li
                        key={c}
                        onClick={() => {setCurrentContact(c); setIsGroup(false)}}
                        className="cursor-pointer hover:bg-gray-300 p-1"
                    >
                        {c}
                    </li>
                ))}
            </ul>
        </div>
    )
}