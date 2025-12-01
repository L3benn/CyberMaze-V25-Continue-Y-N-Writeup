import path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { Router } from 'express';
import { sign } from '../helpers/JWTHelper.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { AdminMiddleware } from '../middleware/AdminMiddleware.js';
import { LocalMiddleware } from '../middleware/LocalMiddleware.js';
import crypto from 'crypto';
import { SQL_ACCESS_KEY } from '../config.js';

let db;
const router = Router();

router.get('/', (req, res) => {
    return res.render('index.ejs', { error: null, success: null });
});

router.get('/register', (req, res) => {
    return res.render('register.ejs', { error: null, success: null });
});

router.get('/login', (req, res) => {
    return res.render('login.ejs', { error: null, success: null });
});

router.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (username && password) {
        return db.getUser(username)
            .then(user => {
                if (user) return res.render('register.ejs', { error: 'Username already taken', success: null });
                return db.registerUser(username, password)
                    .then(() => res.render('login.ejs', { error: null, success: 'Registration successful' }))
            })
            .catch(() => res.render('register.ejs', { error: 'Registration failed', success: null }));
    }
    return res.render('register.ejs', { error: 'All fields are required', success: null });
});

router.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (username && password) {
        return db.loginUser(username, password)
            .then(user => {
                let token = sign({ username: user.username });
                res.cookie('session', token, { maxAge: 3600000 });

                if (user.username === 'admin') {
                    return res.redirect('/admin');
                } else {
                    return res.redirect('/dashboard');
                }
            })
            .catch(() => res.render('login.ejs', { error: 'Invalid credentials', success: null }));
    }
    return res.render('login.ejs', { error: 'All fields are required', success: null });
});

router.get('/dashboard', AuthMiddleware, async (req, res) => {
    if (req.user.username === 'admin') return res.redirect('/admin');

    return db.getUser(req.user.username)
        .then(user => {
            if (!user) return res.redirect('/login');

            return db.getFormData(user.username)
                .then(enrollment => {
                    const hasUploadedFile = enrollment && enrollment.resume_file;
                    res.render('dashboard.ejs', {
                        user,
                        enrollment,
                        error: null,
                        success: null,
                        showDownload: hasUploadedFile,
                        fileHash: hasUploadedFile ? enrollment.resume_file.replace('.dat', '') : null
                    });
                });
        })
        .catch(() => {
            return res.redirect('/login');
        })
});

router.post('/api/upload', AuthMiddleware, async (req, res) => {
    return db.getUser(req.user.username)
        .then(async user => {
            if (!user) return res.redirect('/login');

            if (!req.files || !req.files.resumeFile) {
                const enrollment = await db.getFormData(user.username);
                const hasUploadedFile = enrollment && enrollment.resume_file;
                return res.render('dashboard.ejs', {
                    user,
                    enrollment,
                    error: 'Please select a file',
                    success: null,
                    showDownload: hasUploadedFile,
                    fileHash: hasUploadedFile ? enrollment.resume_file.replace('.dat', '') : null
                });
            }

            let enrollment = await db.getFormData(user.username);
            let resumeFile = req.files.resumeFile;

            const fileHash = crypto.createHash('md5').update(resumeFile.data).digest('hex');
            const uploadFile = `${fileHash}.dat`;

            const uploadDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            await resumeFile.mv(path.join(uploadDir, uploadFile));

            if (enrollment.resume_file && enrollment.resume_file !== uploadFile) {
                try {
                    fs.unlinkSync(path.join(uploadDir, enrollment.resume_file));
                }
                catch (e) { console.log(e) }
            }

            return db.setResume(uploadFile, user.username)
                .then(async () => {
                    const updatedEnrollment = await db.getFormData(user.username);
                    res.render('dashboard.ejs', {
                        user,
                        enrollment: updatedEnrollment,
                        error: null,
                        success: 'bieennn!! File uploaded successfully',
                        showDownload: true,
                        fileHash: fileHash
                    });
                })
                .catch(() => {
                    const hasUploadedFile = enrollment && enrollment.resume_file;
                    res.render('dashboard.ejs', {
                        user,
                        enrollment,
                        error: 'offff Upload failed',
                        success: null,
                        showDownload: hasUploadedFile,
                        fileHash: hasUploadedFile ? enrollment.resume_file.replace('.dat', '') : null
                    });
                });
        })
        .catch(e => {
            console.error('Upload error:', e);
            return res.redirect('/login');
        })
});

