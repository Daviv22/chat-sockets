import { useEffect, useState, useRef } from "react";

export default function RegAndLogin() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [isRegistering, setIsRegistering] = useState(false); // Alternar entre Login/Registro
    const ws = useRef(null);

    useEffect(() => {
        // Conecta na bridge WebSocket
        ws.current = new WebSocket('ws://localhost:8080');

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'ERROR') {
                alert(data.text);
            } else {
                setIsLoggedIn(true);
            }
        };

        return () => ws.current.close();
    }, []);

    const handleAuth = (type) => {
        ws.current.send(JSON.stringify({ type, payload: { username } }));

        if (type === 'SAIR') {
            ws.current.close();
            setIsLoggedIn(false);
            setUsername('');
            ws.current = new WebSocket('ws://localhost:8080');

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'ERROR') {
                    alert(data.text);
                } else {
                    setIsLoggedIn(true);
                }
            };
        }
    };
    return (
        <header className="bg-blue-900 p-4 text-white flex justify-between items-center">
            <h1 className="text-2xl font-bold font-mono">Chat-sockets</h1>
            {!isLoggedIn ? (
                <div className="flex gap-2">
                    <input
                        className="border rounded-lg p-1"
                        placeholder="Nome de usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <button onClick={() => handleAuth(isRegistering ? 'REGISTRAR' : 'ENTRAR')} className="bg-green-600 px-3 py-1 rounded">
                        {isRegistering ? 'Registrar' : 'Entrar'}
                    </button>
                    <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm underline">
                        {isRegistering ? 'Já tem conta? Entrar' : 'Novo? Registrar'}
                    </button>
                </div>
            ) : (
                <div>
                    <p>Bem-vindo, {username}!</p>
                    <button onClick={() => handleAuth('SAIR')} className="bg-red-600 px-3 py-1 rounded">Sair</button>
                </div>
            )}
        </header>
    )
}