/**
 * Music Commands - All music-related slash commands using DisTube
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  PermissionFlagsBits,
  EmbedBuilder,
  MessageFlags
} from 'discord.js';

import { DisTube } from 'distube';

/**
 * Register all music commands
 */
export function registerMusicCommands(commandsArray: any[]): void {
  // Play command
  const playCommand = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube or search query')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Song name or YouTube URL')
        .setRequired(true)
    )
    .toJSON();

  // Skip command
  const skipCommand = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song')
    .toJSON();

  // Stop command
  const stopCommand = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playing music and clear the queue')
    .toJSON();

  // Pause command
  const pauseCommand = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song')
    .toJSON();

  // Resume command
  const resumeCommand = new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song')
    .toJSON();

  // Queue command
  const queueCommand = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue')
    .toJSON();

  // Volume command
  const volumeCommand = new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the music volume (0-100)')
    .addIntegerOption(option =>
      option
        .setName('level')
        .setDescription('Volume level (0-100)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100)
    )
    .toJSON();

  // Shuffle command
  const shuffleCommand = new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the current queue')
    .toJSON();

  // Leave command
  const leaveCommand = new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Make the bot leave the voice channel')
    .toJSON();

  // Now playing command
  const nowPlayingCommand = new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing song')
    .toJSON();

  // Remove command
  const removeCommand = new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a song from the queue')
    .addIntegerOption(option =>
      option
        .setName('position')
        .setDescription('Position in queue to remove (1-based)')
        .setRequired(true)
        .setMinValue(1)
    )
    .toJSON();

  commandsArray.push(
    playCommand,
    skipCommand,
    stopCommand,
    pauseCommand,
    resumeCommand,
    queueCommand,
    volumeCommand,
    shuffleCommand,
    leaveCommand,
    nowPlayingCommand,
    removeCommand
  );
}

/**
 * Handle music command interactions
 */
export async function handleMusicCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube
): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({
      content: 'This command can only be used in a server!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const member = interaction.member as GuildMember;
  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'play':
        await handlePlayCommand(interaction, distube, member);
        break;
      
      case 'skip':
        await handleSkipCommand(interaction, distube);
        break;
      
      case 'stop':
        await handleStopCommand(interaction, distube);
        break;
      
      case 'pause':
        await handlePauseCommand(interaction, distube);
        break;
      
      case 'resume':
        await handleResumeCommand(interaction, distube);
        break;
      
      case 'queue':
        await handleQueueCommand(interaction, distube);
        break;
      
      case 'volume':
        await handleVolumeCommand(interaction, distube);
        break;
      
      case 'shuffle':
        await handleShuffleCommand(interaction, distube);
        break;
      
      case 'leave':
        await handleLeaveCommand(interaction, distube);
        break;
      
      case 'nowplaying':
        await handleNowPlayingCommand(interaction, distube);
        break;
      
      case 'remove':
        await handleRemoveCommand(interaction, distube);
        break;
      
      default:
        await interaction.reply({
          content: 'Unknown music command.',
          flags: MessageFlags.Ephemeral
        });
    }
  } catch (error) {
    console.error(`Error handling music command ${commandName}:`, error);
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'An error occurred while processing the music command.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
}

/**
 * Handle the play command
 */
