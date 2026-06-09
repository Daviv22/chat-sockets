# Implementação do Conceito de Sockets por Meio de uma Aplicação de Chat

## 1. Baixando os arquivos

No diretório de trabalho, execute o comando:

```bash
git clone https://github.com/Daviv22/chat-sockets.git
```

## 2. Executando o projeto localmente

O projeto contempla duas partes principais:

* **Server** (Backend em Node.js com arquitetura híbrida TCP/WebSocket);
* **Client** (Frontend em React com Vite).

Para executar a aplicação em sua máquina, siga os passos abaixo.

### 2.1. Pré-requisitos

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### 2.2. Configuração e execução do servidor

Navegue até o diretório do servidor:

```bash
cd server
```

Instale as dependências necessárias:

```bash
npm install
```

Em seguida, execute o arquivo responsável por inicializar as duas parcelas do servidor (`index.js` e `bridge.js`):

```bash
node start.js
```

### 2.3. Configuração e execução do cliente

Em outro terminal, navegue até o diretório do cliente:

```bash
cd client
```

O projeto foi desenvolvido visando também a possibilidade de implantação em um provedor de serviços online. Como o objetivo deste guia é executá-lo localmente, é necessário verificar o trecho de código responsável pela conexão com o servidor.

Abra o arquivo `AuthContext.jsx`, localizado em `client/src/components`, e certifique-se de que a aplicação está configurada para utilizar a porta local `8080`, conforme o trecho abaixo:

```javascript
useEffect(() => {
    // Link para execução utilizando o serviço hospedado no Render
    // ws.current = new WebSocket('wss://sockets-server-h19h.onrender.com');

    // Porta utilizada para execução local
    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
    };

    return () => ws.current.close();
}, []);
```

Instale as dependências do cliente e execute a aplicação:

```bash
npm install
npm run dev
```

Copie a URL local exibida no terminal e cole-a em seu navegador de preferência.

## 3. Testando a aplicação

Abra, no mínimo, duas abas do navegador e crie usuários diferentes. Insira ambos em um grupo em comum e teste a troca de mensagens entre eles.

# Link rápido para utilização do projeto
O projeto pode ser acessado através do link: https://chat-sockets-liard.vercel.app/ 
