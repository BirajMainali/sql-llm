require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { executeQuery, getDatabaseContext } = require('./database.js');

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const getGeneratedSqlQuery = async (question) => {
    try {

        const prompt = await getSqlPrompt();
        const result = await model.generateContent([prompt, question]);
        const query = processQuery( result.response.text());
        console.log("Generated SQL query: ", query);
        const databaseResult = await executeQuery(query);
        console.log("databaseResult: ", databaseResult);
    } catch (error) {
        console.error("Error generating SQL query: ", error);
        return null;
    }
}

const processQuery = (query) => query
    .replace(/```sql/g, '') // Remove starting ```sql
    .replace(/```/g, '') // Remove ending ```
    .trim() /* Remove any leading or trailing whitespace*/;

const getSqlPrompt = async () => {
    const { schemas, tables, columns, relationships } = await getDatabaseContext();

    let schemaDescription = 'You are working with a PostgreSQL database. Here is the database schema:\n\n';

    schemas.forEach(schema => {
        schemaDescription += `Schema: ${schema}\n`;
        const schemaTables = tables.filter(table => table.table_schema === schema);
        schemaTables.forEach(table => {
            schemaDescription += `  Table: ${table.table_name}\n`;
            const tableColumns = columns.filter(col => col.table_schema === schema && col.table_name === table.table_name);
            tableColumns.forEach(column => {
                schemaDescription += `    Column: ${column.column_name} (${column.data_type})\n`;
            });
        });
    });

    if (relationships.length > 0) {
        schemaDescription += '\nRelationships between tables:\n';
        relationships.forEach(rel => {
            schemaDescription += `  ${rel.table_schema}.${rel.table_name}.${rel.column_name} → ${rel.foreign_table_schema}.${rel.foreign_table_name}.${rel.foreign_column_name}\n`;
        });
    }


    const prompt = schemaDescription + `
        
        Based on the above PostgreSQL database schema, write an accurate SQL query that answers the following question:

        You are an expert in converting English questions to SQL queries! The SQL database has the name STUDENT and has the following columns: NAME, CLASS, SECTION.

        Examples:

        1. How many entries of records are present?
        SQL query:
        SELECT COUNT(*) FROM STUDENT;

        2. Tell me all the students studying in the Data Science class?
        SQL query:
        SELECT * FROM STUDENT WHERE CLASS = 'Data Science';

        Please provide the SQL query without any triple backticks and format it plainly.

        Note: 
        1. The column rec_status indicates whether a row is deleted or not.
        2. If your question is not clear or does not align with the database schema, please provide a more specific or corrected question to help generate the accurate SQL query.
        2. The response should not include the markdown syntax or triple backticks. the response should be plain text.
        `;

    return prompt;
};


module.exports = { getGeneratedSqlQuery };