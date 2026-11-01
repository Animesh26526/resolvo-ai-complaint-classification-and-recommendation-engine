// Application entry point initializing environment variables, database connection, and HTTP server.

require("dotenv").config();

const app = require("./src/app");
const connectDatabase = require("./src/db/db");

const PORT = process.env.PORT || 5000;


const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

async function startServer() {
    try {
        await connectDatabase();

        const server = http.createServer(app);

        server.listen(PORT, () => {
            console.log(`Resolvo backend server is running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start backend server:", error.message);
        process.exit(1);
    }
}


startServer();
