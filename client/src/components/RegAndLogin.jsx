import { useContext, useState } from "react";
import { AuthContext } from './AuthContext';
import { Menu } from 'lucide-react';

export default function RegAndLogin({ onMenuToggle, showMenu }) {
    const { isLoggedIn, username, setUsername, ws } = useContext(AuthContext);
    const [isRegistering, setIsRegistering] = useState(false);

    const handleAuth = (type) => {
        ws.current.send(JSON.stringify({
            type,
            payload: { username }
        }));
    };

    return (
        <header className="bg-blue-900 px-4 py-3 text-white flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
                {showMenu && (
                    <button
                        onClick={onMenuToggle}
                        className="md:hidden p-1 rounded hover:bg-blue-800 transition-colors"
                        aria-label="Abrir menu"
                    >
                        <Menu size={22} />
                    </button>
                )}
                <h1 className="text-xl sm:text-2xl font-bold font-mono">Chat-sockets</h1>
            </div>

            {!isLoggedIn ? (
                <div className="flex flex-wrap gap-2 items-center justify-end">
                    <input
                        className="border rounded-lg px-2 py-1 bg-white text-black text-sm w-36 sm:w-auto"
                        placeholder="Nome de usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <button
                        onClick={() => handleAuth(isRegistering ? 'REGISTRAR' : 'ENTRAR')}
                        className="bg-green-600 px-3 py-1 rounded text-sm whitespace-nowrap"
                    >
                        {isRegistering ? 'Registrar' : 'Entrar'}
                    </button>
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-xs underline whitespace-nowrap"
                    >
                        {isRegistering ? 'Já tem conta? Entrar' : 'Novo? Registrar'}
                    </button>
                </div>
            ) : (
                <div className="flex gap-3 items-center">
                    <p className="text-sm hidden sm:block">Bem-vindo, {username}!</p>
                    <button
                        onClick={() => handleAuth('SAIR')}
                        className="bg-red-600 px-3 py-1 rounded text-sm whitespace-nowrap"
                    >
                        Sair
                    </button>
                </div>
            )}
        </header>
    );
}