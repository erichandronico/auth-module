const bcrypt = require('bcryptjs');
const { generarJWT } = require('./jwtService');

module.exports = (userRepository) => ({
    async crearUsuario({ email, password, password2, ...datos  }) {

        if (!email) 
            throw new Error('El email es requerido');

        if ( !email.includes('@') )
            throw new Error('El email no es válido');

        const userExists = await userRepository.findByEmail(email);
        if (userExists) {
            throw new Error('El usuario ya existe');
        }

        if (!password || !password2) {
            throw new Error('Las contraseñas no pueden estar vacías');
        } 

        if (password !== password2) {
            throw new Error('Las contraseñas no coinciden');
        }

        const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync());
        const usuario = await userRepository.createUser({ email, password: passwordHash, ...datos });

        const token = await generarJWT(usuario.id);
        return { usuario: { uid: usuario.id, email: usuario.email, ...datos }, token };
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

    async cambiarPassword({ uid, password, newPassword, newPassword2 }) {

        if (!password || !newPassword || !newPassword2) {
            throw new Error('Todas las contraseñas son requeridas');
        }

        if (newPassword !== newPassword2) {
            throw new Error('Las contraseñas no coinciden');
        }
        const usuario = await userRepository.findById(uid);
        if (!usuario) throw new Error('Usuario no encontrado');

        const validPassword = bcrypt.compareSync(password, usuario.password);
        if (!validPassword) throw new Error('Contraseña incorrecta');

        usuario.password = bcrypt.hashSync(newPassword, bcrypt.genSaltSync());
        await userRepository.updatePassword(uid, usuario.password);

        const token = await generarJWT(uid);
        return { msg: 'Contraseña actualizada', token };
    },

    async resetPassword(email, sendEmail) {
        if (!email) throw new Error('El email es requerido');
        if ( !email.includes('@') )
            throw new Error('El email no es válido');
        if ( !sendEmail )
            throw new Error('El servicio de envío de correo no está disponible');

        const usuario = await userRepository.findByEmail(email);
        if (!usuario) throw new Error('Usuario no encontrado');
    
        // Generar nueva contraseña aleatoria
        const newPassword = Math.random().toString(36).slice(-8);
        const passwordHash = bcrypt.hashSync(newPassword, bcrypt.genSaltSync());
    
        // Guardar la nueva contraseña en la BD
        await userRepository.updatePassword(usuario.id, passwordHash);
    
        // Enviar la nueva contraseña por correo
        await sendEmail(usuario.email, `Tu nueva contraseña es: ${newPassword}`);
    
        return { msg: `Se ha enviado una nueva contraseña a tu correo ${email}.` };
    },

    async revalidarToken(uid) {
        const token = await generarJWT(uid);
        return { uid, token };
    }
});