import { db } from "..";

db.tasks = {
    async get(id) {
        await db.read();

        return db.data.tasks.find(t => t.id === id);
    },
    async set(idOrTask, prop, value) {
        await db.read();

        const taskIndex = db.data.tasks.findIndex(t => {
            if(typeof idOrTask === 'string') {
                return t.id === idOrTask;
            } else {
                return t.id === idOrTask.id;
            }
        });
        db.data.tasks[taskIndex][prop] = value;

        await db.write();
    },
    async push(task) {
        db.data.tasks.push(task)

        await db.write();

        return task;
    },
    async delete(idOrTask) {
        await db.read();

        const taskIndex = db.data.tasks.findIndex(t => {
            if(typeof idOrTask === 'string') {
                return t.id === idOrTask;
            } else {
                return t.id === idOrTask.id;
            }
        });     
        db.data.tasks.splice(taskIndex, 1);

        await db.write();
    }
}