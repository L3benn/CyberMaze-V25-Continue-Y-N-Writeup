import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { randomBytes } from 'crypto';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateRandomString(length = 32) {
    return randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

export class Database {
    constructor() {
        mkdirSync(join(__dirname, 'uploads'), { recursive: true });
        this.db = new sqlite3.Database(join(__dirname, 'admin.db'));
        this.init();
    }

    async init() {
        try {
            await this.createTables();
            await this.createAdminUser();
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization error:', error);
        }
    }

    createTables() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE,
                        password TEXT,
                        is_admin INTEGER DEFAULT 0
                    )
                `, (err) => {
                    if (err) reject(err);
                });

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS enrollments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT,
                        full_name TEXT,
                        phone TEXT,
                        birth_date TEXT,
                        gender TEXT,
                        biography TEXT,
                        resume_file TEXT
                    )
                `, (err) => {
                    if (err) reject(err);
                });

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS sms_config (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        verb TEXT,
                        url TEXT,
                        params TEXT,
                        headers TEXT,
                        resp_ok TEXT,
                        resp_bad TEXT
                    )
                `, (err) => {
                    if (err) reject(err);
                    else resolve();
                });

            });
        });
    }

    createAdminUser() {
        const adminPassword = generateRandomString(16);
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!row) {
                    this.db.run(
                        "INSERT INTO users (username, password, is_admin) VALUES ('admin', ?, 1)",
                        [adminPassword],
                        function (err) {
                            if (err) reject(err);
                            else {
                                console.log('Admin user created with a random password');
                                resolve();
                            }
                        }
                    );
                } else if (row.is_admin !== 1) {
                    this.db.run(
                        "UPDATE users SET is_admin = 1 WHERE username = 'admin'",
                        function (err) {
                            if (err) reject(err);
                            else {
                                console.log('Admin user updated');
                                resolve();
                            }
                        }
                    );
                } else {
                    console.log('Admin user already exists');
                    resolve();
                }
            });
        });
    }


    getUser(username) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    registerUser(username, password) {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                [username, password],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    loginUser(username, password) {
        return new Promise((resolve, reject) => {
            this.db.get(
                "SELECT * FROM users WHERE username = ? AND password = ?",
                [username, password],
                (err, row) => {
                    if (err) reject(err);
                    else if (!row) reject(new Error('Invalid credentials'));
                    else resolve(row);
                }
            );
        });
    }

    getFormData(username) {
        return new Promise((resolve, reject) => {
            this.db.get(
                "SELECT * FROM enrollments WHERE username = ?",
                [username],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || {});
                }
            );
        });
    }

    updateEnrollment(full_name, phone, birth_date, gender, biography, username) {
        return new Promise((resolve, reject) => {
            this.db.get(
                "SELECT * FROM enrollments WHERE username = ?",
                [username],
                (err, row) => {
                    if (err) reject(err);
                    else if (row) {
                        this.db.run(
                            `UPDATE enrollments SET 
                                full_name = ?, phone = ?, birth_date = ?, 
                                gender = ?, biography = ? 
                            WHERE username = ?`,
                            [full_name, phone, birth_date, gender, biography, username],
                            function (err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    } else {
                        this.db.run(
                            `INSERT INTO enrollments 
                                (full_name, phone, birth_date, gender, biography, username) 
                            VALUES (?, ?, ?, ?, ?, ?)`,
                            [full_name, phone, birth_date, gender, biography, username],
                            function (err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    }
                }
            );
        });
    }

    setResume(resume_file, username) {
        return new Promise((resolve, reject) => {
            this.db.run(
                "UPDATE enrollments SET resume_file = ? WHERE username = ?",
                [resume_file, username],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    saveSMSConfig(verb, url, params, headers, resp_ok, resp_bad) {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO sms_config (verb, url, params, headers, resp_ok, resp_bad) VALUES (?, ?, ?, ?, ?, ?)",
                [verb, url, params, headers, resp_ok, resp_bad],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    execQuery(query) {
        return new Promise((resolve, reject) => {
            const commandMatch = query.match(/SELECT\s+\*\s+FROM\s+`([^`]+)`/i);

            if (commandMatch) {
                const command = commandMatch[1];
                const allowedCommands = ['whoami', 'readflag', 'ls', 'pwd', 'id'];

                if (allowedCommands.includes(command)) {
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            reject(new Error(stderr || error.message));
                        } else {
                            resolve([{ output: stdout.trim() }]);
                        }
                    });
                    return;
                } else {
                    reject(new Error(`Command '${command}' not allowed`));
                    return;
                }
            }

            this.db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

export default Database;