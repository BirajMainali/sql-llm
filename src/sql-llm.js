require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { executeQuery} = require('./database.js');
const { getContext } = require('./context-helper.js');
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generateSqlQuery = async (question) => {
    try {

        const prompt = await getSqlPrompt();
        const result = await model.generateContent([prompt, question]);
        const query = processQuery(result.response.text());
        const databaseResult = await executeQuery(query);
        return { query, databaseResult };
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
    const { schemas, tables, columns, relationships } = await getContext();

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

    Based on the provided PostgreSQL database schema, generate an accurate SQL query to answer the following question:
    
    You are an expert in converting English questions to SQL queries. The SQL database is named STUDENT and contains the following columns: NAME, CLASS, SECTION.
    
    Examples:
    
    1. How many records are present?
       SQL query:
       SELECT COUNT(*) FROM STUDENT;
    
    2. List all students who are in the Data Science class.
       SQL query:
       SELECT * FROM STUDENT WHERE CLASS = 'Data Science';
    
    Instructions:
    1. Provide the SQL query in plain text format, without any markdown or code block syntax.
    2. If the question is not a valid SQL query or cannot be answered based on the schema, respond with a comment in SQL format indicating the issue. For example:
       -- The question is unclear or does not align with the schema.
    3. Include the condition to check the column rec_status for deleted rows if mentioned in the question.
    4. Only generate queries that retrieve or analyze data. Do not include queries that modify the database (e.g., INSERT, UPDATE, ALTER, CREATE, DELETE).
    5. If the question is unclear or not aligned with the schema, request a more specific question or provide a correction.
    6. If the question cannot be answered with the given schema, respond with a SQL comment indicating that the question cannot be answered.
    
    Please provide the SQL query only. Do not include the prompt in your response.`;
    return prompt;
};


module.exports = { generateSqlQuery };