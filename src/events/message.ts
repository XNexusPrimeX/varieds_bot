import Discord from 'discord.js'
import { createEvent } from "..";

module.exports = createEvent({
    name: 'message',
    description: '',
    type: 'messageCreate',
    execute(message) {
        if(message.channel.type !== 'DM') return;

			  const member = message.member;

        const tasksOfUser = db.data.tasks.filter(t => t.user.id === member.id);
        const mappedTasksOfUser = mapTasks(tasksOfUser);

        interaction.reply(globalEmbed('common', {
            title: 'Ver Tarefas',
            fields: mappedTasksOfUser
				}))
    }
});
