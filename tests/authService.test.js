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

const authService = authServiceFactory(mockUserRepository);

describe('Auth Service', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 🔹 Test: No debe permitir registrar un usuario si el email ya existe
    test('crearUsuario debe fallar si el usuario ya existe', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({ id: '123', email: 'test@example.com' });

        await expect(authService.crearUsuario({
            email: 'test@example.com',
            password: 'password123',
        })).rejects.toThrow('El usuario ya existe');
    });

    // 🔹 Test: No debe permitir login si el usuario no existe
    test('loginUsuario debe fallar si el usuario no existe', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        await expect(authService.loginUsuario({
            email: 'test@example.com',
            password: 'password123',
        })).rejects.toThrow('Credenciales inválidas');
    });

    // 🔹 Test: No debe permitir login si el usuario no tiene contraseña almacenada
    test('loginUsuario debe fallar si el usuario no tiene contraseña', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({ id: '123', email: 'test@example.com' });
    
        await expect(authService.loginUsuario({
            email: 'test@example.com',
        })).rejects.toThrow('Credenciales inválidas');
    });

    // 🔹 Test: No debe permitir cambiar la contraseña si el usuario no existe
    test('cambiarPassword debe fallar si el usuario no existe', async () => {
        mockUserRepository.findById.mockResolvedValue(null);

        await expect(authService.cambiarPassword({
            uid: '123',
            password: 'oldpassword',
            newPassword: 'newpassword',
        })).rejects.toThrow('Usuario no encontrado');
    });

    // 🔹 Test: No debe permitir crear un usuario si las contraseñas no coinciden
    test('crearUsuario debe fallar si las contraseñas no coinciden', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        await expect(authService.crearUsuario({
            email: 'testnew@example.com',
            password: 'password123',
            password2: 'password124',
        })).rejects.toThrow('Las contraseñas no coinciden');
        // expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    // 🔹 Test: No debe permitir crear un usuario si las contraseñas están vacías
    test('crearUsuario debe fallar si las contraseñas están vacías', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        await expect(authService.crearUsuario({
            email: 'testnew@example.com',
            nombre: 'testnew',
            password2: '',
        })).rejects.toThrow('Las contraseñas no pueden estar vacías');
    });

    // 🔹 Test: Debe actualizar correctamente la contraseña si la actual es válida
    test('cambiarPassword debe actualizar la contraseña si la actual es válida', async () => {
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
        });

        expect(result).toHaveProperty('msg', 'Contraseña actualizada');
    });

    // 🔹 Test: No debe permitir reset de contraseña si el usuario no existe
    test('resetPassword debe fallar si el usuario no existe', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        await expect(authService.resetPassword('test@example.com')).rejects.toThrow('Usuario no encontrado');
    });

    // 🔹 Test: Debe generar una nueva contraseña para el usuario
    test('resetPassword debe generar una nueva contraseña', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({ id: '123', email: 'test@example.com' });
        mockUserRepository.updatePassword.mockResolvedValue(true);

        const result = await authService.resetPassword('test@example.com');

        expect(result).toHaveProperty('msg');
        expect(result.msg).toMatch(/Password restablecido/i);
    });

    // 🔹 Test: Revalidar token debe devolver un nuevo token
    test('revalidarToken debe devolver un nuevo token', async () => {
        const result = await authService.revalidarToken('123');

        expect(result).toHaveProperty('token');
        expect(result.token).toBe('mock_token');
    });

    // 🔹 Test: No debe permitir crear un usuario si el email no es válido
    test('crearUsuario debe fallar si el email no es válido', async () => {
        await expect(authService.crearUsuario({
            email: 'testnew',
            password: 'password123',
            password2: 'password123',
        })).rejects.toThrow('El email no es válido');
    });

    // Test: no debe permitir crear un usuario si no se proporciona un email
    test('crearUsuario debe fallar si no se proporciona un email', async () => {
        await expect(authService.crearUsuario({
            password: 'password123',
            password2: 'password123',
        })).rejects.toThrow('El email es requerido');
    });
    
});