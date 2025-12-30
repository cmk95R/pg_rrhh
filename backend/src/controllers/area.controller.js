import Area from "../models/area.js";

// GET /areas
export const listAreas = async (req, res, next) => {
  try {
    // Puedes filtrar por ?activa=true si lo necesitas en el frontend
    const filter = {};
    if (req.query.activa === 'true') filter.activa = true;

    const areas = await Area.find(filter).sort({ nombre: 1 }).lean();
    res.json({ areas });
  } catch (e) {
    next(e);
  }
};

// GET /areas/:id
export const getArea = async (req, res, next) => {
  try {
    const area = await Area.findById(req.params.id).lean();
    if (!area) return res.status(404).json({ message: "Área no encontrada" });
    res.json({ area });
  } catch (e) {
    next(e);
  }
};

// POST /areas
export const createArea = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "El nombre del área es obligatorio." });
    }

    // Verificar si ya existe (insensible a mayúsculas/minúsculas)
    const existing = await Area.findOne({ 
      nombre: { $regex: new RegExp(`^${nombre.trim()}$`, "i") } 
    });

    if (existing) {
      return res.status(400).json({ message: "Ya existe un área con ese nombre." });
    }

    const area = await Area.create({ 
      nombre, 
      descripcion 
    });

    res.status(201).json({ area });
  } catch (e) {
    next(e);
  }
};

// PUT /areas/:id
export const updateArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activa } = req.body;

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (activa !== undefined) updateData.activa = activa;

    const area = await Area.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });

    if (!area) {
      return res.status(404).json({ message: "Área no encontrada." });
    }

    res.json({ area });
  } catch (e) {
    // Capturar error de duplicado si se intenta renombrar a un nombre existente
    if (e.code === 11000) {
      return res.status(400).json({ message: "Ya existe un área con ese nombre." });
    }
    next(e);
  }
};

// DELETE /areas/:id
export const deleteArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const area = await Area.findByIdAndDelete(id);

    if (!area) {
      return res.status(404).json({ message: "Área no encontrada." });
    }

    res.status(204).end();
  } catch (e) {
    next(e);
  }
};
