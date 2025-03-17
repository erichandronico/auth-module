const jwt = require('jsonwebtoken');

const generarJWT = (uid, roleId) => {
    return new Promise((resolve, reject) => {
        const payload = { uid, roleId };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) reject('No se pudo generar el token');
            else resolve(token);
        });
    });
};

module.exports = { generarJWT };