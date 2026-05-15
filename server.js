const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();

const html = `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Chat Interno</title>

    <style>

        *{
            margin:0;
            padding:0;
            box-sizing:border-box;
            font-family:Arial,sans-serif;
        }

        body{
            background:#0f172a;
            color:white;
            height:100vh;
        }

        .login-screen,
        .chat-screen{
            width:100%;
            height:100vh;
            display:flex;
            justify-content:center;
            align-items:center;
        }

        .login-box{
            width:90%;
            max-width:400px;
            background:#1e293b;
            padding:30px;
            border-radius:20px;
            display:flex;
            flex-direction:column;
            gap:15px;
            box-shadow:0 0 20px rgba(0,0,0,.4);
        }

        .login-box h1{
            text-align:center;
        }

        input{
            width:100%;
            padding:15px;
            border:none;
            border-radius:12px;
            outline:none;
            font-size:16px;
        }

        button{
            border:none;
            background:#06A95D;
            color:white;
            padding:15px;
            border-radius:12px;
            font-size:16px;
            cursor:pointer;
            font-weight:bold;
        }

        .chat-container{
            width:100%;
            max-width:500px;
            height:90vh;
            background:#1e293b;
            border-radius:20px;
            overflow:hidden;
            display:flex;
            flex-direction:column;
            box-shadow:0 0 20px rgba(0,0,0,.4);
        }

        .header{
            background:#06A95D;
            padding:18px;
            text-align:center;
            font-size:20px;
            font-weight:bold;
        }

        .status{
            background:#111827;
            padding:8px;
            text-align:center;
            font-size:13px;
            color:#94a3b8;
        }

        .messages{
            flex:1;
            padding:15px;
            overflow-y:auto;
            display:flex;
            flex-direction:column;
            gap:10px;
        }

        .message{
            max-width:80%;
            padding:12px;
            border-radius:15px;
            word-wrap:break-word;
            color:white;
        }

        .username{
            font-size:12px;
            margin-bottom:5px;
            opacity:.8;
            font-weight:bold;
        }

        .input-area{
            display:flex;
            gap:10px;
            padding:10px;
            background:#0f172a;
        }

    </style>

</head>

<body>

    <div
        class="login-screen"
        id="loginScreen"
    >

        <div class="login-box">

            <h1>Entrar</h1>

            <input
                type="text"
                id="usernameInput"
                placeholder="Digite seu nome"
            >

            <button id="enterBtn">
                Entrar
            </button>

        </div>

    </div>

    <div
        class="chat-screen"
        id="chatScreen"
        style="display:none;"
    >

        <div class="chat-container">

            <div class="header">
                Chat
            </div>

            <div
                class="status"
                id="status"
            >
                Conectando...
            </div>

            <div
                class="messages"
                id="messages"
            ></div>

            <div class="input-area">

                <input
                    type="text"
                    id="messageInput"
                    placeholder="Digite uma mensagem..."
                >

                <button id="sendBtn">
                    Enviar
                </button>

            </div>

        </div>

    </div>

    <script>

        const loginScreen = document.getElementById("loginScreen");
        const chatScreen = document.getElementById("chatScreen");

        const usernameInput = document.getElementById("usernameInput");
        const enterBtn = document.getElementById("enterBtn");

        const messages = document.getElementById("messages");
        const input = document.getElementById("messageInput");
        const sendBtn = document.getElementById("sendBtn");
        const status = document.getElementById("status");

        let username = "";

        const ws = new WebSocket("ws://127.0.0.1:3000");

        ws.onopen = () => {

            status.innerText = "Conectado";

        };

        ws.onclose = () => {

            status.innerText = "Desconectado";

        };

        ws.onerror = (err) => {

            console.log(err);

        };

        function getUserColor(name){

              const colors = [
                  "#ef4444",
                  "#3b82f6",
                  "#eab308",
                  "#8b5cf6",
                  "#ec4899",
                  "#14b8a6",
                  "#f97316",
                  "#22c55e",
                  "#f43f5e",
                  "#06b6d4",
                  "#6366f1",
                  "#84cc16",
                  "#ff6b6b",
                  "#0ea5e9",
                  "#a855f7",
                  "#10b981"
              ];

              // hash MUITO melhor
              let hash = 5381;

              for(let i = 0; i < name.length; i++){

                  hash = (hash * 33) ^ name.charCodeAt(i);

              }

              hash = Math.abs(hash);

              return colors[hash % colors.length];

          }

        function addMessage(user, text, type){

            const div = document.createElement("div");

            div.classList.add("message");

            // MINHAS mensagens
            if(type === "me"){

                div.style.background = "#06A95D";
                div.style.alignSelf = "flex-end";

            }else{

                // mensagens dos OUTROS usuários
                div.style.background = getUserColor(user);
                div.style.alignSelf = "flex-start";

            }

            div.innerHTML = \`
                <div class="username">
                    \${user}
                </div>

                <div>
                    \${text}
                </div>
            \`;

            messages.appendChild(div);

            messages.scrollTop = messages.scrollHeight;

        }

        ws.onmessage = (event) => {

            const data = JSON.parse(event.data);

            addMessage(
                data.username,
                data.text,
                "other"
            );

        };

        function enterChat(){

            const name = usernameInput.value.trim();

            if(!name){

                alert("Digite seu nome");
                return;

            }

            username = name;

            loginScreen.style.display = "none";
            chatScreen.style.display = "flex";

        }

        function sendMessage(){

            const text = input.value.trim();

            if(!text) return;

            if(ws.readyState !== WebSocket.OPEN){

                alert("Servidor desconectado");
                return;

            }

            addMessage(
                username,
                text,
                "me"
            );

            ws.send(JSON.stringify({
                username: username,
                text: text
            }));

            input.value = "";

        }

        enterBtn.addEventListener("click", enterChat);

        usernameInput.addEventListener("keydown", (e)=>{

            if(e.key === "Enter"){

                enterChat();

            }

        });

        sendBtn.addEventListener("click", sendMessage);

        input.addEventListener("keydown", (e)=>{

            if(e.key === "Enter"){

                sendMessage();

            }

        });

    </script>

</body>

</html>
`;

app.get("/", (req, res) => {

  res.send(html);

});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {

  console.log("Cliente conectado");

  ws.on("message", (message) => {

    wss.clients.forEach((client) => {

      if (
        client !== ws &&
        client.readyState === WebSocket.OPEN
      ) {

        client.send(message.toString());

      }

    });

  });

});

server.listen(3000, "0.0.0.0", () => {

  console.log("Servidor rodando:");
  console.log("http://localhost:3000");

});
