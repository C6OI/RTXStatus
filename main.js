"use strict";

const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./helper/config.json');
const token = config.token;
const { createConnection, createServer, Socket } = require("net");
const { createServer: createHTTPServer, request } = require("http");
const { createInterface } = require("readline");

const trace = true;

const host = ""; // TankiX server IP
const port = 5050;

const retryTimeout = 10000;

/** @type {Socket} */
let serverConnection = null;

const rl = createInterface(process.stdin, process.stdout);
rl.on("line", line => {
    if (line === "r")
        serverConnection?.destroy();
    console.log(line);
});
rl.on("close", process.exit);
console.log("Type 'r' to force disconnect from server.");

/** 
 * @typedef { "DISCONNECTED" |
 *            "WAITING_FOR_DATA" |
 *            "OVERLOADED" |
 *            "CONNECTED"
 * } ConnectionState 
 * */

/** @type {ConnectionState} */
let state = "DISCONNECTED";

/** @param {ConnectionState} newState */
const setState = newState => {
    state = newState;
    if (trace)
        console.log(state);
};

/**
 * @param {Buffer} buffer 
 */
const bufferServerData = buffer => {
    console.log("got data from server");

    if (buffer.includes("OVERLOADED")) {
        console.log("server overloaded");
        updateStatus({
            color: "ORANGE",
            title: ":flag_us: Failed to connect\n\n:flag_ru: Не удалось подключиться",
            description: ":flag_us: Server is overcrowded.\nWait for space to become free.\n\n:flag_ru: Сервер переполнен.\nДождитесь, пока освободится место."
        });

        setState("OVERLOADED");
        serverConnection.destroy();
    }
    else {
        setState("CONNECTED");
        updateStatus({
            color: "GREEN",
            title: ":flag_us: Connected\n\n:flag_ru: Подключено",
            description: ":flag_us: Server is online.\nYou can play now!\n\n:flag_ru: Сервер в сети.\nВы можете играть!"
        });
    }
};

function reconnect() {
    setTimeout(connectToServer, retryTimeout);
}

// Proxy <-> Server
const connectToServer = () => {
    console.log("connecting to server...");
    updateStatus({
        color: "ORANGE",
        title: ":flag_us: Please, wait\n\n:flag_ru: Пожалуйста, подождите",
        description: ":flag_us: Connecting to server...\n\n:flag_ru: Подключение к серверу..."
    });

    let proxyToServer = createConnection(port, host);
    proxyToServer.once("connect", async () => {
        console.log("connected to server");
        updateStatus({
            color: "YELLOW",
            title: ":flag_us: Connected\n\n:flag_ru: Подключено",
            description: ":flag_us: Waiting for initial packet...\n\n:flag_ru: Ожидание начального пакета..."
        });

        serverConnection = proxyToServer;
        setState("WAITING_FOR_DATA");

        proxyToServer.on("data", bufferServerData);
    });
    proxyToServer.once("error", () => { });
    proxyToServer.once("close", () => {
        if (state !== "OVERLOADED") {
            updateStatus({
                color: "RED",
                title: ":flag_us: Maintenance\n\n:flag_ru: Технические работы",
                description: ":flag_us: Server on maintenance.\nWait for the server to start.\n\n:flag_ru: Сервер на тех. обслуживании.\nПодождите, пока его снова запустят."
            });
        }
        setState("DISCONNECTED");
        reconnect();
    })
};

let messages;
let lastEmbed, currentEmbed;
/**
 * @example updateStatus({ title: "title" })
 */
async function updateStatus(embed) {
    currentEmbed = embed;
    if (messages instanceof Promise) return;

    while (lastEmbed !== currentEmbed) {
        lastEmbed = currentEmbed;
        let options = {
            embed: embed
        };

        const channels = ["", ""]; // Discord channels ID
        if (!messages)
            messages = Promise.all(channels.map(id => client.channels.resolve(id).send("", options)))
                .then(x => messages = x);
        else
            messages = Promise.all(messages.map(message => message.edit("", options)))
                .then(x => messages = x);
    }
}

client.on("ready", connectToServer);
client.login(token);