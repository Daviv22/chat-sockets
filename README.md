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

## 🤖 Uso de Ferramentas de Inteligência Artificial no Desenvolvimento

Partes deste trabalho foram desenvolvidas com o auxílio e direcionamento de ferramentas de Inteligência Artificial (Gemini e Claude).

Abaixo estão listados os principais tópicos e prompts utilizados durante o desenvolvimento:

### 1. Entendimento de Protocolos (`net` e `ws`)

* **Prompt:** *Explique a aplicação das bibliotecas `net` e `ws`, e como estruturar, organizar e criar protocolos de comunicação customizados entre elas.*

### 2. Arquitetura da Bridge (Ponte TCP ↔ WebSocket)

* **Prompt:** *Como fazer a conexão de um servidor TCP puro ao navegador utilizando uma bridge em JavaScript intermediária?*

### 3. Processamento de Dados na Bridge

* **Prompt:** *Explique como processar de forma segura os dados recebidos da bridge, evitando quebras no parseamento de mensagens.*

### 4. Gerenciamento de Estado no Frontend (React)

* **Prompt:** *Explique o funcionamento do `useEffect` e do `Context API` no React voltados para manter uma conexão estável e global com WebSockets.*

### 5. Adaptação do Servidor para Ambientes Híbridos (Render e Localhost)

* **Prompt:** *De que forma posso realizar uma adaptação no código do servidor para que a aplicação reconheça e utilize a porta dinâmica do Render (em produção) ou a porta 8080 quando rodada localmente?*

* Nota: o presente arquivo README foi revisado pelo chat-gpt, que indicou elementos de estrutura padrão para github, além de outros ajustes.
