const { Client, Interaction, ApplicationCommandOptionType , SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Player, QueryType } = require('discord-player');
module.exports =  {
    data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music/playlist in a vc.")
    .addStringOption(option => option
        .setName("name")
        .setDescription("name of the song")
        .setRequired(true)),


  run: async({ interaction, client, handler }) => {
    if (!interaction.inGuild()) {
      interaction.reply({
        content: "You can only run this command in a server.",
        ephemeral: true,
      });
     return;
    }
    await interaction.deferReply();
    const channel = interaction.member.voice.channel;
    if (!channel) return interaction.editReply({content: 'You are not connected to a voice channel',ephemeral: true,})

    const name = interaction.options.getString('name'); 
    const searchResult = await player.search(name, {
        requestedBy: interaction.user,
      });
      if (!searchResult.hasTracks()) {
        return interaction.followUp(`We found no tracks for ${name}`);
      }
    try {
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
 
          const message = res.track.playlist
          ? `Successfully enqueued **track(s)** from: **${res.track.playlist.title}**`
          : `Successfully enqueued: **${res.track.author} - ${res.track.title}**`; 
          return interaction.editReply({ content: message });
        } 
          catch (e) {
        // let's return error if something failed
        return interaction.editReply(`Something went wrong: ${e}`);
    }
  },

  // devOnly: Boolean,
  //testOnly: true,
  // options: Object[],
  // deleted: true

};
