import { useContext, useState } from 'react';
import { AuthContext } from './AuthContext';

export default function Groups() {
    const { ws, groups, setCurrentGroup, setIsGroup } = useContext(AuthContext);
    const [newGroup, setNewGroup] = useState('');

    const handleCreateOrJoin = (type) => {
        if (!newGroup) return;

        ws.current.send(JSON.stringify({
            type: type,
            payload: { group: newGroup }
        }));
        setNewGroup('');
    };

    return (
        <div className="p-4">
            <h2 className="font-bold">Grupos</h2>
            <div className="flex gap-2 my-2">
                <input
                    className="border p-1 rounded-lg"
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    placeholder="Nome do grupo"
                />
                <button onClick={() => handleCreateOrJoin('CRIAR_GRUPO')} className="bg-blue-500 text-white p-1 rounded-lg">+</button>
                <button onClick={() => handleCreateOrJoin('ENTRAR_GRUPO')} className="bg-green-500 text-white p-1 rounded-lg">Entrar</button>
            </div>
            <ul>
                {groups.map(g => (
                    <li
                        key={g}
                        onClick={() => {setCurrentGroup(g); setIsGroup(true)}}
                        className="cursor-pointer hover:bg-gray-300 p-1"
                    >
                        {g}
                    </li>
                ))}
            </ul>
        </div>
    );
}