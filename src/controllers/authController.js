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
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:20px 0;">
                <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                    <!-- HEADER -->
                    <tr>
                        <td style="background:#16a34a;border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
                        <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 20px;margin-bottom:16px;">
                            <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:3px;">SIC</span>
                        </div>
                        <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Sistema Integral Comunitario</p>
                        </td>
                    </tr>

                    <!-- BANNER -->
                    <tr>
                        <td style="background:#15803d;padding:24px 40px;text-align:center;">
                        <div style="font-size:36px;margin-bottom:12px;">🤝</div>
                        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">¡Bienvenido Colaborador!</h1>
                        <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:15px;">Tu cuenta de colaborador ha sido creada exitosamente</p>
                        </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                        <td style="background:#ffffff;padding:40px;">

                        <p style="margin:0 0 20px;color:#111827;font-size:16px;">Hola, <strong>${name} ${apellido}</strong> 👋</p>
                        <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.7;">
                            Has sido registrado como <strong>Colaborador</strong> del Sistema Integral Comunitario. Podrás gestionar eventos, registrar asistencias y participar activamente en la administración de tu comunidad.
                        </p>

                        <!-- Funciones -->
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                            <p style="margin:0 0 14px;color:#111827;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">✅ Tus funciones como colaborador</p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                            <tr><td style="padding:6px 0;"><span style="color:#16a34a;font-size:14px;margin-right:8px;">✓</span><span style="color:#374151;font-size:13px;">Crear y gestionar eventos comunitarios</span></td></tr>
                            <tr><td style="padding:6px 0;"><span style="color:#16a34a;font-size:14px;margin-right:8px;">✓</span><span style="color:#374151;font-size:13px;">Registrar asistencia de residentes</span></td></tr>
                            <tr><td style="padding:6px 0;"><span style="color:#16a34a;font-size:14px;margin-right:8px;">✓</span><span style="color:#374151;font-size:13px;">Gestionar reuniones y trabajos comunitarios</span></td></tr>
                            <tr><td style="padding:6px 0;"><span style="color:#16a34a;font-size:14px;margin-right:8px;">✓</span><span style="color:#374151;font-size:13px;">Generar reportes y actas de reuniones</span></td></tr>
                            </table>
                        </div>

                        <!-- Credenciales -->
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:28px;">
                            <p style="margin:0 0 16px;color:#111827;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">🔐 Tus credenciales de acceso</p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                                <span style="color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">📧 Correo electrónico</span><br>
                                <span style="color:#111827;font-size:15px;font-weight:600;">${email}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                                <span style="color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">🔑 Contraseña</span><br>
                                <span style="color:#111827;font-size:15px;font-weight:600;font-family:monospace;background:#f1f5f9;padding:3px 8px;border-radius:6px;">${password}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;">
                                <span style="color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">🤝 Rol asignado</span><br>
                                <span style="display:inline-block;margin-top:4px;background:#dcfce7;color:#16a34a;font-size:12px;font-weight:700;padding:3px 12px;border-radius:20px;">Colaborador</span>
                                </td>
                            </tr>
                            </table>
                        </div>

                        <!-- Aviso seguridad -->
                        <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:14px 18px;margin-bottom:28px;">
                            <p style="margin:0;color:#9a3412;font-size:13px;">
                            <strong>⚠️ Por seguridad</strong>, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.
                            </p>
                        </div>

                        <!-- Botón -->
                        <div style="text-align:center;margin-bottom:28px;">
                            <a href="https://sic-comunitario.vercel.app/"
                            style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;">
                            Ingresar al sistema →
                            </a>
                        </div>

                        <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
                            Gracias por ser parte de tu comunidad 🙌
                        </p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
                        <p style="margin:0 0 6px;color:#374151;font-size:13px;font-weight:700;">SIC — Sistema Integral Comunitario</p>
                        <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 · Todos los derechos reservados</p>
                        <p style="margin:8px 0 0;color:#d1d5db;font-size:11px;">Este correo fue enviado automáticamente, por favor no respondas.</p>
                        </td>
                    </tr>

                    </table>
                </td>
                </tr>
            </table>

            </body>
            </html>
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
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:20px 0;">
                <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                    <!-- HEADER -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;border:1px solid #334155;border-bottom:none;">
                        <div style="display:inline-block;background:rgba(250,204,21,0.1);border:1px solid rgba(250,204,21,0.3);border-radius:12px;padding:10px 20px;margin-bottom:16px;">
                            <span style="color:#fbbf24;font-size:22px;font-weight:800;letter-spacing:3px;">SIC ADMIN</span>
                        </div>
                        <p style="margin:0;color:#64748b;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Panel Administrativo</p>
                        </td>
                    </tr>

                    <!-- BANNER -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1e293b,#111827);padding:28px 40px;text-align:center;border-left:1px solid #334155;border-right:1px solid #334155;">
                        <div style="font-size:36px;margin-bottom:12px;">👑</div>
                        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;">Acceso Administrativo</h1>
                        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Has sido registrado como Administrador del SIC</p>
                        </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                        <td style="background:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

                        <p style="margin:0 0 20px;color:#111827;font-size:16px;">Hola, <strong>${name} ${apellido}</strong></p>
                        <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.7;">
                            Has sido registrado como <strong>Administrador</strong> del Sistema Integral Comunitario. Tienes acceso completo a la plataforma para gestionar todos los aspectos del sistema.
                        </p>

                        <!-- Privilegios -->
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                            <p style="margin:0 0 14px;color:#111827;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">✅ Tus privilegios de administrador</p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                            <tr><td style="padding:6px 0;"><span style="color:#16a34a;font-size:14px;margin-right:8px;">✓</span><span style="color:#374151;font-size:13px;">Crear y gestionar eventos comunitarios</span></td></tr>
                            <tr><td style="padding:6px 0;"><span style="color:#16a34a;font-size:14px;margin-right:8px;">✓</span><span style="color:#374151;font-size:13px;">Administrar usuarios y colaboradores</span></td></tr>
                            <tr><td style="padding:6px 0;"><span style="color:#16a34a;font-size:14px;margin-right:8px;">✓</span><span style="color:#374151;font-size:13px;">Generar reportes y certificados</span></td></tr>
                            <tr><td style="padding:6px 0;"><span style="color:#16a34a;font-size:14px;margin-right:8px;">✓</span><span style="color:#374151;font-size:13px;">Configuración completa del sistema</span></td></tr>
                            <tr><td style="padding:6px 0;"><span style="color:#16a34a;font-size:14px;margin-right:8px;">✓</span><span style="color:#374151;font-size:13px;">Acceso a estadísticas y métricas</span></td></tr>
                            </table>
                        </div>

                        <!-- Credenciales -->
                        <div style="background:#f8fafc;border:1px solid #fde68a;border-radius:12px;padding:24px;margin-bottom:28px;">
                            <p style="margin:0 0 16px;color:#111827;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">🔐 Credenciales de acceso</p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:10px 0;border-bottom:1px solid #fde68a;">
                                <span style="color:#92400e;font-size:12px;text-transform:uppercase;font-weight:600;">📧 Correo electrónico</span><br>
                                <span style="color:#111827;font-size:15px;font-weight:600;">${email}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;border-bottom:1px solid #fde68a;">
                                <span style="color:#92400e;font-size:12px;text-transform:uppercase;font-weight:600;">🔑 Contraseña</span><br>
                                <span style="color:#111827;font-size:15px;font-weight:600;font-family:monospace;background:#fff;padding:3px 8px;border-radius:6px;border:1px solid #fde68a;">${password}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;">
                                <span style="color:#92400e;font-size:12px;text-transform:uppercase;font-weight:600;">👑 Rol asignado</span><br>
                                <span style="display:inline-block;margin-top:4px;background:#1e293b;color:#fbbf24;font-size:12px;font-weight:700;padding:3px 12px;border-radius:20px;">Administrador</span>
                                </td>
                            </tr>
                            </table>
                        </div>

                        <!-- Aviso -->
                        <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:14px 18px;margin-bottom:28px;">
                            <p style="margin:0;color:#9a3412;font-size:13px;">
                            <strong>⚠️ Importante:</strong> Cambia tu contraseña inmediatamente después de iniciar sesión. Mantén tus credenciales seguras y no las compartas.
                            </p>
                        </div>

                        <!-- Botón -->
                        <div style="text-align:center;margin-bottom:28px;">
                            <a href="https://sic-comunitario.vercel.app/"
                            style="display:inline-block;background:#1e293b;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;">
                            Ir al panel de administración →
                            </a>
                        </div>

                        <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
                            Gestiona tu comunidad de forma eficiente 🚀
                        </p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background:#1e293b;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
                        <p style="margin:0 0 6px;color:#94a3b8;font-size:13px;font-weight:700;">SIC — Panel Administrativo</p>
                        <p style="margin:0;color:#475569;font-size:12px;">© 2026 · Sistema Integral Comunitario</p>
                        <p style="margin:8px 0 0;color:#334155;font-size:11px;">Este correo fue enviado automáticamente, por favor no respondas.</p>
                        </td>
                    </tr>

                    </table>
                </td>
                </tr>
            </table>

            </body>
            </html>
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


