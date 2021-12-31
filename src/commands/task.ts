import uniqid from 'uniqid';

import Discord from "discord.js";
import { globalEmbed, ICommand } from "..";

import { IProgressOfTask } from "../features/task";
import Task from '../database/models/Task';

const acceptedStatus: { [key in IProgressOfTask]: string } = {
    wait_confirmation: 'Esperando Confirmação',
    completed: 'Completo',
    in_progress: 'Em progresso',
    stopped: 'Parado'
}

const row = new Discord.MessageActionRow().addComponents(
    new Discord.MessageButton()
        .setCustomId('true')
        .setLabel('Aceitar Tarefa')
        .setStyle('SUCCESS'),

    new Discord.MessageButton()
        .setCustomId('false')
        .setLabel('Rejeitar Tarefa')
        .setStyle('DANGER')
);

module.exports = <ICommand>{
    name: 'task',
    description: 'a',
    guildOnly: true,
    options: [
        {
            name: 'start',
            description: 'a',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'user',
                    description: 'a',
                    type: 'USER',
                    required: true,
                },
                {
                    name: 'description',
                    description: 'a',
                    type: 'STRING',
                    required: true,
                },
                {
                    name: 'hours',
                    description: 'a',
                    type: 'INTEGER',
                    required: true
                }
            ]
        },
        {
            name: 'restart',
            description: 'a',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'id',
                    description: 'a',
                    type: 'STRING',
                    required: true
                }
            ]
        },
        {
            name: 'end',
            description: 'a',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'id',
                    description: 'a',
                    autocomplete: true,
                    type: 'STRING',
                    required: true,
                }
            ]
        },
        {
            name: 'view',
            description: 'a',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'member',
                    description: 'a',
                    type: 'USER',
                    required: true
                }
            ]
        }
    ],
    async execute(interaction, db) {
        const subCommand = interaction.options.getSubcommand();
        
        if(subCommand === 'start') {
            const member = <Discord.GuildMember>interaction.options.getMember('user', true);
            const description = interaction.options.getString('description', true);
            const hours = interaction.options.getInteger('hours', true);
            const id = uniqid();
            
            const date = new Date();
            date.setHours(date.getHours() + hours);
            
            await db.tasks.push({
                user: member.user,
                description,
                progress: 'wait_confirmation',
                validity: date,
                id
            });
            
            interaction.reply(globalEmbed('success', {
                title: 'Tarefa Criada', 
                description: 'Esperando o usuário responder a solicitação da Tarefa'
            }));

            const taskRequest = await member.send({ 
                embeds: [globalEmbed('common', {
                    title: 'Tarefa solicitada',
                    description: `O usuário <@${interaction.user.id}> solicita que faça uma tarefa para <t:${parseInt((new Date(date).getTime() / 1000).toFixed(0))}:F>: \n"${description}"`,
                    footer: {
                        text: `<t:${parseInt((new Date(date).getTime() / 1000).toFixed(0))}:F>`
                    }
                }, true)], 
                components: [row]
            });
            waitResponseOfReceiverRequest(taskRequest, id);
        } else if(subCommand === 'end') {            
            const id = interaction.options.getString('id', true);
            // const id = interaction.options.getFocused(true);
            
            const task = await db.tasks.get(id);
            if(!task) return interaction.reply(globalEmbed('error', 'Tarefa não encontrada'));

            db.tasks.set(task, 'progress', 'stopped');
            interaction.reply(globalEmbed('success', 'Tarefa finalizada'));
        } else if(subCommand === 'restart') {
            const task = await db.tasks.get(interaction.options.getString('id', true));
            
            if(!task) return interaction.reply(globalEmbed('error', {
                title: 'Id não encontrado', 
                description: 'O id que você colocou não existe no banco de dados'
            }));
            
            const member = <Discord.GuildMember>interaction.guild?.members.cache.get(task.user.id);

            db.tasks.set(task, 'progress', 'wait_confirmation');

            const taskRequest = await member.send({ 
                embeds: [globalEmbed('common', {
                    title: 'Tarefa solicitada',
                    description: `O usuário <@${interaction.user.id}> solicita que faça uma tarefa para <t:${parseInt((new Date(task.validity).getTime() / 1000).toFixed(0))}:F>: \n"${task.description}"`,
                    footer: {
                        text: `<t:${parseInt((new Date(task.validity).getTime() / 1000).toFixed(0))}:F>`
                    }
                }, true)], 
                components: [row]
            });
            waitResponseOfReceiverRequest(taskRequest, task.id);

            interaction.reply(globalEmbed('success', {
                title: 'Tarefa Recriada', 
                description: 'Esperando o usuário responder a solicitação da Tarefa'
            }));
        } else if(subCommand === 'view') {
            const member = <Discord.GuildMember>interaction.options.getMember('member', true);

            const tasksOfUser = db.data.tasks.filter(t => t.user.id === member.id);
            const mappedTasksOfUser = mapTasks(tasksOfUser);

            interaction.reply(globalEmbed('common', {
                title: 'Ver Tarefas',
                fields: mappedTasksOfUser
            }))
        }


        /* Functions */
        async function waitResponseOfReceiverRequest(msg: Discord.Message, taskId: string) {
            const buttonInteraction = await msg.awaitMessageComponent({ componentType: 'BUTTON' });

            if(buttonInteraction.customId === 'true') {
                db.tasks.set(taskId, 'progress', 'in_progress');

                buttonInteraction.reply(globalEmbed('success', {
                    title: 'Tarefa aceita',
                    description: 'Caso acabe a tarefa ou fique incapacitado de terminar por algum motivo, envie mensagem neste canal para atualizar o status da sua tarefa'
                }));
                interaction.followUp(globalEmbed('success', 'Tarefa aceita'));
            } else {
                db.tasks.delete(taskId);

                buttonInteraction.reply(globalEmbed('success', 'Tarefa rejeitada'));
                interaction.followUp(globalEmbed('error', {
                    title: 'Tarefa rejeitada', 
                    description: 'O usuário rejeitou a Tarefa'
                }));
            }

            msg.delete();
        }

        function mapTasks(tasks: Task[]): Discord.EmbedFieldData[] {
            return tasks.map(task => {
                const date = `0${new Date(task.validity).getDate()}`.slice(-2);
                const month = `0${new Date(task.validity).getMonth()}`.slice(-2);

                return { 
                    name: `${acceptedStatus[task.progress]} | Para ${date}/${month}`,
                    value: `${task.description}\n\n${task.id}`
                }
            });
        }
    }
};