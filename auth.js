const jwt = require('jsonwebtoken');

module.exports = (req, resp, next) => {
    try {
        // TODO: the following line may not need in future. Implemented for debug purpose only.
        if (!req.headers.authorization) throw ({ name: 'JsonWebTokenError', message: 'Bearer token missing from request.' });

        const token = req.headers.authorization.split(" ")[1];
        const decode = jwt.verify(token, process.env.JWT_ACCESS_KEY);
        next();
    } catch (error) {
        resp.status(401).json(error);
    }
};
