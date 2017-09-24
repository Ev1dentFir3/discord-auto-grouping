const Discord = require('discord.js');
const config = require('./config')

const client = new Discord.Client();
var currentAutoChannels = new Array
const ignoreBots = true
const debug = false


// Connect and perform routine maintenance.
client.on('ready', () => {
	console.log('[' + new Date().toISOString() + '] Connected!');

	// Set the online status.
	client.user.setStatus('online');
});

client.on("message", message => {
	// console prints every message on the server, doesn't exist on release versions
	if (debug == true) { console.log(message) };

	// ignores bots
	if (ignoreBots == true) { if (message.author.bot) return }

	// Let's make creating commands a bit easier shall we?
	if (message.content.indexOf(config.botSettings.prefix) !== 0) return;
	const args = message.content.slice(config.botSettings.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	if (command === help) {
		if (config.groupCreatorPermissions.MANAGE_CHANNELS === true) { var manageChannels = 'Yes' } else { var manageChannels = 'No' }
		if (config.groupCreatorPermissions.MOVE_MEMBERS === true) { var dragOutMembers = 'Yes' } else { var dragOutMembers = 'No' }
		if (config.groupCreatorPermissions.MANAGE_PERMISSIONS === true) { var editPermissions = 'Yes' } else { var editPermissions = 'No' }		
		var help1 = "Auto Channel is an awesome plugin that allows you to create auto channel categories by prefixing a channel with a " + config.botSettings.channelPrefix + " emoji!";
		var help2 = "Join a " + config.botSettings.channelPrefix + " Channel";
		var help3 = "When you join any of the " + config.botSettings.channelPrefix + " Channels a new channel called --Group will be created and you will be moved into it. Other members can now join your newly created group channel just like any other channel.";
		var help4 = "Group Creator Permissions: Rename Channel: " + manageChannels + " Drag Out Members: " + dragOutMembers + " Customized Channel Permissions: " + editPermissions;
		message.channel.send({
			embed: {
				color: 16711680,
				author: {
					name: "Auto-Grouping for Discord",
					icon_url: 'https://i.imgur.com/330CbMq.png'
				},
				title: "How to use Auto Channel!",
				description: help1,
				fields: [{
					name: help2,
					value: help3
				},
				{
					name: "Leaving a --Group channel",
					value: "When everyone leaves the channel I will delete it for you!"
				},
				{
					name: "Group Creators",
					value: help4
				}
				],
				timestamp: new Date(),
				footer: {
					icon_url: 'https://i.imgur.com/330CbMq.png',
					text: "© Crit Cola"
				}
			}
		})
	}
});

// Trigger on VOICE_STATE_UPDATE events.
client.on('voiceStateUpdate', (oldMember, newMember) => {

	// Check if the user entered a new channel.
	console.log(newMember)
	//user wants to create new category
	if (newMember.voiceChannelID) {
		const newChannel = newMember.guild.channels.get(newMember.voiceChannelID);
		console.log(newChannel)
		if (newChannel.name.startsWith(config.botSettings.channelPrefix)) {
			newChannel.clone({
				name: '--' + config.botSettings.newChannelName,
				withPermissions: true,
				withTopic: false,
				reason: 'New autoGroup Channel created by: ' + newMember.displayName
			})
				.then(createdChannel => {
					createdChannel.edit({
						bitrate: 96000,
						userLimit: newChannel.userLimit,
						parentID: newChannel.parentID,
						rawPosition: newChannel + 1,
					})  // add new channel to array, and give permissions if setup in config.
						.then(createdChannel => {
							newMember.setVoiceChannel(createdChannel)
							createdChannel.overwritePermissions(newMember.user, config.groupCreatorPermissions)
							currentAutoChannels.push(createdChannel.id)
						})
				})
		}
	}

	// Check if the user came from another channel.
	if (oldMember.voiceChannelID && typeof (oldMember.guild.channels.get(oldMember.voiceChannelID)) != "undefined") {
		// Delete the user's now empty temporary channel, if applicable.
		const oldChannel = oldMember.guild.channels.get(oldMember.voiceChannelID);
		if (currentAutoChannels.includes(oldChannel.id) && !oldChannel.members.array().length) {
			oldChannel.delete()
		}
	}
});

// Reorder channels when one is created.
client.on('channelCreate', function (channel) {
	if (channel.name !== '--Grpup') {
		if (debug === true) { console.log(currentAutoChannels) }
	}
});

// Reorder channels when one is deleted.
client.on('channelDelete', function (channel) {
	if (currentAutoChannels.includes(channel.id)) {
		for (i = 0; currentAutoChannels.length > i; i++) {
			if (currentAutoChannels[i] === channel.id) {
				currentAutoChannels.splice(i, 1)
			}
		}
		if (debug === true) { console.log(currentAutoChannels) }
	}
});

client.login(config.botSettings.token);
