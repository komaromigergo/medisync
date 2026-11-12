// MediSync – chipkártya-olvasó híd (csak a saját gépen, 127.0.0.1:8787)
// Kiolvassa a kártya jelenlétét és típusjelét (ATR). Személyes adatot NEM olvas.
// Indítás: npm install && npm start      (olvasó nélküli próba: npm run demo)
const { WebSocketServer } = require("ws");

const PORT = 8787;
const DEMO = process.argv.includes("--demo");
const ALLOWED = [
  /^https:\/\/(demo\.)?medisync\.hu$/,
  /^https:\/\/medisync-[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

const state = { readers: [], card: null };
const wss = new WebSocketServer({
  host: "127.0.0.1",
  port: PORT,
  verifyClient: ({ origin }) => !origin || ALLOWED.some((r) => r.test(origin)),
});
const send = (ws, msg) => ws.readyState === 1 && ws.send(JSON.stringify(msg));
const broadcast = (msg) => wss.clients.forEach((c) => send(c, msg));
const pushState = () => broadcast({ type: "state", readers: state.readers, card: state.card });

wss.on("connection", (ws) => send(ws, { type: "state", readers: state.readers, card: state.card }));
wss.on("listening", () => console.log(`MediSync olvasó-híd fut: ws://127.0.0.1:${PORT}${DEMO ? "  (DEMÓ mód, nincs valódi olvasó)" : ""}`));

function cardIn(atr, reader) {
  state.card = { atr, reader };
  console.log(`Kártya behelyezve (ATR ${atr})`);
  broadcast({ type: "card", atr, reader });
}
function cardOut(reader) {
  state.card = null;
  console.log("Kártya kivéve");
  broadcast({ type: "remove", reader });
}

if (DEMO) {
  state.readers = ["Demó olvasó"];
  const ATR = "3B9F95803FC3A08031E073FE211B63C10D";
  setInterval(() => (state.card ? cardOut("Demó olvasó") : cardIn(ATR, "Demó olvasó")), 6000);
} else {
  let pcsc;
  try {
    pcsc = require("pcsclite")();
  } catch (e) {
    console.error("A pcsclite nem tölthető be. Futtassa: npm install (macOS-en az Xcode parancssori eszközök kellenek: xcode-select --install)\n", e.message);
    process.exit(1);
  }
  pcsc.on("error", (e) => console.error("PC/SC hiba:", e.message));
  pcsc.on("reader", (reader) => {
    console.log("Olvasó csatlakoztatva:", reader.name);
    state.readers = [...new Set([...state.readers, reader.name])];
    pushState();
    reader.on("error", (e) => console.error("Olvasóhiba:", e.message));
    reader.on("status", (status) => {
      const changes = reader.state ^ status.state;
      if (!changes) return;
      if (changes & reader.SCARD_STATE_EMPTY && status.state & reader.SCARD_STATE_EMPTY) {
        cardOut(reader.name);
      } else if (changes & reader.SCARD_STATE_PRESENT && status.state & reader.SCARD_STATE_PRESENT) {
        const atr = status.atr ? Buffer.from(status.atr).toString("hex").toUpperCase() : "ISMERETLEN";
        cardIn(atr, reader.name);
      }
      reader.state = status.state;
    });
    reader.on("end", () => {
      console.log("Olvasó leválasztva:", reader.name);
      state.readers = state.readers.filter((n) => n !== reader.name);
      state.card = null;
      pushState();
    });
  });
}
