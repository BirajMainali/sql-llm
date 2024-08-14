const readline = require('readline');
const { getGeneratedSqlQuery } = require('./src/sql-llm.js');
// const { getDatabaseContext } = require('./database.js'); 

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = async () => {
  rl.question('Ask a question about the database: ', async (question) => {
    await getGeneratedSqlQuery(question);
    askQuestion();
  });
}


askQuestion();