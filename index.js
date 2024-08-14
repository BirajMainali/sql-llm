const express = require('express');
const path = require('path');
const { generateSqlQuery } = require('./src/sql-llm.js');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/query', async (req, res) => {
    const { question } = req.body;
    try {
        const {query, databaseResult} = await generateSqlQuery(question);
        console.log({ query, databaseResult });
        res.json({ query, databaseResult });
    } catch (error) {
        res.status(500).json({ error: 'Error generating SQL query' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
