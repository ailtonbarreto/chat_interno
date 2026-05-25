const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();

const html = `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

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
            overflow:hidden;
        }

        .login-screen,
        .chat-screen{
            width:100%;
            height:100vh;
            display:flex;
            justify-content:center;
            align-items:center;
            padding:15px;
        }

        .login-box{
            width:100%;
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
            background:white;
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
            transition:.2s;
        }

        button:hover{
            opacity:.9;
        }

        .chat-container{
            width:100%;
            max-width:550px;
            height:95vh;
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

        .messages::-webkit-scrollbar{
            width:5px;
        }

        .messages::-webkit-scrollbar-thumb{
            background:#334155;
            border-radius:10px;
        }

        .message{
            max-width:80%;
            padding:12px;
            border-radius:15px;
            word-wrap:break-word;
            color:white;
            animation:fade .2s ease;
        }

        @keyframes fade{
            from{
                opacity:0;
                transform:translateY(10px);
            }
            to{
                opacity:1;
                transform:translateY(0);
            }
        }

        .username{
            font-size:12px;
            margin-bottom:5px;
            opacity:.85;
            font-weight:bold;
        }

        .input-area{
            display:flex;
            gap:10px;
            padding:10px;
            background:#0f172a;
        }

        .input-area input{
            flex:1;
        }

        @media(max-width:600px){

            .chat-container{
                height:100vh;
                border-radius:0;
            }

            .message{
                max-width:90%;
            }

        }

    </style>

</head>

<body>

    <div
        class="login-screen"
        id="loginScreen"
    >

        <div class="login-box">

            <h1>Entrar no Chat</h1>

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
                Chat Interno
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

        const loginScreen =
            document.getElementById(
                "loginScreen"
            );

        const chatScreen =
            document.getElementById(
                "chatScreen"
            );

        const usernameInput =
            document.getElementById(
                "usernameInput"
            );

        const enterBtn =
            document.getElementById(
                "enterBtn"
            );

        const messages =
            document.getElementById(
                "messages"
            );

        const input =
            document.getElementById(
                "messageInput"
            );

        const sendBtn =
            document.getElementById(
                "sendBtn"
            );

        const status =
            document.getElementById(
                "status"
            );

        let username = "";

        // =====================================
        // PEDIR PERMISSÃO
        // =====================================

        if("Notification" in window){

            Notification.requestPermission()
            .then(permission => {

                console.log(
                    "Permissão:",
                    permission
                );

            });

        }

        // =====================================
        // SERVICE WORKER
        // =====================================

        if(
            "serviceWorker" in navigator
        ){

            navigator.serviceWorker
            .register(
                "data:text/javascript,self.addEventListener('notificationclick',function(event){event.notification.close();clients.openWindow('/')})"
            )
            .then(() => {

                console.log(
                    "Service Worker registrado"
                );

            })
            .catch(err => {

                console.log(err);

            });

        }

        // =====================================
        // WEBSOCKET
        // =====================================

        const protocol =
            location.protocol === "https:"
            ? "wss:"
            : "ws:";

        const ws = new WebSocket(
            \`\${protocol}//\${location.host}\`
        );

        ws.onopen = () => {

            status.innerText =
                "🟢 Conectado";

        };

        ws.onclose = () => {

            status.innerText =
                "🔴 Desconectado";

        };

        ws.onerror = (err) => {

            console.log(err);

        };

        // =====================================
        // CORES DOS USUÁRIOS
        // =====================================

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

            let hash = 5381;

            for(
                let i = 0;
                i < name.length;
                i++
            ){

                hash =
                    (hash * 33) ^
                    name.charCodeAt(i);

            }

            hash = Math.abs(hash);

            return colors[
                hash % colors.length
            ];

        }

        // =====================================
        // ADICIONAR MENSAGEM
        // =====================================

        function addMessage(
            user,
            text,
            type
        ){

            const div =
                document.createElement(
                    "div"
                );

            div.classList.add(
                "message"
            );

            if(type === "me"){

                div.style.background =
                    "#06A95D";

                div.style.alignSelf =
                    "flex-end";

            }else{

                div.style.background =
                    getUserColor(user);

                div.style.alignSelf =
                    "flex-start";

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

            messages.scrollTop =
                messages.scrollHeight;

        }

        // =====================================
        // NOTIFICAÇÃO
        // =====================================

        function showNotification(
            user,
            text
        ){

            console.log(
                "Tentando notificação..."
            );

            if(
                Notification.permission
                === "granted"
            ){

                navigator
                .serviceWorker
                ?.getRegistration()
                .then(reg => {

                    if(reg){

                        reg.showNotification(
                            "Nova mensagem",
                            {
                                body:
                                    user +
                                    ": " +
                                    text,

                                icon:
                                    "https://cdn-icons-png.flaticon.com/512/5968/5968770.png",

                                vibrate:
                                    [200,100,200]
                            }
                        );

                    }else{

                        new Notification(
                            "Nova mensagem",
                            {
                                body:
                                    user +
                                    ": " +
                                    text,

                                icon:
                                    "https://cdn-icons-png.flaticon.com/512/5968/5968770.png"
                            }
                        );

                    }

                });

            }else{

                console.log(
                    "Permissão negada"
                );

            }

        }

        // =====================================
        // RECEBER MENSAGEM
        // =====================================

        ws.onmessage = (event) => {

            const data =
                JSON.parse(
                    event.data
                );

            addMessage(
                data.username,
                data.text,
                "other"
            );

            showNotification(
                data.username,
                data.text
            );

        };

        // =====================================
        // ENTRAR
        // =====================================

        function enterChat(){

            const name =
                usernameInput
                .value
                .trim();

            if(!name){

                alert(
                    "Digite seu nome"
                );

                return;

            }

            username = name;

            loginScreen.style.display =
                "none";

            chatScreen.style.display =
                "flex";

            input.focus();

        }

        // =====================================
        // ENVIAR MENSAGEM
        // =====================================

        function sendMessage(){

            const text =
                input.value.trim();

            if(!text) return;

            if(
                ws.readyState !==
                WebSocket.OPEN
            ){

                alert(
                    "Servidor desconectado"
                );

                return;

            }

            addMessage(
                username,
                text,
                "me"
            );

            // NOTIFICAÇÃO DA PRÓPRIA MSG
            showNotification(
                username,
                text
            );

            ws.send(JSON.stringify({
                username: username,
                text: text
            }));

            input.value = "";

            input.focus();

        }

        // =====================================
        // EVENTOS
        // =====================================

        enterBtn.addEventListener(
            "click",
            enterChat
        );

        usernameInput.addEventListener(
            "keydown",
            (e)=>{

                if(
                    e.key === "Enter"
                ){

                    enterChat();

                }

            }
        );

        sendBtn.addEventListener(
            "click",
            sendMessage
        );

        input.addEventListener(
            "keydown",
            (e)=>{

                if(
                    e.key === "Enter"
                ){

                    sendMessage();

                }

            }
        );

    </script>

</body>

</html>
`;

app.get("/", (req, res) => {

    res.send(html);

});

const server = http.createServer(app);

const wss = new WebSocket.Server({
    server
});

wss.on("connection", (ws) => {

    console.log(
        "Cliente conectado"
    );

    ws.on("message", (message) => {

        wss.clients.forEach(
            (client) => {

                if(
                    client.readyState ===
                    WebSocket.OPEN
                ){

                    client.send(
                        message.toString()
                    );

                }

            }
        );

    });

    ws.on("close", () => {

        console.log(
            "Cliente desconectado"
        );

    });

});

server.listen(
    3000,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "🚀 Servidor rodando"
        );

        console.log(
            "http://localhost:3000"
        );

        console.log("");

    }
);