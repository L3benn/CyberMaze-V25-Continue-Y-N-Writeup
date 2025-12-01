import jwt from 'jsonwebtoken';

const JWT_SECRET = 'C3n7uRY0uN2025S3cr3tK3y'; 

const sign = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

const verify = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

export { sign, verify, JWT_SECRET };