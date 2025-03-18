const bcrypt = require('bcryptjs');
const authServiceFactory = require('../authService');

jest.mock('bcryptjs', () => ({
    hashSync: jest.fn(() => 'hashed_password'),
    compareSync: jest.fn((password, hashed) => password === 'password123'),
    genSaltSync: jest.fn(() => 'salt'),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn((payload, secret, options, callback) => callback(null, 'mock_token')),
}));

const mockUserRepository = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    findById: jest.fn(),
    updatePassword: jest.fn(),
};

const mockSendEmail = jest.fn();

const authService = authServiceFactory(mockUserRepository);

describe('Auth Service', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 📌 CREAR USUARIO
    describe('crearUsuario', () => {
        test('Debe fallar si el email no es válido', async () => {
            await expect(authService.crearUsuario({
                email: 'testnew',
                password: 'password123',
                password2: 'password123',
            })).rejects.toThrow('El email no es válido');
        });

        test('Debe fallar si el email está vacío', async () => {
            await expect(authService.crearUsuario({
                password: 'password123',
                password2: 'password123',
            })).rejects.toThrow('El email es requerido');
        });

        test('Debe fallar si las contraseñas no coinciden', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);

            await expect(authService.crearUsuario({
                email: 'test@example.com',
                password: 'password123',
                password2: 'password124',
            })).rejects.toThrow('Las contraseñas no coinciden');
        });

        test('Debe fallar si las contraseñas están vacías', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);

            await expect(authService.crearUsuario({
                email: 'test@example.com',
                nombre: 'test',
                password2: '',
            })).rejects.toThrow('Las contraseñas no pueden estar vacías');
        });

        test('Debe fallar si el usuario ya existe', async () => {
            mockUserRepository.findByEmail.mockResolvedValue({ id: '123', email: 'test@example.com' });

            await expect(authService.crearUsuario({
                email: 'test@example.com',
                password: 'password123',
                password2: 'password123',
            })).rejects.toThrow('El usuario ya existe');
        });
    });

    // 📌 LOGIN USUARIO
    describe('loginUsuario', () => {
        test('Debe fallar si el usuario no existe', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);

            await expect(authService.loginUsuario({
                email: 'test@example.com',
                password: 'password123',
            })).rejects.toThrow('Credenciales inválidas');
        });

        test('Debe fallar si el usuario no tiene contraseña almacenada', async () => {
            mockUserRepository.findByEmail.mockResolvedValue({ id: '123', email: 'test@example.com' });
        
            await expect(authService.loginUsuario({
                email: 'test@example.com',
            })).rejects.toThrow('Credenciales inválidas');
        });

        test('Debe devolver un token si el login es exitoso', async () => {
            mockUserRepository.findByEmail.mockResolvedValue({
                id: '123',
                email: 'test@example.com',
                password: bcrypt.hashSync('password123', bcrypt.genSaltSync()),
            });

            const result = await authService.loginUsuario({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(result).toHaveProperty('uid', '123');
            expect(result).toHaveProperty('email', 'test@example.com');
            expect(result).toHaveProperty('token', 'mock_token');
        });
    });

    // 📌 CAMBIAR CONTRASEÑA
    describe('cambiarPassword', () => {
        test('Debe fallar si el usuario no existe', async () => {
            mockUserRepository.findById.mockResolvedValue(null);

            await expect(authService.cambiarPassword({
                uid: '123',
                password: 'oldpassword',
                newPassword: 'newpassword',
                newPassword2: 'newpassword',
            })).rejects.toThrow('Usuario no encontrado');
        });

        test('Debe fallar si las contraseñas no coinciden', async () => {
            mockUserRepository.findById.mockResolvedValue({
                id: '123',
                email: 'test@example.com',
                password: bcrypt.hashSync('password123', bcrypt.genSaltSync()),
            });

            await expect(authService.cambiarPassword({
                uid: '123',
                password: 'password123',
                newPassword: 'newpassword',
                newPassword2: 'otherpassword',
            })).rejects.toThrow('Las contraseñas no coinciden');
        });

        test('Debe actualizar la contraseña si la actual es válida', async () => {
            mockUserRepository.findById.mockResolvedValue({
                id: '123',
                email: 'test@example.com',
                password: bcrypt.hashSync('password123', bcrypt.genSaltSync()),
            });

            mockUserRepository.updatePassword.mockResolvedValue(true);

            const result = await authService.cambiarPassword({
                uid: '123',
                password: 'password123',
                newPassword: 'newpassword',
                newPassword2: 'newpassword',
            });

            expect(result).toHaveProperty('msg', 'Contraseña actualizada');
        });
    });

    // 📌 RESETEAR CONTRASEÑA
    describe('resetPassword', () => {
        test('Debe fallar si el usuario no existe', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);

            await expect(authService.resetPassword('test@example.com', mockSendEmail))
                .rejects.toThrow('Usuario no encontrado');
        });

        test('Debe fallar si no se proporciona el servicio de envío de correos', async () => {
            mockUserRepository.findByEmail.mockResolvedValue({ id: '123', email: 'test@example.com' });

            await expect(authService.resetPassword('test@example.com'))
                .rejects.toThrow('El servicio de envío de correo no está disponible');
        });

        test('Debe generar una nueva contraseña y enviarla por correo', async () => {
            mockUserRepository.findByEmail.mockResolvedValue({ id: '123', email: 'test@example.com' });
            mockUserRepository.updatePassword.mockResolvedValue(true);

            const result = await authService.resetPassword('test@example.com', mockSendEmail);

            expect(result).toHaveProperty('msg');
            expect(result.msg).toMatch(/Se ha enviado una nueva contraseña a tu correo/i);
            expect(mockSendEmail).toHaveBeenCalled();
        });
    });

    // 📌 REVALIDAR TOKEN
    describe('revalidarToken', () => {
        test('Debe devolver un nuevo token', async () => {
            const result = await authService.revalidarToken('123');

            expect(result).toHaveProperty('token');
            expect(result.token).toBe('mock_token');
        });
    });

});