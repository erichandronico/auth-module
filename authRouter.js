const express = require('express');
const authControllerFactory = require('./authController');

module.exports = (userRepository) => {
    const router = express.Router();
    const authController = authControllerFactory(userRepository);

    router.post('/register', authController.crearUsuario);
    router.post('/login', authController.loginUsuario);
    router.post('/change-password', authController.cambiarPassword);
    router.post('/reset-password', authController.resetPassword);
    router.get('/revalidate', authController.revalidarToken);

    return router;
};