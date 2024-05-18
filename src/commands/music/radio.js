const { Client, Interaction, ApplicationCommandOptionType , SlashCommandBuilder, EmbedBuilder ,ComponentType ,PermissionsBitField} = require("discord.js");
const { Player, QueryType, useMainPlayer } = require('discord-player');
const axios = require('axios')
module.exports =  {
    data: new SlashCommandBuilder()
    .setName("radio")
    .setDescription("play a radio station  in a voice channel")
    .addStringOption(option => option
        .setName("name")
        .setDescription("name of the station")
        .setRequired(true)),


  run: async({ interaction, client, handler }) => {
    if (!interaction.inGuild()) {
      interaction.reply({
        content: "You can only run this command in a server.",
        ephemeral: true,
      });
     return;
    }
    const channel = interaction.member.voice.channel;
    if (!channel) return interaction.reply({content: 'You are not connected to a voice channel',ephemeral: true,}); 
   
    await interaction.deferReply();


    const name = interaction.options.getString('name'); 
    try {
      let { data } = await axios.get(`https://nl1.api.radio-browser.info/json/stations/byname/${encodeURIComponent(name)}`)
      if (data.length < 1) {
        return await interaction.followUp({ content: `❌ | No radio station was found, A full list can be found [here](https://www.radio-browser.info/search?page=1&hidebroken=true&order=votes&reverse=true)` })}

    switch (client.playerType) {
      case "both":
        break;

        case "discord_player":
            const player = useMainPlayer();
            const searchResult = await player.search(data[0].url_resolved, {
              requestedBy: interaction.user,
            });
            const res = await player.play(
              interaction.member.voice.channel.id,
              searchResult, 
              {
                nodeOptions: {
                  metadata: {
                    channel: interaction.channel,
                    client: interaction.guild.members.me,
                    requestedBy: interaction.user,
  
  
                  },
                  bufferingTimeout: 15000,
                  leaveOnEmpty: true,
                  leaveOnEmptyCooldown: 300000,
                  skipOnNoStream: true,
                  connectionTimeout: 999_999_999
                },
              }
            );
   
            if (!interaction.guild.members.me.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.ViewChannel) || !interaction.guild.members.me.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.SendMessages)) {
                  const embed = new EmbedBuilder()
                      .setColor('#e66229')
                      .setDescription(`**Enqueued: [${name}](${res.track.url}) -** \`LIVE\``)
                      .setFooter({ text: `Media Controls Disabled: Missing Permissions` });
                  return interaction.editReply({ embeds: [embed] });
          } else {
                const embed = new EmbedBuilder()
                .setColor('#e66229')
                .setDescription(`**Enqueued: [${name}](${res.track.url}) -** \`LIVE\``)
                 return interaction.editReply({ embeds: [embed] });
            }
         
 
        break;

        case "lavalink":
          try {
          const player = await client.manager.createPlayer({
            guildId: interaction.guild.id,
            textId: interaction.channel.id,
            voiceId: channel.id,
            volume: 30,
            deaf: true
        });

        const res = await player.search(data[0].url_resolved, { requester: interaction.user });
        if (!res.tracks.length) return interaction.editReply("No results found!");
        player.queue.add(res.tracks[0]);
        if (!player.playing && !player.paused) player.play();

        if (!interaction.guild.members.me.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.ViewChannel) || !interaction.guild.members.me.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.SendMessages)) {
          const embed = new EmbedBuilder()
              .setColor('#e66229')
              .setDescription(`**Enqueued: [${name}](${res.tracks[0].uri}) -** \`LIVE\``)
              .setFooter({ text: `Media Controls Disabled: Missing Permissions` });
            return interaction.editReply({ embeds: [embed] });
       } else {
             const embed = new EmbedBuilder()
             .setColor('#e66229')
             .setDescription(`**Enqueued: [${name}](${res.tracks[0].uri}) -** \`LIVE\``)
            return interaction.editReply({ embeds: [embed] });
    }
        if (res.type === "PLAYLIST") {
            for (let track of res.tracks) player.queue.add(track);

            if (!player.playing && !player.paused) player.play();

            const embed = new EmbedBuilder()
                .setColor('#e66229')
                .setDescription(`**Enqueued: [${res.playlistName}](${name}) (${res.tracks.length} tracks**)`)
            return interaction.editReply({ content: " ", embeds: [embed] })
        } else {
            player.queue.add(res.tracks[0]);

            if (!player.playing && !player.paused) player.play();
            const embed = new EmbedBuilder()
                .setColor('#e66229')
                .setDescription(`**Enqueued: [${res.tracks[0].title}](${res.tracks[0].uri}) - ${res.tracks[0].author}** \`${convertTime(res.tracks[0].length, true)}\``)
            return interaction.editReply({ content: " ", embeds: [embed] })
        }
      }
        catch (e) {
          console.log(e)
      return interaction.editReply(`Something went wrong: ${e}`);
        }
        break;
    
      default:
        break;
    }
  } 
  catch (e) {
    console.log(`Error with radio `, 'query: ', name ,'error: ', e)
    return interaction.editReply(`Unable to play ${name} due to an error`);
}

  }

  // devOnly: Boolean,
  //testOnly: true,
  // options: Object[],
  // deleted: true

};
