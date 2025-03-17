const jwt = require('jsonwebtoken');

const generarJWT = (uid) => {
    return new Promise((resolve, reject) => {
        const payload = { uid };

        // Asegurar que JWT_SECRET existe
        const secret = process.env.JWT_SECRET || 'default_secret_$$01';
        if (!secret) {
            return reject('JWT_SECRET no está definido');
        }

        jwt.sign(payload, secret, { expiresIn: '1h' }, (err, token) => {
            if (err) reject('No se pudo generar el token');
            else resolve(token);
        });
    });
};

module.exports = { generarJWT };