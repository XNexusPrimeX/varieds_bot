import Discord from 'discord.js';
import util from 'util';
import { ICommand } from "..";

module.exports = <ICommand>{
    name: 'eval',
    description: 'Executa um script em JS',
    guildOnly: false,
    devOnly: true,
    options: [
        {
            name: 'script',
            description: 'O script que quer executar',
            type: 'STRING'
        }
    ],
    async execute(interaction, db) {
        const script = interaction.options.getString('script');
            
        if(script) {
            try {
                const guild = interaction.guild; // for eval
                let result = await eval(`(async () => { ${script} })()`);
                if(typeof result === 'object') result = util.inspect(result, { depth: 0 });

                interaction.reply(`\`\`\`\n${result}\`\`\``);
            } catch (err) {
                interaction.reply(`\`\`\`\n${err}\`\`\``);
            }

        } else {
            interaction.reply('Esperando script...');

            const filter = (m: Discord.Message) => m.author.id === interaction.user.id;
            const collector = await interaction.channel?.awaitMessages({ filter, max: 1, time: 1000 * 60, errors: ['time'] });
            
            const message = collector?.first();
            
            if(!message?.content) return;
            interaction.deleteReply();

            try {
                const { channels, members, roles } = <Discord.Guild>interaction.guild; // for eval
                const guild = <Discord.Guild>interaction.guild; // for eval
                
                let result = await eval(`(async () => { ${message.content} })()`);
                if(typeof result === 'object') result = util.inspect(result, { depth: 0 });

                message.reply(`\`\`\`\n${result}\`\`\``);
            } catch (err) {
                message.reply(`\`\`\`\n${err}\`\`\``);
            }
        }
    }
}