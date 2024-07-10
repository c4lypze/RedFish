const { SlashCommandBuilder,PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle ,StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require('discord.js');
const User = require("../../models/UserPlayerSettings");
const GuildSettings = require("../../models/GuildSettings");


module.exports = {
  data: new SlashCommandBuilder()
  .setName('player-settings')
  .setDescription('Customise the music player to your liking'),


  run: async ({ interaction, client, handler }) => {
    try {
        if (!interaction.inGuild()) {
            interaction.reply({content: "You can only run this command in a server.",ephemeral: true});
           return;
          }   
       await interaction.deferReply();
       const hasVotedInLast12Hrs = await client?.topgg?.hasVoted(interaction.user.id);
       const hasAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator); 
       let hasVoted;
       const userId = interaction.user.id;
       let user;
       if (client.topgg) {
       user = await User.findOne({ userId });
       const lastVote = hasVotedInLast12Hrs ? new Date() : null;
 
       // Check if the user exists in the database
       if (!user) {
         user = new User({
           userId: interaction.user.id,
           betaPlayer: false,
           lastVote: lastVote,
           defaultSearchEngine: "spotify",
         });
         user.save();
         hasVoted = lastVote ? true : false;
       } else {
        if (!hasVotedInLast12Hrs) {
        if (!user.lastVote) { 
          hasVoted = false; 
        } else {
         const lastVote = user.lastVote.toDateString();
         const currentDate = new Date().toDateString();
         const timeDiff = Math.abs(new Date(currentDate) - new Date(lastVote));
         const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
         hasVoted = daysDiff >= 3 ? false : true;
        }} else {
         hasVoted = true;
         user.lastVote = new Date();
         await user.save();
        }
    }
       } else {
        hasVoted = true;
        user.betaPlayer = true;
        user.defaultSearchEngine = "youtube";
    }
    let row = new ActionRowBuilder()
    let row2 = null;
    let row3 = null;
    let guildSettings;
    function capitalizeSearchEngine(searchEngine) {
      return {
        "youtube": "YouTube (Beta Player Only)",
        "soundcloud": "SoundCloud",
        "deezer": "Deezer (Beta Player Only)",
      }[searchEngine] || searchEngine.charAt(0).toUpperCase() + searchEngine.slice(1);
    }
    if (hasVoted) {
      const embed = new EmbedBuilder()
        .setTitle("Player Settings")
        .setDescription("Welcome to the player Settings, Here you can customise the music player to your liking! \n\n Please note whoever first creates the queue(when the bot joins the vc) the bot will uses their settings \n\n Currently the beta player is enabled by default and changing it does nothing")
        .setColor("#e66229")
        .setFooter({ text : "More Settings Coming Soon!"}); // Green for success

      if (hasVoted) {
        embed.addFields({ name: "User Settings", value: `Beta Player: ${ user.betaPlayer ? "Enabled" : "Disabled" }\n Default Search engine: ${capitalizeSearchEngine(user.defaultSearchEngine)}`});
        const betaPlayerButton = new ButtonBuilder().setCustomId('betaPlayerButton').setLabel(user.betaPlayer ? "Disable Beta Player" : "Enable Beta Player").setStyle(user.betaPlayer ? ButtonStyle.Danger : ButtonStyle.Success);
        row.addComponents(betaPlayerButton);
        const defaultSearchEngineSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('defaultSearchEngineSelectMenu')
        .setPlaceholder('Default Search engine.')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('YouTube (beta player only)')
            .setValue('youtube'),
            new StringSelectMenuOptionBuilder()
            .setLabel('Spotify')
            .setValue('spotify'),
            new StringSelectMenuOptionBuilder()
            .setLabel('SoundCloud')
            .setValue('soundcloud'),
            new StringSelectMenuOptionBuilder()
            .setLabel('Deezer')
            .setValue('Deezer'),
        )
        .setMaxValues(1);
        row2 = new ActionRowBuilder().addComponents(defaultSearchEngineSelectMenu);
      }
      if (hasAdmin) {
        guildSettings = await GuildSettings.findOne({ guildId: interaction.guildId });
        if (!guildSettings) {
          guildSettings = await GuildSettings.create({ guildId: interaction.guildId, levels: false, defaultVolume: 30 });
        } else {
          if (!guildSettings.defaultVolume) {
            guildSettings.defaultVolume = 30;
            await guildSettings.save();
          }
        }
        embed.addFields({ name: "Server Settings", value: `Default volume: ${guildSettings.defaultVolume}%`,});
        const adminVolumeSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('adminVolumeSelectMenu')
        .setPlaceholder('Server volume.')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('10%')
            .setValue('10'),
            new StringSelectMenuOptionBuilder()
            .setLabel('20%')
            .setValue('20'),
            new StringSelectMenuOptionBuilder()
            .setLabel('30%')
            .setValue('30'),
            new StringSelectMenuOptionBuilder()
            .setLabel('40%')
            .setValue('40'),
            new StringSelectMenuOptionBuilder()
            .setLabel('50%')
            .setValue('50'),
            new StringSelectMenuOptionBuilder()
            .setLabel('60%')
            .setValue('60'),
            new StringSelectMenuOptionBuilder()
            .setLabel('70%')
            .setValue('70'),
            new StringSelectMenuOptionBuilder()
            .setLabel('80%')
            .setValue('80'),
            new StringSelectMenuOptionBuilder()
            .setLabel('90%')
            .setValue('90'),
            new StringSelectMenuOptionBuilder()
            .setLabel('100%')
            .setValue('100'),
        )
        .setMaxValues(1);
         row3 = new ActionRowBuilder().addComponents(adminVolumeSelectMenu);
      }
      const message = await interaction.editReply({ 
        embeds: [embed], 
        components: [row, row2, row3].filter(Boolean), 
        fetchReply: true 
      });
      const collector = message.createMessageComponentCollector({
        idle: 60000,
      });
  
      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) return i.reply({content: "This is not your settings", ephemeral: true});
        i.deferUpdate();

        switch (i.customId) {
          case "betaPlayerButton":
          if (user.betaPlayer) {
            user.betaPlayer = false;
            await user.save();
            embed.data.fields[0].value = `Beta Player: ${ user.betaPlayer ? "Enabled" : "Disabled" }\n Default Search engine: ${capitalizeSearchEngine(user.defaultSearchEngine)}`;
            row.components[0].data.label = "Enable Beta Player";
            row.components[0].data.style = ButtonStyle.Success;
            interaction.editReply({ embeds: [embed], components: [row, row2, row3].filter(Boolean), fetchReply: true })
          } else {
            user.betaPlayer = true;
            await user.save();
            embed.data.fields[0].value = `Beta Player: ${ user.betaPlayer ? "Enabled" : "Disabled" }\n Default Search engine: ${capitalizeSearchEngine(user.defaultSearchEngine)}`;
            row.components[0].data.label = "Disable Beta Player";
            row.components[0].data.style = ButtonStyle.Danger;
            interaction.editReply({ embeds: [embed], components: [row, row2, row3].filter(Boolean), fetchReply: true })
          }
          break;
          case "adminVolumeSelectMenu":
            guildSettings.defaultVolume = i.values[0]
            await guildSettings.save()
            embed.data.fields[1].value = `Default volume: ${guildSettings.defaultVolume}%`;
            interaction.editReply({ embeds: [embed], components: [row, row2, row3].filter(Boolean), fetchReply: true })
          break;
          case "defaultSearchEngineSelectMenu":
            user.defaultSearchEngine = i.values[0];
            await user.save();
            embed.data.fields[0].value = `Beta Player: ${ user.betaPlayer ? "Enabled" : "Disabled" }\n Default Search engine: ${capitalizeSearchEngine(user.defaultSearchEngine)}`;
            interaction.editReply({ embeds: [embed], components: [row, row2, row3].filter(Boolean), fetchReply: true })
          break;
        }
      })
      collector.on("end", () => {
        interaction.editReply({
          components: [],
        });
      });

    } else {
      const embed = new EmbedBuilder()
        .setTitle("Player Settings")
        .setDescription("You need to vote to access player settings.")
        .setColor("#e66229"); 

      const voteButton = new ButtonBuilder().setLabel("Vote").setStyle(ButtonStyle.Link).setURL("https://top.gg/bot/1105149646612987934/");
      row.addComponents(voteButton)
      interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }
          
  } catch (error) {
   console.log("error while running playerSettings",error)   
  }
  },
  // devOnly: Boolean,
  //testOnly: true,
  //deleted: true,
};
