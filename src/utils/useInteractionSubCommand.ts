import Discord from 'discord.js'

type Data = { [key: string]: () => void }

export default function(interaction: Discord.CommandInteraction) {
		const subCommand = interaction.options.getSubcommand();

		return function(data: Data) {
				const keysOfData = Object.keys(data);

				keysOfData.forEach(key => {
						if(key !== subCommand) return;

						data[key]();
				})
		}
}