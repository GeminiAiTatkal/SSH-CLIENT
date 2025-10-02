const { Client } = require('ssh2');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { host, username, password, command } = req.body;

    if (!host || !username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    const conn = new Client();

    try {
        await new Promise((resolve, reject) => {
            conn.on('ready', () => {
                if (command) {
                    conn.exec(command, (err, stream) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        let output = '';
                        stream.on('data', (data) => {
                            output += data.toString();
                        });

                        stream.on('close', () => {
                            conn.end();
                            res.json({ success: true, output: output });
                            resolve();
                        });
                    });
                } else {
                    conn.end();
                    res.json({ success: true, message: 'Connected successfully' });
                    resolve();
                }
            });

            conn.on('error', (err) => {
                reject(err);
            });

            conn.connect({
                host: host,
                username: username,
                password: password,
                port: 22,
                readyTimeout: 20000
            });
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
