import { verify } from '../helpers/JWTHelper.js';

const AdminMiddleware = (req, res, next) => {
    const token = req.cookies.session;
    
    if (!token) {
        return res.status(403).send('Access denied');
    }

    try {
        const user = verify(token);

        if (user.username === 'admin') {
            req.user = user;
            next();
        } else {
            return res.status(403).send('Admin access required');
        }
    } catch (error) {
        return res.status(403).send('Invalid token');
    }
};

export { AdminMiddleware };