import fs from 'fs';
import Discord from 'discord.js';
import database from './database';
import * as dotenv from 'dotenv';

dotenv.config();

const ephemeralMessages: boolean = true;
type IfIsEmbed<K extends boolean> = K extends true ? Discord.MessageEmbed : Discord.InteractionReplyOptions
type typeOfGlobalEmbed = 'success' | 'error' | 'common';
export const globalEmbed = <K extends boolean = false>(type: typeOfGlobalEmbed, embedData: Discord.MessageEmbedOptions | string, isEmbed?: K): IfIsEmbed<K> => {
    let embed: Discord.MessageEmbed = new Discord.MessageEmbed();
    if(typeof embedData !== 'string') embed = new Discord.MessageEmbed(embedData); 

    switch(type) {
        case 'success': embed
            .setTitle(`✅ │ ${embed.title || embedData}`)
            .setColor('#69b84f');
            break;
        
        case 'error': embed
            .setTitle(`❌ │ ${embed.title || embedData}`)
            .setColor('#ba2d42');
            break;

        case 'common': embed
            .setTitle(`${embed.title || embedData}`)
            .setColor('#384b70');
            break;
    }

    // TS bug
    // @ts-ignore
    if(isEmbed) return embed
    // @ts-ignore
    else return { embeds: [embed], ephemeral: ephemeralMessages };
}

const { version } = require('../package.json');

const client = new Discord.Client({
    intents: [
        'GUILDS',
        'GUILD_MEMBERS',
        'DIRECT_MESSAGES',
        'GUILD_PRESENCES',
    ]
});

const commands: Map<string, ICommand> = new Discord.Collection();

client.once('ready', async () => {
    client.user?.setActivity(`v${version}`);

    const guild = <Discord.Guild>client.guilds.cache.get(<string>process.env.GUILD_ID);
    
    fs.readdirSync(__dirname + '/features').forEach(async filePath => {
        const file: IFeature = require(`./features/${filePath}`);

        try {
            file(guild, database);
        } catch (err) {
            console.log(err);
        }
    })
    fs.readdirSync(__dirname + '/commands').forEach(async filePath => {
        const file: ICommand = require(`./commands/${filePath}`);
        
        try {
            const registeredCommand = await guild.commands.create({
                name: file.name,
                description: file.description,
                options: file.options || []
            });

            registeredCommand?.permissions.add({ permissions: [
                {
                    id: guild.roles.everyone.id,
                    type: 'ROLE',
                    permission: !file.devOnly
                },
                {
                    id: <string>process.env.DEV_ROLE_ID,
                    type: 'ROLE',
                    permission: true
                }
            ]});
            
            commands.set(file.name, file);
        } catch (err) { 
            console.error(err); 
        }
        
        (await guild.commands.fetch())?.forEach(async command => {
            if(!commands.get(command.name)) await command.delete();
            
        });
    });
    fs.readdirSync(__dirname + '/events').forEach(async filePath => {
        const file: ReturnType<typeof createEvent> = require(`./events/${filePath}`);

        try {
            if(file.once) client.once(file.type, (...args) => file.execute(.ata.ase, .args));
            else client.on(file.type, (...args) => file.execute(..database, .args));
        } catch (err) {
            console.error(err)
        }
    });

    console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return;
    
    const command = commands.get(interaction.commandName);
    
    if(!command) return interaction.reply({ embeds: [] });
    
    if(command.guildOnly && interaction.channel?.type === 'DM') {
        return interaction.reply({ embeds: [] });
    }
    
    try {
        command?.execute(interaction, database);
    } catch (error) {
        console.error(error);
        interaction.reply('Este comando não está funcionando ainda.');
    };
});

client.login(process.env.TOKEN);


/* Types */
export type IFeature = (guild: Discord.Guild, db: typeof database) => void;

type IEvent<K extends keyof Discord.ClientEvents> = {
    name: string
    description: string
    once?: boolean
    type: K
    execute: (db: typeof database, ...args: Discord.ClientEvents[K]) => void;
}

export function createEvent<K extends keyof Discord.ClientEvents>(e: IEvent<K>): IEvent<K> {
    return e;
}

export type ICommand = {
    name: string
    description: string
    guildOnly: boolean
    devOnly?: boolean
    options: Discord.ApplicationCommandOptionData[] | undefined
    execute: (interaction: Discord.CommandInteraction, db: typeof database) => void;
}
