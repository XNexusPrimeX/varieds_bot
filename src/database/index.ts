import { Adapter, JSONFile, Low } from 'lowdb';

import Task from './models/Task';

export type DefaultData = {
    tasks: Task[],
};

const adapter = new JSONFile<DefaultData>(__dirname + '/data.json');
export const db = <ModifiedLow<DefaultData>>new Low(adapter);

import './functions/tasks';

db.read().then(async () => {
    if(!db.data) {
        db.data = {
            tasks: []
        }
        db.write();
    
        await db.read();
    }
});

export default db;


/* Types */
declare class ModifiedLow<T = unknown> {
    adapter: Adapter<T>;
    data: T;
    constructor(adapter: Adapter<T>);
    read(): Promise<void>;
    write(): Promise<void>;
    tasks: {
        get(id: string): Promise<Task | undefined>;
        set<K extends keyof Task>(idOrTask: string | Task, prop: K, value: Task[K]): Promise<void>;
        push(task: Task): Promise<Task>;
        delete(idOrTask: string | Task): Promise<void>;
    }
}