/**
 * Module Imports
 */
const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");

let TOKEN, PREFIX;
try {
  const config = require("./config.json");
  TOKEN = config.TOKEN;
  PREFIX = config.PREFIX;
} catch (error) {
  TOKEN = process.env.TOKEN;
  PREFIX = process.env.PREFIX;
}

const client = new Client({ disableMentions: "everyone" });

client.login(TOKEN);
client.commands = new Collection();
client.prefix = PREFIX;
client.queue = new Map();
const cooldowns = new Collection();
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Client Events
 */
client.on("ready", () => {
  console.log(`${client.user.username} ready!`);
  client.user.setActivity(`${PREFIX}help`);
});
client.on("warn", (info) => console.log(info));
client.on("error", console.error);

/**
 * Import all commands
 */
const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  client.commands.set(command.name, command);
}

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`);
  if (!prefixRegex.test(message.content)) return;

  const [, matchedPrefix] = message.content.match(prefixRegex);

  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply("There was an error executing that command.").catch(console.error);
  }
});

client.on("message", m => {
  if (m.content === PREFIX + "invite") {
    var addserver =
      "https://discord.com/api/oauth2/authorize?client_id=762156775716945983&permissions=1878523713&scope=bot";

    let embed = new MessageEmbed()
      .setAuthor("Click Here Invite", client.user.displayAvatarURL())
      .setFooter(m.author.tag, m.author.avatarURL())
      .setThumbnail(client.user.displayAvatarURL())

      .setColor("#FF0074").setDescription(`
** -[Add To Your Server](${addserver})**    

`);
    m.react(":746270103498391562:762643465506390037");
    m.channel.send(embed);
  }
});

client.on("message", m => {
  if (m.content === PREFIX + "support") {
    var addserver = "https://discord.gg/KbArr23";

    let embed = new MessageEmbed()
      .setAuthor("Server  Support", client.user.displayAvatarURL())
      .setFooter(m.author.tag, m.author.avatarURL())

      .setColor("#FF0074").setDescription(`
** | [Server  Support](${addserver})**    

`);
    m.react(":746270103498391562:762643465506390037");
    m.channel.send(embed);
  }
});

client.on("message", message => {
  if (message.content.startsWith(PREFIX + "botinfo")) {
    message.channel.send({
      embed: new MessageEmbed()
        .setAuthor(client.user.username, client.user.avatarURL)
        .setThumbnail(client.user.displayAvatarURL())

        .setColor("#E91E63")
        .setTitle("BOT INFO")

        .addField(
          "``My Ping``",
          [`${Date.now() - message.createdTimestamp}` + "MS"],
          true
        )

        .setAuthor(" ", client.user.displayAvatarURL())
        .addField("``servers``", [client.guilds.cache.size], true)
        .addField("``channels``", `[ ${client.channels.cache.size} ]`, true)
        .addField("``Users``", `[ ${client.users.cache.size} ]`, true)
        .addField("``My Name``", `[ ${client.user.tag} ]`, true)
        .addField("``My ID``", `[ ${client.user.id} ]`, true)
        .addField("``My Prefix``", `[ ${PREFIX} ]`, true)
        .addField("``My Language``", `[ JavaScript ]`, true)
        .addField("``Bot Version``", `[ v1.0 ]`, true)
    });
  }
});

