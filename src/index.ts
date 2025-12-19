/**
 * FemboyThighs - A Discord Music Bot
 * Main entry point
 */

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Events,
  ActivityType
} from 'discord.js';

import * as dotenv from 'dotenv';
import { MusicManager } from './services/MusicManager';
import { registerMusicCommands, handleMusicCommand } from './commands/music';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is required in .env file');
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error('❌ CLIENT_ID is required in .env file');
  process.exit(1);
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ]
});

// Initialize music manager
const musicManager = new MusicManager(client);

/**
 * Register slash commands
 */
async function registerCommands(): Promise<void> {
  try {
    console.log('🔄 Registering slash commands...');

    const commands: any[] = [];
    registerMusicCommands(commands, musicManager);

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    if (process.env.GUILD_ID) {
      // Register commands for a specific guild (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ Registered ${commands.length} guild commands for development`);
    } else {
      // Register commands globally (takes up to 1 hour to propagate)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: commands }
      );
      console.log(`✅ Registered ${commands.length} global commands`);
    }
  } catch (error) {
    console.error('❌ Error registering commands:', error);
    throw error;
  }
}

/**
 * Bot ready event
 */
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
  console.log(`🎵 FemboyThighs Music Bot is online!`);
  console.log(`📊 Serving ${readyClient.guilds.cache.size} server(s)`);

  // Set bot status
  readyClient.user.setPresence({
    activities: [{
      name: 'music | /play',
      type: ActivityType.Listening
    }],
    status: 'online'
  });

  // Register commands
  try {
    await registerCommands();
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
});

/**
 * Handle slash command interactions
 */
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    await handleMusicCommand(interaction, musicManager);
  } catch (error) {
    console.error('Error handling interaction:', error);
  }
});

/**
 * Handle errors
 */
client.on(Events.Error, (error) => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  musicManager.cleanup();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  musicManager.cleanup();
  client.destroy();
  process.exit(0);
});

/**
 * Login to Discord
 */
console.log('🚀 Starting FemboyThighs Music Bot...');
client.login(process.env.DISCORD_TOKEN);