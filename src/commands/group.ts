import Discord from 'discord.js';
import { globalEmbed, ICommand } from "..";
import getFilename from '../utils/getFilename';

const allColors = ['#f04d37', '#eafa5c', '#5cfaa6', '#8769f5'] as const;

module.exports = <ICommand>{
    name: 'group',
    description: 'Modifica um canal temporário',
    guildOnly: true,
	  devOnly: true, 
    options: [
        {
            name: 'create',
            description: 'a',
            type: 'SUB_COMMAND',
            options: [

                {
                    name: 'name',
                    description: 'Nome do grupo',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'color',
                    description: 'Cor do grupo',
                    type: 'STRING',
                    choices: [
                        {
                            name: 'red',
                            value: allColors[0]
                        },
                        {
                            name: 'yellow',
                            value: allColors[1]
                        },
                        {
                            name: 'green',
                            value: allColors[2]
                        },
                        {
                            name: 'blue',
                            value: allColors[3]
                        },
                    ],
                    required: true
                },
                {
                    name: 'member1',
                    description: 'a',
                    type: 'USER'
                },
                {
                    name: 'member2',
                    description: 'a',
                    type: 'USER'
                },
                {
                    name: 'member3',
                    description: 'a',
                    type: 'USER'
                },
                {
                    name: 'member4',
                    description: 'a',
                    type: 'USER'
                },
            ]
        },
        {
            name: 'delete',
            description: 'a',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'name',
                    description: 'nome do grupo',
                    type: 'CHANNEL',
                    required: true
                }
            ]
        }
    ],
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        const guild = interaction.guild;

        if(subCommand === 'create') {
            const groupName = interaction.options.getString('name', true);
            const groupColor = <typeof allColors[number]>interaction.options.getString('color', true);
            
            const role = await createRole(`$ | ${groupName}`, groupColor);

            const groupChannel = await createChannel(groupName, role);
            if(!groupChannel) return interaction.reply(globalEmbed('error', 'Não foi possível criar o canal'));

            [
                interaction.options.getUser('member1'),
                interaction.options.getUser('member2'),
                interaction.options.getUser('member3'),
                interaction.options.getUser('member4')
            ].forEach(user => {
                if(!user || !guild || !role) return;
    
                const member = <Discord.GuildMember>guild.members.cache.get(user.id);

                member.send(globalEmbed('common', {
                    title: 'Grupo criado',
                    description: `Você foi colocado no grupo <#${groupChannel.id}>, entre no canal para saber mais.`
                })).catch();
    
                member.roles.add(role);
            });
            
            interaction.reply(globalEmbed('success', 'Grupo criado'));
            
        } else if(subCommand === 'delete') {
            const channel = <Discord.GuildChannel>interaction.options.getChannel('name', true);
            if(channel.parentId !== process.env.CATEGORY_GROUP_ID || !guild) return interaction.reply(globalEmbed('error', {
                title: 'Canal Inválido', 
                description: 'O canal que selecionou não é um grupo, logo não pode ser apagado.'
            }));
            
            channel.permissionOverwrites.cache.forEach(permission => {
                if(permission.id === guild.roles.everyone.id) return;
                const role = <Discord.Role>guild.roles.cache.get(permission.id);
                if(!role.name.includes('$')) return;

                role.delete();
            });
            
            channel.delete();

            interaction.reply(globalEmbed('success', 'Grupo deletado'));
        }


        /* Functions */
        async function createRole(roleName: string, color: typeof allColors[number]) {
            if(!guild) return;
            
            return await guild.roles.create({ color: color, name: roleName });
        }
        async function createChannel(channelName: string, role: Discord.Role | undefined) {
            if(!guild || !role) return;
            
            return guild.channels.create(channelName, {
                parent: process.env.CATEGORY_GROUP_ID,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        type: 'role',
                        deny: ['VIEW_CHANNEL']
                    },
                    {
                        id: role.id,
                        type: 'role',
                        allow: ['VIEW_CHANNEL']
                    }
                ] 
            });
        }
    }
};