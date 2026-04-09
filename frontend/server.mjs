import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
console.log("WebSocket Server running on ws://localhost:8080");

let waitingPlayer = null;

wss.on('connection', (ws) => {
    console.log('New client connected');

    if (!waitingPlayer) {
        // First player connects
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: 'init', playerIndex: 1, message: 'Waiting for opponent...' }));
    } else {
        // Second player connects
        const p1 = waitingPlayer;
        const p2 = ws;
        waitingPlayer = null;

        p2.send(JSON.stringify({ type: 'init', playerIndex: 2, message: 'Opponent found!' }));
        p1.send(JSON.stringify({ type: 'start', message: 'Opponent found! Battle starts now.' }));
        p2.send(JSON.stringify({ type: 'start', message: 'Opponent found! Battle starts now.' }));

        // Map events between P1 and P2
        p1.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            // Relay to p2
            p2.send(JSON.stringify({ type: 'action', action: data.action, player: 1 }));
        });

        p2.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            // Relay to p1
            p1.send(JSON.stringify({ type: 'action', action: data.action, player: 2 }));
        });

        const handleDisconnect = () => {
            if (p1.readyState === 1) p1.send(JSON.stringify({ type: 'disconnect' }));
            if (p2.readyState === 1) p2.send(JSON.stringify({ type: 'disconnect' }));
        };

        p1.on('close', handleDisconnect);
        p2.on('close', handleDisconnect);
    }

    ws.on('error', console.error);
});
