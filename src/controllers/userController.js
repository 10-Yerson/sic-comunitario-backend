const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
const bcrypt = require('bcryptjs');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// Obtener todos los usuarios
exports.getUsers = async (req, res) => {
    try {
        const { isActive, search } = req.query;
        
        // Construir filtros
        const filters = {};
        if (isActive !== undefined) filters.isActive = isActive === 'true';
        if (search) {
            filters.$or = [
                { name: { $regex: search, $options: 'i' } },
                { apellido: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'profile.cedula': { $regex: search, $options: 'i' } }
            ];
        }
        
        const users = await User.find(filters).select('-password');
        
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        
        res.json(user);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de usuario inválido' });
        }
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
    const { 
        name, 
        apellido, 
        email, 
        cedula, 
        fechaNacimiento, 
        genero, 
        telefono, 
        direccion, 
        lote,
        password,
        isActive 
    } = req.body;
    
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Actualizar campos básicos
        if (name) user.name = name;
        if (apellido) user.apellido = apellido;
        if (email) user.email = email;
        if (isActive !== undefined) user.isActive = isActive;
        
        // Actualizar perfil
        if (cedula) user.profile.cedula = cedula;
        if (fechaNacimiento) user.profile.fechaNacimiento = fechaNacimiento;
        if (genero) user.profile.genero = genero;
        if (telefono) user.profile.telefono = telefono;
        if (direccion) user.profile.direccion = direccion;
        if (lote) user.profile.lote = lote;

        // Actualizar contraseña si se proporciona
        if (password) {
            const salt = await bcrypt.genSalt(8);
            user.password = await bcrypt.hash(password, salt);
        }
        
        await user.save();
        
        // Retornar usuario sin contraseña
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.json({ msg: 'Usuario actualizado exitosamente', user: userResponse });
    } catch (err) {
        console.error("Error actualizando usuario:", err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Buscar usuario
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Eliminar imagen de perfil si no es la predeterminada
        if (user.profilePicture && !user.profilePicture.includes("ixv6tw8jfbhykflcmyex")) {
            const publicId = extractPublicId(user.profilePicture, 'Profiles');
            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        }

        // Eliminar registros de asistencia del usuario
        await Attendance.deleteMany({ user: userId });

        // Eliminar el usuario
        await user.deleteOne();

        res.json({ msg: 'Usuario y todos sus datos eliminados exitosamente' });

    } catch (err) {
        console.error('Error eliminando usuario:', err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// Subir imagen de perfil (USER)
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No se ha enviado ningún archivo' });
    }

    // Traer usuario autenticado
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    const oldImageUrl = user.profilePicture;

    // Subir nueva imagen a Cloudinary
    const result = await uploadToCloudinary(req.file);

    // URL por defecto
    const defaultUrl =
      'https://res.cloudinary.com/dbgj8dqup/image/upload/v1743182322/uploads/ixv6tw8jfbhykflcmyex.png';

    // Si la imagen anterior no es la predeterminada → eliminarla
    if (oldImageUrl && oldImageUrl !== defaultUrl) {
      const publicId = getPublicIdFromUrl(oldImageUrl);
      await cloudinary.uploader.destroy(publicId);
    }

    // Guardar nueva imagen
    user.profilePicture = result.secure_url;
    await user.save();

    res.json({
      msg: 'Imagen de perfil actualizada con éxito',
      profilePicture: result.secure_url
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error subiendo imagen de perfil' });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    res.json({
      id: user._id,
      name: user.name,
      apellido: user.apellido,
      email: user.email,
      profilePicture: user.profilePicture,
      role: user.role,
      isActive: user.isActive,
      profile: {
        cedula: user.profile?.cedula || null,
        genero: user.profile?.genero || null,
        telefono: user.profile?.telefono || null,
        direccion: user.profile?.direccion || null,
        lote: user.profile?.lote || null
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error obteniendo perfil' });
  }
};


// Eliminar imagen de perfil
exports.deleteProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        
        const defaultUrl = 'https://res.cloudinary.com/dbgj8dqup/image/upload/v1743182322/uploads/ixv6tw8jfbhykflcmyex.png';
        
        if (user.profilePicture === defaultUrl) {
            return res.status(200).json({ msg: 'Ya tienes la imagen por defecto' });
        }

        // Eliminar imagen actual en Cloudinary
        const publicId = getPublicIdFromUrl(user.profilePicture);
        await cloudinary.uploader.destroy(publicId);

        // Restaurar imagen por defecto
        user.profilePicture = defaultUrl;
        await user.save();

        res.status(200).json({ msg: 'Imagen de perfil eliminada. Se restauró la imagen por defecto.' });

    } catch (error) {
        console.error("Error al eliminar imagen de perfil:", error);
        res.status(500).json({ error: 'Error eliminando imagen de perfil' });
    }
};

// Funciones auxiliares
const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'Profiles', allowed_formats: ['jpg', 'jpeg', 'png'] },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(stream);
    });
};

const getPublicIdFromUrl = (url) => {
    const parts = url.split('/');
    const fileName = parts.pop().split('.')[0];
    const folder = parts.slice(parts.indexOf('Profiles')).join('/');
    return folder + '/' + fileName;
};

function extractPublicId(url, folder) {
    try {
        const segments = url.split('/');
        const filename = segments[segments.length - 1];
        const filenameWithoutExt = filename.split('.')[0];
        return `${folder}/${filenameWithoutExt}`;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
}