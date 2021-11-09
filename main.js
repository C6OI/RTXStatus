"use strict";

const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./helper/config.json');
const { createConnection, createServer, Socket } = require("net");
const { createServer: createHTTPServer, request } = require("http");
const { createInterface } = require("readline");
if (!["ru", "en", "all"].includes(config.lang)) delete config.lang;
const token = config.token;
const lang = require("./helper/lang")[config.lang ?? "all"];
const ip = config.serverIP;
const channelsID = config.channels;

const trace = true;

const host = ip; // TankiX server IP
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
            title: lang["connectFailed"],
            description: lang["overcrowded"],
            footer: {text: "Developed by C6OI#6060", iconURL: "https://cdn.discordapp.com/attachments/714193973509357600/907229588906704956/New_Logo_2.png"}
        });

        setState("OVERLOADED");
        serverConnection.destroy();
    }
    else {
        setState("CONNECTED");
        updateStatus({
            color: "GREEN",
            title: lang["connected"],
            description: lang["serveIsOnline"],
			footer: {text: "Developed by C6OI#6060", iconURL: "https://cdn.discordapp.com/attachments/714193973509357600/907229588906704956/New_Logo_2.png"}
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
        title: lang["pleaseWait"],
        description: lang["connecting"],
		footer: {text: "Developed by C6OI#6060", iconURL: "https://cdn.discordapp.com/attachments/714193973509357600/907229588906704956/New_Logo_2.png"}
    });

    let proxyToServer = createConnection(port, host);
    proxyToServer.once("connect", async () => {
        console.log("connected to server");
        updateStatus({
            color: "YELLOW",
            title: lang["connected"],
            description: ["waiting"],
			footer: {text: "Developed by C6OI#6060", iconURL: "https://cdn.discordapp.com/attachments/714193973509357600/907229588906704956/New_Logo_2.png"}
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
                title: lang["maintenance"],
                description: lang["serverIsOnMaintenance"],
				footer: {text: "Developed by C6OI#6060", iconURL: "https://cdn.discordapp.com/attachments/714193973509357600/907229588906704956/New_Logo_2.png"}
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

        const channels = channelsID; // Discord channels ID
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