async function handlePlayCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube,
  member: GuildMember
): Promise<void> {
  // Check if user is in a voice channel
  if (!member.voice.channel) {
    await interaction.reply({
      content: '❌ You need to be in a voice channel to play music!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Check bot permissions
  const permissions = member.voice.channel.permissionsFor(interaction.guild!.members.me!);
  if (!permissions?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
    await interaction.reply({
      content: '❌ I need permission to connect and speak in your voice channel!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const query = interaction.options.getString('query', true);
  
  await interaction.deferReply();

  try {
    await distube.play(member.voice.channel, query, {
      textChannel: interaction.channel as any,
      member: member
    });
    
    // Send success message instead of deleting
    await interaction.editReply('✅ Added to queue! Check the channel for details.');
  } catch (error: any) {
    console.error('Play command error:', error);
    const errorMessage = error?.message || 'An unknown error occurred';
    await interaction.editReply(`❌ Error: ${errorMessage}`);
  }
}

/**
 * Handle the skip command
 */
async function handleSkipCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube
): Promise<void> {
  const queue = distube.getQueue(interaction.guild!);
  if (!queue) {
    await interaction.reply({
      content: '❌ No music is currently playing!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    await queue.skip();
    await interaction.reply('⏭️ Skipped the current track!');
  } catch (error) {
    await interaction.reply({
      content: '❌ Nothing to skip!',
      flags: MessageFlags.Ephemeral
    });
  }
}

/**
 * Handle the stop command
 */
async function handleStopCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube
): Promise<void> {
  const queue = distube.getQueue(interaction.guild!);
  if (!queue) {
    await interaction.reply({
      content: '❌ No music is currently playing!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await queue.stop();
  await interaction.reply('⏹️ Stopped playing music and cleared the queue!');
}

/**
 * Handle the pause command
 */
async function handlePauseCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube
): Promise<void> {
  const queue = distube.getQueue(interaction.guild!);
  if (!queue) {
    await interaction.reply({
      content: '❌ No music is currently playing!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (queue.paused) {
    await interaction.reply({
      content: '❌ Music is already paused!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  queue.pause();
  await interaction.reply('⏸️ Paused the current track!');
}

/**
 * Handle the resume command
 */
async function handleResumeCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube
): Promise<void> {
  const queue = distube.getQueue(interaction.guild!);
  if (!queue) {
    await interaction.reply({
      content: '❌ No music is currently playing!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (!queue.paused) {
    await interaction.reply({
      content: '❌ Music is not paused!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  queue.resume();
  await interaction.reply('▶️ Resumed the current track!');
}

/**
 * Handle the queue command
 */
async function handleQueueCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube
): Promise<void> {
  const queue = distube.getQueue(interaction.guild!);
  if (!queue) {
    await interaction.reply({
      content: '❌ No music queue found!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎵 Music Queue')
    .setColor(0x00FF00)
    .setTimestamp();

  const currentSong = queue.songs[0];
  if (currentSong) {
    embed.addFields({
      name: '🎵 Now Playing',
      value: `**${currentSong.name}**\nRequested by: ${currentSong.user}`,
      inline: false
    });
  }

  if (queue.songs.length > 1) {
    const queueList = queue.songs
      .slice(1, 11)
      .map((song, index) => 
        `${index + 1}. **${song.name}** - ${song.formattedDuration}\n   Requested by: ${song.user}`
      )
      .join('\n\n');

    embed.addFields({
      name: `📝 Up Next (${queue.songs.length - 1} track${queue.songs.length - 1 !== 1 ? 's' : ''})`,
      value: queueList,
      inline: false
    });

    if (queue.songs.length > 11) {
      embed.setFooter({ text: `And ${queue.songs.length - 11} more tracks...` });
    }
  } else {
    embed.addFields({
      name: '📝 Up Next',
      value: 'Queue is empty',
      inline: false
    });
  }

  embed.addFields(
    {
      name: '🔊 Volume',
      value: `${queue.volume}%`,
      inline: true
    },
    {
      name: '▶️ Status',
      value: queue.paused ? 'Paused' : 'Playing',
      inline: true
    }
  );

  await interaction.reply({ embeds: [embed] });
}

/**
 * Handle the volume command
 */
async function handleVolumeCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube
): Promise<void> {
  const queue = distube.getQueue(interaction.guild!);
  if (!queue) {
    await interaction.reply({
      content: '❌ No music is currently playing!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const volume = interaction.options.getInteger('level', true);
  queue.setVolume(volume);
  await interaction.reply(`🔊 Volume set to ${volume}%!`);
}

/**
 * Handle the shuffle command
 */
async function handleShuffleCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube
): Promise<void> {
  const queue = distube.getQueue(interaction.guild!);
  if (!queue) {
    await interaction.reply({
      content: '❌ No music queue found!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (queue.songs.length <= 1) {
    await interaction.reply({
      content: '❌ Not enough tracks in queue to shuffle!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await queue.shuffle();
  await interaction.reply('🔀 Queue has been shuffled!');
}

/**
 * Handle the leave command
 */
async function handleLeaveCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube
): Promise<void> {
  const queue = distube.getQueue(interaction.guild!);
  if (!queue) {
    await interaction.reply({
      content: '❌ I\'m not currently in a voice channel!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await distube.voices.leave(interaction.guild!);
  await interaction.reply('👋 Left the voice channel and cleared the queue!');
}

/**
 * Handle the now playing command
 */
async function handleNowPlayingCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube
): Promise<void> {
  const queue = distube.getQueue(interaction.guild!);
  if (!queue || !queue.songs[0]) {
    await interaction.reply({
      content: '❌ No music is currently playing!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const song = queue.songs[0];
  const embed = new EmbedBuilder()
    .setTitle('🎵 Now Playing')
    .setDescription(`**${song.name}**`)
    .addFields(
      {
        name: 'Duration',
        value: song.formattedDuration,
        inline: true
      },
      {
        name: 'Requested By',
        value: song.user?.toString() || 'Unknown',
        inline: true
      },
      {
        name: 'Volume',
        value: `${queue.volume}%`,
        inline: true
      },
      {
        name: 'Status',
        value: queue.paused ? '⏸️ Paused' : '▶️ Playing',
        inline: true
      },
      {
        name: 'Queue',
        value: `${queue.songs.length - 1} track${queue.songs.length - 1 !== 1 ? 's' : ''} remaining`,
        inline: true
      }
    )
    .setColor(0x00FF00)
    .setTimestamp();

  if (song.thumbnail) {
    embed.setThumbnail(song.thumbnail);
  }

  await interaction.reply({ embeds: [embed] });
}

/**
 * Handle the remove command
 */
async function handleRemoveCommand(
  interaction: ChatInputCommandInteraction,
  distube: DisTube
): Promise<void> {
  const queue = distube.getQueue(interaction.guild!);
  if (!queue) {
    await interaction.reply({
      content: '❌ No music queue found!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const position = interaction.options.getInteger('position', true);

  if (position < 1 || position >= queue.songs.length) {
    await interaction.reply({
      content: '❌ Invalid queue position!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const removedSong = queue.songs[position];
  queue.songs.splice(position, 1);
  
  await interaction.reply(`🗑️ Removed **${removedSong.name}** from the queue!`);
}