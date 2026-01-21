import Application from "../models/Application.js";
import Search from "../models/Search.js";
import User from "../models/User.js";
import Cv from "../models/Cv.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      newApplications,
      activeSearches,
      pendingApplications,
      hiredApplications,
      rejectedApplications,
      totalUsers,
      totalCvs,
      newUsers,
      recentApplications,
      recentUsers
    ] = await Promise.all([
      Application.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Search.countDocuments({ estado: "Activa" }),
      Application.countDocuments({ state: { $regex: /pending|enviada|en revisión|preseleccionado/i } }),
      Application.countDocuments({ state: { $regex: /Contratado|hired/i } }),
      Application.countDocuments({ state: { $regex: /Rechazado|rejected|declined/i } }),
      User.countDocuments({ rol: "user" }),
      Cv.countDocuments({ "cvFile.providerId": { $exists: true, $ne: null } }), // Total CVs cargados (con archivo)
      User.countDocuments({ rol: "user", createdAt: { $gte: thirtyDaysAgo } }), // Nuevos usuarios (últimos 30 días)
      Application.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "nombre apellido email")
        .populate("search", "titulo")
        .lean(),
      User.find({ rol: "user" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("nombre apellido email createdAt")
        .lean()
    ]);

    res.json({
      stats: {
        newApplications,
        activeSearches,
        pendingApplications,
        hiredApplications,
        rejectedApplications,
        totalUsers,
        totalCvs,
        newUsers
      },
      recentApplications,
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};