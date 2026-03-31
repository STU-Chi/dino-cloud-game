const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 10000;

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    clients: wss.clients.size,
  });
});

function send(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(msg);
    }
  });
}

function getState() {
  let espConnected = false;
  let webCount = 0;
  let espCount = 0;

  wss.clients.forEach((client) => {
    if (client.role === "esp") {
      espConnected = true;
      espCount++;
    }
    if (client.role === "web") {
      webCount++;
    }
  });

  return { espConnected, webCount, espCount };
}

function broadcastState() {
  broadcast({
    type: "state",
    ...getState(),
  });
}

wss.on("connection", (ws) => {
  ws.role = "unknown";
  ws.isAlive = true;

  send(ws, { type: "welcome" });
  send(ws, { type: "state", ...getState() });

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "hello") {
      ws.role = msg.role === "esp" ? "esp" : "web";
      broadcastState();
      return;
    }

    if (msg.type === "jump") {
      broadcast({
        type: "jump",
        source: ws.role,
      });
      return;
    }

    if (msg.type === "settings") {
      broadcast({
        type: "settings",
        volume: msg.volume ?? 50,
        sensitivity: msg.sensitivity ?? 50,
      });
      return;
    }
  });

  ws.on("close", () => {
    broadcastState();
  });
});

const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  clearInterval(heartbeat);
  server.close(() => process.exit(0));
});