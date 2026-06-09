console.log("Iniciando a aplicação unificada...");

// Importa e executa o servidor TCP principal
require('./index.js');

// Importa e executa a ponte WebSocket
require('./bridge.js');