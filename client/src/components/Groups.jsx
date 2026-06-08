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
            <h2 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-2">Grupos</h2>
            <div className="flex gap-2 my-2">
                <input
                    className="border p-1 rounded-lg text-sm flex-1 min-w-0"
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    placeholder="Nome do grupo"
                />
                <button
                    onClick={() => handleCreateOrJoin('CRIAR_GRUPO')}
                    className="bg-blue-500 text-white px-2 py-1 rounded-lg text-sm shrink-0"
                    title="Criar grupo"
                >
                    +
                </button>
                <button
                    onClick={() => handleCreateOrJoin('ENTRAR_GRUPO')}
                    className="bg-green-500 text-white px-2 py-1 rounded-lg text-sm shrink-0"
                >
                    Entrar
                </button>
            </div>
            <ul className="space-y-1">
                {groups.map(g => (
                    <li
                        key={g}
                        onClick={() => { setCurrentGroup(g); setIsGroup(true); }}
                        className="cursor-pointer hover:bg-gray-100 active:bg-gray-200 px-2 py-1.5 rounded text-sm transition-colors"
                    >
                        # {g}
                    </li>
                ))}
            </ul>
        </div>
    );
}