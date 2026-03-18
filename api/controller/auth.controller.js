import Joi from "joi";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { User } from "../models/index.js";
import { Op } from "sequelize";
import { StatusCodes } from "http-status-codes";

export const authController = {
  async register(req, res) {
    try {
      // Définition du schema de validation
      const registerSchema = Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().min(1).required(),
        password: Joi.string()
          .min(8)
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
          .required(),
        confirm: Joi.string()
          .min(8)
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
          .required(),
      });

      const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
      if (error) return res.status(400).json({ message: "Données invalides", details: error.details.map(d => d.message) });
      const { email, name, password, confirm } = value;

      // Vérifier que le MDP + CONFIRM correspondent, sinon 400 (Bad Request)
      if (password !== confirm) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Le mot de passe et sa confirmation ne correspondent pas",
        });
      }

      const alreadyExist = await User.findOne({
        where: {
          [Op.or]: [{ email }, { name }],
        },
      });

      // Vérifier si le username n'est pas déjà pris, sinon 409 (Conflict)
      if (alreadyExist) {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: "Email ou nom déjà utilisé" });
      }

      // Hacher le mot de passe à l'aide de argon2
      const hashPassword = await argon2.hash(password);

      // Enregistre l'utilisateur en BDD via le modèle User
      const createUser = await User.create({
        email: email,
        name: name,
        password: hashPassword,
      });

      // Le renvoyer au client
      res.status(StatusCodes.CREATED).json({
        id: createUser.id,
        email: createUser.email,
        nom: createUser.name,
        created_at: createUser.created_at,
        updated_at: createUser.updated_at,
      });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  },

  async login(req, res) {
    try {
      // 1. Validation des données
      const loginSchema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string()
          .min(8)
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
          .required(),
      });

      const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
      if (error) return res.status(400).json({ message: "Données invalides", details: error.details.map(d => d.message) });
      const { email, password } = value;

      // 2. Chercher l'utilisateur
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Email ou mot de passe incorrect",
        });
      }

      // 3. Vérifier le mot de passe (argon2)
      const validPassword = await argon2.verify(user.password, password);
      if (!validPassword) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Email ou mot de passe incorrect",
        });
      }

      // 4. Créer un token JWT (valable 24h)
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );

      // 5. Réponse avec token
      res.status(StatusCodes.OK).json({
        message: "Connexion réussie",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
};

