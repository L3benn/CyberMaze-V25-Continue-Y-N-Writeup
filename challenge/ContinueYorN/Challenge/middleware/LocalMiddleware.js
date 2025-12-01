const LocalMiddleware = (req, res, next) => {

    const remoteIp = req.ip || req.connection.remoteAddress;
    const hostHeader = req.headers?.host; 

    if (remoteIp !== '127.0.0.1' && hostHeader !== '127.0.0.1:4002')
    {
        return res.status(403).json({ error: 'Localhost access required' });
    }

    next();
};

export { LocalMiddleware };