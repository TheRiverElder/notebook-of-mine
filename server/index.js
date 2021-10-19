const WS = require('nodejs-websocket');
const fs = require('fs');
const path = require('path');

const files = new Map();

function prepareServer() {

    const clients = new Set();
    let clientList = [];

    function addClient(client) {
        clients.add(client);
        clientList = Array.from(clients);
    }

    function removeClient(client) {
        clients.delete(client);
        clientList = Array.from(clients);
    }

    function broadcast(data, except) {
        for (const client of clientList) {
            if (client !== except) {
                client.sendText(data);
            }
        }
    }

    const handlers = {
        "getFileInfoList": () => {
            
        },
    };

    const server = WS.createServer(connection => {
        console.log("Connection established");
        addClient(connection);

        connection.on("text", str => {
            console.log("Received", str);

            try {
                const data = JSON.parse(str);

                const { fileName, content } = data;
                let file = files.get(fileName);
                if (!file) {
                    file = loadFile(fileName) || {
                        name: fileName,
                        dirty: true,
                        content,
                    };
                    files.set(fileName, file);
                }
                if (content) {
                    file.content = content;
                    file.dirty = true;
                }

                const broadcastData = {
                    fileName: file.name,
                    content: file.content,
                };
                const broadcastStr = JSON.stringify(broadcastData);

                if (typeof content !== 'string') {
                    broadcast(broadcastStr);
                } else {
                    broadcast(broadcastStr, connection);
                }
            } catch (e) {
                console.error(e);
            }
        });

        connection.on("error", (error) => {
            console.log("Connection error", error);
        });

        connection.on("close", (code, reason) => {
            console.log("Connection closed, exit code: ", code, reason);
            removeClient(connection);
        });
    });

    return () => server.listen(8081);
}

const dataDir = './files';

function saveFile(file) {
    if (file.dirty) {
        const filePath = path.resolve('./files', file.name);
        fs.writeFile(filePath, file.content, { encoding: 'UTF-8' });
        file.dirty = false;
    }
}

function loadFile(fileName) {
    const filePath = path.resolve('./files', fileName);
    try {
        const content = fs.readFileSync(filePath, { encoding: 'UTF-8' });
        const file = {
            name: fileName,
            dirty: false,
            content,
        };
        return file;
    } catch (e) {
        return null;
    }
}

function persistLoop() {
    const loop = () => {
        for (const file of Array.from(files.values())) {
            saveFile(file);
        }
    };
    return () => setInterval(loop, 1000 * 60 * 10);
}

function startUp() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
}

startUp();
const startServer = prepareServer();
const startLoop = persistLoop();
startServer();
startLoop();