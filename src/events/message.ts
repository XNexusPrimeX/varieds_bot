import { createEvent } from "..";
import getFilename from "../utils/getFilename";

module.exports = createEvent({
    name: 'message',
    description: '',
    type: 'messageCreate',
    execute(message) {
        if(message.channel.type !== 'DM') return;
    }
});
