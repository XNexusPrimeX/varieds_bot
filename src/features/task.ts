import { ButtonInteraction, GuildMember, MessageActionRow, MessageButton, TextChannel } from "discord.js";
import { globalEmbed, IFeature } from "..";

const compressDate = (date: Date) => `${new Date(date).getDate()}${new Date(date).getMonth()}${new Date(date).getFullYear()}${new Date(date).getHours()}${new Date(date).getMinutes()}`;

const task: IFeature = (guild, db) => {
    const noticeChannel = <TextChannel>guild.channels.cache.get(<string>process.env.NOTICE_CHANNEL_ID);
    
    setInterval(async () => {
        const nowDate = new Date();
        const compactNowDate = compressDate(nowDate);
        
        db.data.tasks.forEach(async task => {
            const member = <GuildMember>(await guild.members.fetch()).get(task.user.id);

            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId('completed')
                    .setLabel('Concluído')
                    .setStyle('SUCCESS'),

                new MessageButton()
                    .setCustomId('in_progress')
                    .setLabel('Em progresso')
                    .setStyle('PRIMARY'),

                new MessageButton()
                    .setCustomId('stopped')
                    .setLabel('Parado')
                    .setStyle('DANGER')
            );

            let alreadyExecuted = false;
            if(new Date().getHours() === 14 && !alreadyExecuted) {
                alreadyExecuted = true;

                if(task.progress !== 'in_progress') return;

                await db.tasks.set(task.id, 'progress', 'stopped');

                function toTimestamp(date: Date) {
                    return parseInt(`${new Date(date).getTime() / 1000}`)
                }

                const msg = await member.send({ embeds: [globalEmbed('common', `Como está indo a tarefa para <t:${toTimestamp(task.validity)}:d>?`, true)], components: [row] });
                const buttonInteraction = await msg.awaitMessageComponent({ componentType: 'BUTTON' });
                
                if(buttonInteraction.customId === 'completed') {
                    db.tasks.delete(task.id);

                    msg.delete();
                    buttonInteraction.reply(globalEmbed('success', { 
                        title: 'Status da Tarefa atualizado', 
                        description: 'Envie os arquivos para <@607999934725357578>' 
                    }));
                    noticeChannel.send(globalEmbed('success', {
                        title: 'Tarefa Concluída',
                        author: {
                            name: member.user.username,
                            iconURL: member.user.avatarURL() || member.user.defaultAvatarURL
                        }
                    }));
                    
                } else if(buttonInteraction.customId === 'in_progress') {
                    await db.tasks.set(task.id, 'progress', 'in_progress');
                    
                    msg.delete();
                    buttonInteraction.reply(globalEmbed('success', 'Status da Tarefa atualizado'));
                    
                } else if(buttonInteraction.customId === 'stopped') {
                    await db.tasks.set(task.id, 'progress', 'stopped');

                    msg.delete();
                    await buttonInteraction.reply(globalEmbed('common', 'Digite o motivo da tarefa não estar sendo feita'));

                    try {
                        const reason = (await buttonInteraction.channel?.awaitMessages({ max: 1, time: 1000 * 60 * 5 }))?.first()?.content;
                        
                        if(!reason) return;
    
                        buttonInteraction.followUp(globalEmbed('success', 'O motivo da tarefa estar parada foi salva'));
                        noticeChannel.send(globalEmbed('error', {
                            title: 'Tarefa parada',
                            description: `Motivo: "${reason}"`,
                            author: {
                                name: buttonInteraction.user.username,
                                iconURL: buttonInteraction.user.avatarURL() || buttonInteraction.user.defaultAvatarURL
                            },
                            color: 'RED',
                            footer: {
                                text: task.id
                            }
                        }));
                    } catch {
                        buttonInteraction.followUp(globalEmbed('error', {
                            title: 'Motivo não especificado',
                            description: 'Você não enviou o motivo, o tempo para enviar acabou.'
                        }));
                        noticeChannel.send(globalEmbed('common', {
                            title: 'Tarefa parada',
                            description: `Motivo: Não especificado`,
                            author: {
                                name: buttonInteraction.user.username,
                                iconURL: buttonInteraction.user.avatarURL() || buttonInteraction.user.defaultAvatarURL
                            },
                            color: 'RED',
                            footer: {
                                text: task.id
                            }
                        }));
                    }
                }

            } else alreadyExecuted = false;

            const compactTaskDate = compressDate(task.validity);
            if(compactTaskDate !== compactNowDate) return;

            member.send(globalEmbed('error', 'O seu tempo para fazer a tarefa acabou'));
            noticeChannel.send(globalEmbed('common', {
                title: 'Tarefa parada',
                description: `Motivo: "O prazo da Tarefa acabou"`,
                author: {
                    name: member.user.username,
                    iconURL: member.user.avatarURL() || member.user.defaultAvatarURL
                },
                color: 'RED',
                footer: {
                    text: task.id
                }
            }));
        });
    }, 1000 * 60 * 60 * 1);    
}

module.exports = task;


/* Type */
export type IProgressOfTask = 'wait_confirmation' | 'stopped' | 'completed' | 'in_progress';