// controllers/application.controller.js

import mongoose from "mongoose";
import Application from "../models/Application.js";
import Search from "../models/Search.js";
import Cv from "../models/Cv.js";
import { APP_STATES } from "../models/Application.js";

// POST /searches/:id/apply (user)
export const applyToSearch = async (req, res, next) => {
  try {
    const searchId = req.params.id;
    const userId = req.user._id;
    const message = (req.body?.message || "").trim();

    const search = await Search.findById(searchId).lean();
    if (!search) return res.status(404).json({ message: "Búsqueda no encontrada" });
    if (search.estado !== "Activa") {
      return res.status(400).json({ message: "La búsqueda no está activa" });
    }

    const existing = await Application.findOne({ search: searchId, user: userId }).lean();
    if (existing) return res.status(409).json({ message: "Ya estás postulado a esta búsqueda" });

    const cv = await Cv.findOne({ user: userId }).lean();

    const app = await Application.create({
      search: searchId,
      user: userId,
      message,
      cvRef: cv?._id,
      cvSnapshot: cv
        ? {
            nombre: cv.nombre ?? req.user.nombre,
            apellido: cv.apellido ?? req.user.apellido,
            email: cv.email ?? req.user.email,
            telefono: cv.telefono ?? "",
            linkedin: cv.linkedin ?? "",
            // CORRECCIÓN: Añadimos la información del archivo al snapshot
            cvFile: cv.cvFile, 
            ...cv, // Copiamos todos los campos del CV al snapshot
          }
        : {
            nombre: req.user.nombre,
            apellido: req.user.apellido,
            email: req.user.email,
          },
    });

    res.status(201).json({ application: app });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: "Ya estás postulado a esta búsqueda" });
    }
    next(e);
  }
};

// GET /applications/me (user)
export const myApplications = async (req, res, next) => {
  try {
    const items = await Application.find({ user: req.user._id })
      .populate("search", "titulo area estado ubicacion")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) { next(e); }
};

// --- Admin ---

// GET /admin/applications
export const listApplications = async (req, res, next) => {
  try {
    const { state, search, q } = req.query;
    const matchStage = {};

    if (state && APP_STATES.includes(state)) matchStage.state = state;
    if (search && mongoose.Types.ObjectId.isValid(search)) {
      matchStage.search = new mongoose.Types.ObjectId(search);
    }

    if (q && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      matchStage.$or = [
        { "cvSnapshot.nombre": rx },
        { "cvSnapshot.apellido": rx },
        { "cvSnapshot.email": rx },
        { message: rx },
      ];
    }

    const items = await Application.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      // Lookup User
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userObj"
        }
      },
      { $unwind: { path: "$userObj", preserveNullAndEmptyArrays: true } },
      // Lookup Search
      {
        $lookup: {
          from: "searches",
          localField: "search",
          foreignField: "_id",
          as: "searchObj"
        }
      },
      { $unwind: { path: "$searchObj", preserveNullAndEmptyArrays: true } },
      // Lookup Current CV (para obtener el ID actualizado)
      {
        $lookup: {
          from: "cvs",
          localField: "user", // Application.user es el ID del usuario
          foreignField: "user",
          as: "currentCv"
        }
      },
      { $unwind: { path: "$currentCv", preserveNullAndEmptyArrays: true } },
      // Project
      {
        $project: {
          _id: 1,
          state: 1,
          message: 1,
          createdAt: 1,
          updatedAt: 1,
          cvRef: 1,
          cvSnapshot: 1,
          user: {
            _id: "$userObj._id",
            publicId: "$userObj.publicId",
            nombre: "$userObj.nombre",
            apellido: "$userObj.apellido",
            email: "$userObj.email",
            rol: "$userObj.rol",
            direccion: "$userObj.direccion",
            telefono: "$userObj.telefono",
            cvId: "$currentCv._id" // <--- Aquí inyectamos el ID del CV actual
          },
          search: {
            _id: "$searchObj._id",
            titulo: "$searchObj.titulo",
            area: "$searchObj.area",
            estado: "$searchObj.estado",
            ubicacion: "$searchObj.ubicacion",
            descripcion: "$searchObj.descripcion"
          }
        }
      }
    ]);

    res.json({ items });
  } catch (e) { next(e); }
};

// PATCH /admin/applications/:id  { state }
export const updateApplication = async (req, res, next) => {
  try {
    const state = req.body?.state;
    if (!APP_STATES.includes(state)) {
      return res.status(400).json({ message: "Estado inválido" });
    }
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { state },
      { new: true, runValidators: true }
    );
    if (!app) return res.status(404).json({ message: "Postulación no encontrada" });
    res.json({ application: app });
  } catch (e) { next(e); }
};

// --- NUEVAS FUNCIONES ---

/**
 * 🗑️ Retirar una postulación.
 * DELETE /applications/:id (user)
 */
export const withdrawApplication = async (req, res, next) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user._id;

    // 🔑 Verificación de seguridad: Asegurarnos de que la postulación
    // pertenezca al usuario que está haciendo la solicitud.
    const application = await Application.findOne({
      _id: applicationId,
      user: userId,
    });

    if (!application) {
      // Si no se encuentra, puede ser porque no existe o no es del usuario.
      // Devolvemos 404 para no dar información de más.
      return res.status(404).json({ message: "Postulación no encontrada." });
    }

    // Eliminamos la postulación encontrada
    await application.deleteOne();

    res.status(200).json({ message: "Postulación retirada con éxito." });

  } catch (e) {
    next(e);
  }
};
