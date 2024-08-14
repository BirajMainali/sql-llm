require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});


const query = (text, params) => pool.query(text, params);

const executeQuery = async (inputQuery) => {
    const result = await query(inputQuery);
    return result.rows;
}


const getSchemaContext = async () => {

    const schemaQuery = `
          SELECT schema_name 
          FROM information_schema.schemata
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog');
        `;
    const schemaResult = await query(schemaQuery);
    const schemas = schemaResult.rows.map(row => row.schema_name);
    return schemas;

}

const getTableContext = async () => {

    const tableQuery = `
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog') 
                AND table_type = 'BASE TABLE';
            `;
    const tableResult = await query(tableQuery);
    const tables = tableResult.rows;

    return tables;
}



const getColumnContext = async () => {

    const columnQuery = `
                SELECT table_schema, table_name, column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema NOT IN ('information_schema', 'pg_catalog');
                `;
    const columnResult = await query(columnQuery);
    const columns = columnResult.rows;


    return columns;
}


const getRelationshipContext = async () => {

    const relationshipQuery = `
                    SELECT tc.table_schema, tc.table_name, kcu.column_name, 
                        ccu.table_schema AS foreign_table_schema,
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name 
                    FROM information_schema.table_constraints AS tc 
                        JOIN information_schema.key_column_usage AS kcu
                            ON tc.constraint_name = kcu.constraint_name
                            AND tc.table_schema = kcu.table_schema
                        JOIN information_schema.constraint_column_usage AS ccu
                            ON ccu.constraint_name = tc.constraint_name
                            AND ccu.table_schema = tc.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY';
                    `;
    const relationshipResult = await query(relationshipQuery);
    const relationships = relationshipResult.rows;

    return relationships;
}


const getDatabaseContext = async () => {
    return {
        schemas: await getSchemaContext(),
        tables: await getTableContext(),
        columns: await getColumnContext(),
        relationships: await getRelationshipContext(),
    }
}

module.exports = { executeQuery, getDatabaseContext };