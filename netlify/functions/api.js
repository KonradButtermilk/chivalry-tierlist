const { Client } = require('pg');

exports.handler = async (event, context) => {
    // CORS headers to allow requests from anywhere (or restrict to your domain)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Check for missing env var
    const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
    if (!connectionString) {
        console.error('Error: DATABASE_URL is missing');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Configuration Error: DATABASE_URL is missing in Netlify settings.' })
        };
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Required for Neon
    });

    try {
        await client.connect();

        // --- GET: Fetch all players ---
        if (event.httpMethod === 'GET') {
            const result = await client.query('SELECT * FROM players ORDER BY tier ASC, name ASC');
            await client.end();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.rows)
            };
        }

        // --- AUTH CHECK for Write Operations ---
        const adminPassword = process.env.ADMIN_PASSWORD;
        const userPassword = event.headers['x-admin-password'];

        if (!adminPassword || userPassword !== adminPassword) {
            await client.end();
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized: Incorrect or missing password' })
            };
        }

        const body = JSON.parse(event.body || '{}');

        // --- POST: Add Player ---
        if (event.httpMethod === 'POST') {
            const { name, tier } = body;
            if (!name || !tier) throw new Error('Missing name or tier');

            const result = await client.query(
                'INSERT INTO players (name, tier) VALUES ($1, $2) RETURNING *',
                [name, tier]
            );
            await client.end();
            return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) };
        }

        // --- PUT: Update Player Tier ---
        if (event.httpMethod === 'PUT') {
            const { id, tier } = body;
            if (!id || !tier) throw new Error('Missing id or tier');

            const result = await client.query(
                'UPDATE players SET tier = $1 WHERE id = $2 RETURNING *',
                [tier, id]
            );
            await client.end();
            return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
        }

        // --- DELETE: Remove Player ---
        if (event.httpMethod === 'DELETE') {
            const { id } = body;
            if (!id) throw new Error('Missing id');

            await client.query('DELETE FROM players WHERE id = $1', [id]);
            await client.end();
            return { statusCode: 200, headers, body: JSON.stringify({ message: 'Deleted' }) };
        }

        await client.end();
        return { statusCode: 405, headers, body: 'Method Not Allowed' };

    } catch (error) {
        console.error('Database Error:', error);
        try { await client.end(); } catch (e) { } // Ignore close errors
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Database Error',
                details: error.message,
                stack: error.stack
            })
        };
    }
};
