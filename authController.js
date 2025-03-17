const authServiceFactory = require('./authService');

module.exports = (userRepository) => {
    const authService = authServiceFactory(userRepository);

    return {
        async crearUsuario(req, res) {
            try {
                const data = await authService.crearUsuario(req.body);
                res.status(201).json({ ok: true, tipo: "success", msg: "Usuario creado correctamente", ...data });
            } catch (error) {
                res.status(400).json({ ok: false, tipo: "error", msg: error.message });
            }
        },

        async loginUsuario(req, res) {
            try {
                const data = await authService.loginUsuario(req.body);
                res.json({ ok: true, tipo: "success", msg: "Usuario logueado correctamente", ...data });
            } catch (error) {
                res.status(400).json({ ok: false, tipo: "error", msg: error.message });
            }
        },

        async cambiarPassword(req, res) {
            try {
                const data = await authService.cambiarPassword(req.body);
                res.json({ ok: true, tipo: "success", msg: "Contraseña actualizada correctamente", ...data });
            } catch (error) {
                res.status(400).json({ ok: false, tipo: "error", msg: error.message });
            }
        },

        async resetPassword(req, res) {
            try {
                const data = await authService.resetPassword(req.body.email);
                res.json({ ok: true, tipo: "success", msg: "Contraseña restablecida correctamente", ...data });
            } catch (error) {
                res.status(400).json({ ok: false, tipo: "error", msg: error.message });
            }
        },

        async revalidarToken(req, res) {
            try {
                const { uid } = req;
                const data = await authService.revalidarToken(uid);
                res.json({ ok: true, tipo: "success", msg: "Token revalidado correctamente", ...data });
            } catch (error) {
                res.status(400).json({ ok: false, tipo: "error", msg: error.message });
            }
        }
    };
};