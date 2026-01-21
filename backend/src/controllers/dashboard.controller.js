import Application from "../models/Application.js";
import Search from "../models/Search.js";
import User from "../models/User.js";
import Cv from "../models/Cv.js";

export const getDashboardData = async (req, res) => {
    try {
        // Ejecuta todas las consultas en paralelo para máxima eficiencia
        const [
            newApplicationsCount,
            activeSearchesCount,
            totalUsersCount,
            pendingApplicationsCount,
            hiredApplicationsCount,
            rejectedApplicationsCount,
            totalCvsCount,
            newUsersCount,
            recentApplications,
            recentUsers
        ] = await Promise.all([
            // Cuenta postulaciones de los últimos 7 días
            Application.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
            // Cuenta búsquedas con estado "Activa"
            Search.countDocuments({ estado: "Activa" }),
            // Cuenta todos los usuarios con rol 'user'
            User.countDocuments({ rol: "user" }),
            // Cuenta postulaciones con estado pendiente
            Application.countDocuments({ state: { $regex: /pending|enviada|en revisión|preseleccionado/i } }),
            // Cuenta postulaciones contratadas
            Application.countDocuments({ state: { $regex: /Contratado|hired/i } }),
            // Cuenta postulaciones rechazadas
            Application.countDocuments({ state: { $regex: /Rechazado|rejected|declined/i } }),
            // Cuenta total de CVs
            Cv.countDocuments({}),
            // Cuenta nuevos usuarios (últimos 30 días)
            User.countDocuments({ rol: "user", createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
            // Obtiene las 5 últimas postulaciones
            Application.find().sort({ createdAt: -1 }).limit(5).populate("user", "nombre apellido").populate("search", "titulo"),
            // Obtiene los 5 últimos usuarios
            User.find({ rol: "user" }).sort({ createdAt: -1 }).limit(5)
        ]);

        const responseData = {
            stats: {
                newApplications: newApplicationsCount,
                activeSearches: activeSearchesCount,
                totalUsers: totalUsersCount,
                pendingApplications: pendingApplicationsCount,
                hiredApplications: hiredApplicationsCount,
                rejectedApplications: rejectedApplicationsCount,
                totalCvs: totalCvsCount,
                newUsers: newUsersCount,
            },
            recentApplications: recentApplications,
            recentUsers: recentUsers || []
        };

        res.json(responseData);

    } catch (error) {
        res.status(500).json({ message: "Error al cargar los datos del dashboard." });
    }
};