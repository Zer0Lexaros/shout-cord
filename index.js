const Discord = require('discord.js');
const config = require('./myconfig.json');
const prefix = config.prefix || process.env.PREFIX;
const token = config.token || process.env.TOKEN;
const client = new Discord.Client();

const stationMap = new Map();

// Discord.JS INIT
client.once('ready', () => {
    console.log("Connected to Discord");
    //TODO
});

client.once('reconnecting', () => {
    console.log("Reconnecting...");
    //TODO
});

client.once('disconnect', () => {
    console.log("Disconnected X_X");
});

client.login(token)
//END INIT

// Message/Command checking
client.on('message', async message => {
    // Check Author isn't bot and doesn't have the prefix, returns nothing.
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverStation = stationMap.get(message.guild.id);

    // Useable Commands
    if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverStation);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverStation);
        return;
    } else if (message.content.startsWith(`${prefix}help`)) {
        message.channel.send(`${prefix}play <url> - Plays radio from the stream provided \n${prefix}stop - Stops radio and disconnects\n${prefix}stations - A link to a radio station directory`);
    } else if (message.content.startsWith(`${prefix}stations`)) {
        message.channel.send(`Need a station? Go here http://dir.xiph.org/ and right click on play and copy location. After that punch in ${prefix}play then the URL and I will play it!`)
    } else {
        message.channel.send("You need to enter a valid command!");
    }


})


// Start Playing Broadcast
async function execute(message) {

    // turn everything after space into the argument
    const args = message.content.split(" ");

    // Set Voice Channel ID
    const VC = message.member.voice.channel;

    // Voice Channel and Permission Checking
    if (!VC) {
        return message.reply('You need to be in a voice channel for me to join');
    }
    const permissions = VC.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.reply(
            "I need the permissions to join and speak in your voice channel!"
        );
    }

    const station = args[1];
    //   const station={
    //       url:stationURL
    //   }


    const stationContruct = {
        textChannel: message.channel,
        voiceChannel: VC,
        connection: null,
        station: [],
        volume: 5,
        playing: true
    };

    stationMap.set(message.guild.id, stationContruct);
    stationContruct.station.push(station);

    try {
        var connection = await VC.join();
        stationContruct.connection = connection;
        play(message.guild, stationContruct.station[0]);
    } catch (err) {
        console.log(err);
        stationMap.delete(message.guild.id);
        return message.channel.send(err);
    }


}

// Stop Broadcast
function stop(message, stationQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );
    //stationQueue.station = null;
    stationQueue.connection.dispatcher.end();
    stationQueue.voiceChannel.leave();
}

function play(guild, station) {
    const stationQueue = stationMap.get(guild.id);
    if (!station) {
        stationQueue.voiceChannel.leave();
        stationMap.delete(guild.id);
        return;
    }

    const dispatcher = stationQueue.connection
        .play(station)
        .on("finish", () => {
            stationQueue.textChannel.send('Radio Stopped')
            stationQueue.voiceChannel.leave();
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(stationQueue.volume / 5);
    stationQueue.textChannel.send(`Playing Radio`);
}