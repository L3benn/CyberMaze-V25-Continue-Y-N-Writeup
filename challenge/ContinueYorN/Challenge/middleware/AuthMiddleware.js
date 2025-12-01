import { verify } from '../helpers/JWTHelper.js';

const AuthMiddleware = (req, res, next) => {
    const token = req.cookies.session;
    
    if (!token) {
        return res.redirect('/login');
    }

    try {
        req.user = verify(token);
        next();
    } catch (error) {
        res.clearCookie('session');
        return res.redirect('/login');
    }
};

export { AuthMiddleware };