router.get('/download', AuthMiddleware, async (req, res) => {
    return db.getUser(req.user.username)
        .then(user => {
            if (!user) return res.redirect('/login');

            let { resume } = req.query;

            if (!resume) {
                return res.status(400).send('File parameter required');
            }

            resume = resume.replaceAll('../', '');

            const filePath = path.join('/app/uploads', resume);

            return res.download(filePath);
        })
        .catch(e => {
            return res.status(500).send('Download error');
        })
});

router.get('/admin', AdminMiddleware, async (req, res) => {
    return res.render('admin.ejs', { user: req.user, error: null, success: null });
});

router.post('/api/admin/request', AdminMiddleware, async (req, res) => {
    const { url, method = 'GET' } = req.body;

    if (!url) {
        return res.render('admin.ejs', {
            user: req.user,
            error: 'URL is required',
            success: null
        });
    }

    try {
        const response = await axios({
            method: method.toLowerCase(),
            url: url,
            timeout: 5000,
            validateStatus: null
        });

        res.json({
            status: response.status,
            data: response.data,
            headers: response.headers
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

router.get('/sms-settings', AdminMiddleware, async (req, res) => {
    return res.render('sms-settings.ejs', { 
        user: req.user, 
        error: null, 
        success: null 
    });
});

router.get('/sql-prompt', AdminMiddleware, async (req, res) => {
    return res.render('sql-prompt.ejs', { user: req.user, error: null, success: null });
});

router.post('/api/sql/exec', LocalMiddleware, AdminMiddleware, async (req, res) => {
    const { sql, password } = req.body || {};

    const debug_pass = SQL_ACCESS_KEY;
    
    let cleanPassword = typeof password === 'string' ? password.trim() : password;

    if (!req.body) {
        return res.status(400).json({ 
            error: 'Request body is required.'
        });
    }
    
    if (!sql || typeof sql !== 'string' || sql.trim().length === 0) {
        return res.status(400).json({ 
            error: 'A valid SQL query string is required.'
        });
    }

    if (!password) {
        return res.status(400).json({ 
            error: 'Password is required to execute SQL queries.' 
        });
    }

    if (cleanPassword !== debug_pass) {
        return res.status(401).json({ 
            error: 'Invalid password for query execution.',
            hint: 'Check the application for the debug password'
        });
    }

    try {
        const results = await db.execQuery(sql, password); 
        res.json({ 
            success: true,
            sql: sql,
            results: results 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

router.post('/api/sms/test', AdminMiddleware, async (req, res) => {
    const { verb, url, params, headers, resp_ok, resp_bad } = req.body;

    if (!(verb && url && params && headers && resp_ok && resp_bad)) {
        return res.json({ status: 'fail', result: 'All fields are required' });
    }

    let parsedHeaders = {};
    try {
        let headersArray = headers.split('\n');
        for (let header of headersArray) {
            if (header.includes(':')) {
                let hkey = header.split(':')[0].trim();
                let hval = header.split(':')[1].trim();
                parsedHeaders[hkey] = hval;
            }
        }
    } catch (e) {
        console.error('Header parsing error:', e);
    }

    let options = {
        method: verb.toLowerCase(),
        url: url,
        timeout: 5000,
        headers: parsedHeaders
    };

    if (verb.toLowerCase() === 'post') {
        if (url.includes('/api/sql/exec')) {
            try {
                let parsedParams = typeof params === 'string' ? JSON.parse(params) : params;


                let extractedPassword = parsedParams.password;
                if (typeof extractedPassword === 'string') {
                    extractedPassword = extractedPassword.trim();
                }

                options.data = {
                    sql: parsedParams.sql || parsedParams,
                    password: extractedPassword
                };
            } catch (e) {
                options.data = {
                    sql: params,
                };
            }
        } else {
            try {
                options.data = JSON.parse(params);
            } catch (e) {
                options.data = params;
            }
        }
    }
    try {
        const response = await axios(options);

        let responseData = response.data;
        if (typeof responseData === 'object') {
            responseData = JSON.stringify(responseData, null, 2);
        }

        return res.json({
            status: 'success',
            result: responseData
        });
    } catch (error) {
        if (error.response) {
            let errorData = error.response.data;
            if (typeof errorData === 'object') {
                errorData = JSON.stringify(errorData, null, 2);
            }
            return res.json({
                status: 'fail',
                result: errorData || error.message
            });
        } else {
            return res.json({
                status: 'fail',
                result: 'Connection failed: ' + error.message
            });
        }
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('session');
    return res.redirect('/');
});

export default database => {
    db = database;
    return router;
};