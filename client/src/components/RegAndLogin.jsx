import { useContext, useState } from "react";
import { AuthContext } from './AuthContext';

export default function RegAndLogin() {
    const { isLoggedIn, username, setUsername, ws } = useContext(AuthContext);
    const [isRegistering, setIsRegistering] = useState(false);

    const handleAuth = (type) => {
        ws.current.send(JSON.stringify({
            type,
            payload: { username }
        }));
    };

    return (
        <header className="bg-blue-900 p-4 text-white flex justify-between items-center">
            <h1 className="text-2xl font-bold font-mono">Chat-sockets</h1>
            {!isLoggedIn ? (
                <div className="flex gap-2">
                    <input
                        className="border rounded-lg p-1 bg-white text-black "
                        placeholder="Nome de usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <button
                        onClick={() => handleAuth(isRegistering ? 'REGISTRAR' : 'ENTRAR')}
                        className="bg-green-600 px-3 py-1 rounded"
                    >
                        {isRegistering ? 'Registrar' : 'Entrar'}
                    </button>
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-sm underline"
                    >
                        {isRegistering ? 'Já tem conta? Entrar' : 'Novo? Registrar'}
                    </button>
                </div>
            ) : (
                <div className="flex gap-4 items-center">
                    <p>Bem-vindo, {username}!</p>
                    <button
                        onClick={() => handleAuth('SAIR')}
                        className="bg-red-600 px-3 py-1 rounded"
                    >
                        Sair
                    </button>
                </div>
            )}
        </header>
    )
}