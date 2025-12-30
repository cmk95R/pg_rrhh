import { Router } from "express";
import {
  listAreas,
  getArea,
  createArea,
  updateArea,
  deleteArea,
} from "../controllers/area.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// --- Rutas Públicas ---
// Listar todas las áreas (útil para dropdowns en el frontend)
router.get("/", listAreas);

// Obtener una área específica por ID
router.get("/:id", getArea);

// --- Rutas Protegidas (Admin / RRHH) ---
// Crear nueva área
router.post("/", requireAuth, requireRole("admin", "rrhh"), createArea);

// Actualizar área existente
router.put("/:id", requireAuth, requireRole("admin", "rrhh"), updateArea);

// Eliminar área
router.delete("/:id", requireAuth, requireRole("admin", "rrhh"), deleteArea);

export default router;