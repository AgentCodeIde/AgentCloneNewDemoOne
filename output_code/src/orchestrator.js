const { runSubAgent } = require('./subAgent');
const MAX_ITER = 5;

async function orchestrateTasks(taskDescription) {
    // Parse the task description to get individual tasks
    const tasks = parseTaskDescription(taskDescription);

    for (const task of tasks) {
        await runSubAgent(task);
    }
}

function parseTaskDescription(taskDescription) {
    // Implement logic to parse the JSON plan model and extract tasks
    // This is a placeholder implementation
    return [
        { title: 'Task 1', description: 'Description of Task 1', expected_outputs: ['output1'] },
        { title: 'Task 2', description: 'Description of Task 2', expected_outputs: ['output2'] }
    ];
}

module.exports = {
    orchestrateTasks
};