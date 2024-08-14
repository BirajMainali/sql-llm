const fs = require('fs');
const path = require('path');
const { getDatabaseContext } = require('./database.js');


const contextFilePath = path.resolve('./context.txt');

const readContextFromFile = () => {
    if (fs.existsSync(contextFilePath)) {
        const data = fs.readFileSync(contextFilePath, 'utf-8');
        return JSON.parse(data);
    }
    return null;
};

const writeContextToFile = (context) => {
    fs.writeFileSync(contextFilePath, JSON.stringify(context, null, 2), 'utf-8');
};

const getContext = async () => {
    let context = readContextFromFile();
    if (context === null) {
        console.log('Context not found. Fetching from database...');
        context = await getDatabaseContext();
        writeContextToFile(context);
    }
    return context;
};

module.exports = { getContext };