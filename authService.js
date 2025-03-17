const bcrypt = require('bcryptjs');
const { generarJWT } = require('./jwtService');

module.exports = (userRepository) => ({
    async crearUsuario({ email, password  }) {
        const userExists = await userRepository.findByEmail(email);
        if (userExists) {
            throw new Error('El usuario ya existe');
        }

        const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync());
        const usuario = await userRepository.createUser({ email, password: passwordHash });

        const token = await generarJWT(usuario.id);
        return { uid: usuario.id, email: usuario.email, token };
    },

    async loginUsuario({ email, password }) {
        if (!email || !password) throw new Error('Credenciales inválidas');
            
        const usuario = await userRepository.findByEmail(email);
        if (!usuario) throw new Error('Credenciales inválidas');

        const validPassword = bcrypt.compareSync(password, usuario.password);
        if (!validPassword) throw new Error('Credenciales inválidas');

        const token = await generarJWT(usuario.id);
        return { uid: usuario.id, email: usuario.email, token };
    },

    async cambiarPassword({ uid, password, newPassword }) {
        const usuario = await userRepository.findById(uid);
        if (!usuario) throw new Error('Usuario no encontrado');

        const validPassword = bcrypt.compareSync(password, usuario.password);
        if (!validPassword) throw new Error('Contraseña incorrecta');

        usuario.password = bcrypt.hashSync(newPassword, bcrypt.genSaltSync());
        await userRepository.updatePassword(uid, usuario.password);

        const token = await generarJWT(uid);
        return { msg: 'Contraseña actualizada', token };
    },

    async resetPassword(email) {
        const usuario = await userRepository.findByEmail(email);
        if (!usuario) throw new Error('Usuario no encontrado');
    
        const newPassword = Math.random().toString(36).slice(-8);
        const passwordHash = bcrypt.hashSync(newPassword, bcrypt.genSaltSync());
    
        await userRepository.updatePassword(usuario.id, passwordHash);
        return { msg: `Password restablecido para ${usuario.email}` };
    },

    async revalidarToken(uid) {
        const token = await generarJWT(uid);
        return { uid, token };
    }
});