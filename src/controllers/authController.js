const User = require('../models/User');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpire } = require('../config/jwt');
const sendEmail = require('../utils/sendEmail');

exports.registerUser = async (req, res) => {
    const { name, apellido, genero, email, password, cedula } = req.body;

    try {
        // Verifica si el usuario ya existe
        const userExists = await User.exists({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Crear el nuevo usuario sin hacer el hash de la contraseña
        const newUser = new User({
            name,
            apellido,
            genero,
            email,
            password, // Guardamos la contraseña sin hash, el modelo se encarga de eso
            profile: {
                genero,
                cedula
            }
        });

        await newUser.save();

        // ✉️ correo
        await sendEmail({
            to: email,
            subject: "Bienvenido al SIC 🎉",
            html: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">

                    <!-- HEADER -->
                    <div style="background: #1e293b; padding: 25px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0;">SIC</h1>
                    <p style="color: #cbd5f5; margin: 5px 0;">Sistema Integral Comunitario</p>
                    </div>

                    <!-- BODY -->
                    <div style="padding: 30px;">
                    <h2 style="color: #111827;">Hola ${name} ${apellido} 👋</h2>

                    <p style="color: #374151;">
                        Te damos la bienvenida al <b>Sistema Integral Comunitario (SIC)</b>.
                    </p>

                    <p style="color: #374151;">
                        Tu cuenta ha sido creada exitosamente. Ya puedes acceder al sistema y participar en las actividades comunitarias.
                    </p>

                    <!-- CREDENCIALES -->
                    <div style="background: #f1f5f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #111827;">🔐 Credenciales de acceso</h3>
                        <p><b>📧 Correo:</b> ${email}</p>
                        <p><b>🔑 Contraseña:</b> ${password}</p>
                        <p><b>👤 Rol:</b> Usuario</p>
                    </div>

                    <!-- BOTÓN -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://sic-comunitario.vercel.app/"
                        style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Ingresar al sistema
                        </a>
                    </div>

                    <p style="color: #6b7280;">
                        Gracias por ser parte de tu comunidad 🙌
                    </p>
                    </div>

                    <!-- FOOTER -->
                    <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
                    © 2026 SIC - Sistema Integral Comunitario
                    </div>

                </div>
            </div>
                `
        });

        res.status(201).json({ msg: 'Usuario creado y correo enviado 📧' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

exports.registerAdmin = async (req, res) => {
    const { name, apellido, cedula, genero, email, password } = req.body;

    try {
        // Verificar si ya existe el admin
        const adminExists = await Admin.exists({ email });
        if (adminExists) {
            return res.status(400).json({ msg: 'El administrador ya existe' });
        }

        // Crear admin
        const newAdmin = new Admin({
            name,
            apellido,
            cedula,
            genero,
            email,
            password
        });

        await newAdmin.save();

        // ✉️ correo
        await sendEmail({
            to: email,
            subject: "Bienvenido Administrador SIC 👑",
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">

                <!-- HEADER -->
                    <div style="background: linear-gradient(90deg, #1e293b, #0f172a); padding: 25px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0;">SIC ADMIN</h1>
                        <p style="color: #cbd5f5; margin: 5px 0;">Panel Administrativo</p>
                    </div>

                <!-- BODY -->
                <div style="padding: 30px;">
                    <h2 style="color: #111827;">Hola ${name} ${apellido} 👑</h2>

                    <p style="color: #374151;">
                        Has sido registrado como <b>Administrador</b> del Sistema Integral Comunitario.
                    </p>

                    <p style="color: #374151;">
                        Ahora puedes gestionar la plataforma con acceso completo:
                    </p>

                    <ul style="color: #374151;">
                        <li>✔️ Crear eventos y reuniones</li>
                        <li>✔️ Gestionar usuarios</li>
                        <li>✔️ Generar reportes y certificados</li>
                    </ul>

                    <!-- CREDENCIALES -->
                    <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #111827;">🔐 Credenciales de acceso</h3>
                        <p><b>📧 Correo:</b> ${email}</p>
                        <p><b>🔑 Contraseña:</b> ${password}</p>
                        <p><b>👑 Rol:</b> Administrador</p>
                    </div>

                    <!-- BOTÓN -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://sic-comunitario.vercel.app/"
                        style="background: #111827; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Ir al sistema
                        </a>
                    </div>

                    <p style="color: #6b7280;">
                        Gestiona tu comunidad de forma eficiente 🚀
                    </p>
                    </div>

                    <!-- FOOTER -->
                    <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
                    © 2026 SIC - Panel Administrativo
                    </div>

                </div>
            </div>
        `
        });

        res.status(201).json({
            msg: 'Administrador registrado y correo enviado 📧'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            msg: 'Error del servidor',
            error: err.message
        });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    try {
        const [admin, user] = await Promise.all([
            Admin.findOne({ email }).select('password _id').lean(),
            User.findOne({ email }).select('password _id').lean()
        ]);

        if (!admin && !user) {
            return res.status(404).json({ msg: "El correo no está registrado" });
        }

        const account = admin || user;
        const isAdmin = Boolean(admin);

        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "La contraseña es incorrecta" });
        }

        const payload = {
            user: {
                id: account._id,
                role: isAdmin ? 'admin' : 'user'
            }
        };

        jwt.sign(payload, jwtSecret, { expiresIn: jwtExpire }, (err, token) => {
            if (err) {
                console.error('Error al firmar el token:', err);
                throw err;
            }

            // Verificar el entorno
            if (process.env.NODE_ENV === 'production') {
                // Configuración para producción
                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: true, // Habilita HTTPS en producción
                    sameSite: 'None', // Permite cross-origin en producción
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
                });
            } else {
                // Configuración para desarrollo local
                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: false, // No es necesario HTTPS en desarrollo
                    sameSite: 'Lax', // Restricción moderada para mismo dominio
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
                });
            }

            // Enviar respuesta con el rol
            res.json({ msg: "Login exitoso", role: isAdmin ? 'admin' : 'user' });

        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// También actualiza el logout para eliminar solo la cookie auth_token
exports.logout = (req, res) => {
    res.clearCookie('auth_token', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });
    res.json({ msg: 'Logout exitoso' });
};


// Ruta para verificar autenticación
exports.checkAuth = (req, res) => {
    // req.user ya está disponible gracias al middleware auth
    res.json({ role: req.user.role });
};

exports.getUserInfo = (req, res) => {
    res.json({ userId: req.user.id, role: req.user.role });
};


