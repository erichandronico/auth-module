# Auth Module - Módulo de Autenticación para Node.js

Este módulo proporciona autenticación y gestión de usuarios en proyectos Node.js. Se integra con cualquier base de datos utilizando un `userRepository` personalizado.

## 🚀 Características
- Registro de usuarios
- Inicio de sesión con JWT
- Cambio y restablecimiento de contraseña
- Middleware de autenticación
- Rutas predefinidas para Express

---

## 📌 Instalación

Instala el módulo en tu proyecto:

```bash
npm install git+https://github.com/erichandronico/auth-module.git
```

<!-- Si usas NPM privado:
```bash
npm install @tuusuario/auth-module
``` -->

---

## 📂 Estructura Sugerida del Proyecto

```plaintext
mi-backend/
│── .env   # Configuraciones de entorno
│── server.js   # Punto de entrada del backend
│── repositories/
│   ├── userRepository.js  # Módulo de base de datos para usuarios
│── models/
│   ├── Usuario.js  # Modelo de Mongoose para usuarios
│── routes/
│   ├── authRoutes.js  # Rutas adicionales (si es necesario)
│── package.json
│── node_modules/
```

---

## 📖 Configuración del `.env`
Antes de usar el módulo, define la clave JWT en un archivo `.env`:

```ini
JWT_SECRET=supersecreto123
```

---

## 🛠 Implementación en un Proyecto Backend

### 1️⃣ **Definir un Repositorio de Usuarios**
Cada proyecto necesita definir su propia lógica de base de datos. A continuación, un ejemplo para **MongoDB con Mongoose**:

📄 **`repositories/userRepository.js`**
```javascript
const Usuario = require('../models/Usuario');

const userRepository = {
    findByEmail: (email) => Usuario.findOne({ email }),
    findById: (id) => Usuario.findById(id),
    createUser: (data) => new Usuario(data).save(),
    updatePassword: (id, newPassword) => Usuario.findByIdAndUpdate(id, { password: newPassword })
};

module.exports = userRepository;
```

### 2️⃣ **Crear un Modelo de Usuario en Mongoose**

📄 **`models/Usuario.js`**
```javascript
const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    telefono: { type: String },
    password: { type: String, required: true },
    roleId: { type: String, required: true, default: 'user' },
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);
```

### 3️⃣ **Integrar `auth-module` en Express**

📄 **`server.js`**
```javascript
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const userRepository = require('./repositories/userRepository');
const createAuthRoutes = require('auth-module');

const app = express();
app.use(express.json());

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/miapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Agregar rutas de autenticación
app.use('/auth', createAuthRoutes(userRepository));

app.listen(3000, () => console.log('Servidor corriendo en el puerto 3000'));
```

---

## 📌 Uso de las Rutas Disponibles

### 🏗 **Registro de Usuario**
```http
POST /auth/register
```
📄 **Body JSON:**
```json
{
    "nombre": "Juan Perez",
    "email": "juan@example.com",
    "telefono": "+56912345678",
    "password": "123456",
    "roleId": "admin"
}
```
📄 **Respuesta:**
```json
{
    "ok": true,
    "uid": "64b3f42e...
    "email": "juan@example.com",
    "roleId": "admin",
    "token": "eyJhbGci..."
}
```

### 🔑 **Inicio de Sesión**
```http
POST /auth/login
```
📄 **Body JSON:**
```json
{
    "email": "juan@example.com",
    "password": "123456"
}
```
📄 **Respuesta:**
```json
{
    "ok": true,
    "uid": "64b3f42e...",
    "email": "juan@example.com",
    "roleId": "admin",
    "token": "eyJhbGci..."
}
```

### 🔄 **Revalidar Token**
```http
GET /auth/revalidate
```
📄 **Encabezado:**
```ini
Authorization: Bearer <TOKEN>
```
📄 **Respuesta:**
```json
{
    "ok": true,
    "uid": "64b3f42e...",
    "roleId": "admin",
    "token": "eyJhbGci..."
}
```

### 🔧 **Cambiar Contraseña**
```http
POST /auth/change-password
```
📄 **Body JSON:**
```json
{
    "uid": "64b3f42e...",
    "password": "123456",
    "newPassword": "nuevaClave123"
}
```

### 🔄 **Restablecer Contraseña**
```http
POST /auth/reset-password
```
📄 **Body JSON:**
```json
{
    "email": "juan@example.com"
}
```
📄 **Respuesta:**
```json
{
    "ok": true,
    "msg": "Nueva contraseña generada: x1y2z3"
}
```

---

## 📌 Conclusión
Con este módulo puedes **agregar autenticación y gestión de usuarios** a cualquier backend Node.js sin repetir código.

✅ **Fácil de integrar** en cualquier aplicación.  
✅ **Base de datos flexible**, compatible con MongoDB, PostgreSQL, MySQL, etc.  
✅ **Seguridad optimizada** con JWT.  

🚀 **Ahora solo importa `auth-module` y deja que se encargue de todo!**  

---

✉ **Soporte**: Contacta a `erich.munoz@gmail.com` si necesitas ayuda. 🎯

