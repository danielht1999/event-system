import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../infrastructure/database/connection';

const JWT_SECRET = process.env.JWT_SECRET || 'mi-secreto-super-seguro-2024';

export class AuthController {
  async register(req: Request, res: Response) {
    const { email, nombre, password, rol } = req.body;

    try {
      const existingUser = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      await pool.query(
        `INSERT INTO usuarios (id, email, nombre, password_hash, rol)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, email, nombre, passwordHash, rol || 'asistente']
      );

      const token = jwt.sign(
        { id: userId, email, rol: rol || 'asistente' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: { id: userId, email, nombre, rol: rol || 'asistente' },
          token
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario',
        error: error.message
      });
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        'SELECT id, email, nombre, password_hash, rol FROM usuarios WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Email o contraseña incorrectos'
        });
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email o contraseña incorrectos'
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol
          },
          token
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión',
        error: error.message
      });
    }
  }

  async getProfile(req: Request, res: Response) {
    const userId = (req as any).user?.id;

    try {
      const result = await pool.query(
        'SELECT id, email, nombre, rol, creado_en FROM usuarios WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil'
      });
    }
  }
}