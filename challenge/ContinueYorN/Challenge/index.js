import express from 'express';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from './database.js';
import router from './routers/main.js';

import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 4002;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload({
    createParentPath: true
}));

app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use('/static', express.static(join(__dirname, 'static')));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

async function startServer() {
    try {
        const database = new Database();
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        app.use('/', router(database));
        
        app.listen(port, () => {
            console.log(`Continue Y/N CTF challenge running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();