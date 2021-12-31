import { User } from "discord.js";
import { IProgressOfTask } from "../../features/task";

type Task = { 
    user: User
    description: string
    progress: IProgressOfTask
    validity: Date,
    id: string
};

export default Task;