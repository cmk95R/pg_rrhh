import api from "./client";

// --- Rutas de Usuario ---

/**
 * Actualiza el perfil del usuario logueado.
 * Calls PATCH /api/users/me
 */
export const editUserApi = (data) => api.patch("/users/me", data);


// --- Rutas de Administrador ---

/**
 * 🔑 ADMIN: Lista todos los usuarios (versión básica).
 * Calls GET /api/admin/users
 */
export const listUsersApi = (params = {}) => api.get("/admin/users", { params });

/**
 * 🔑 ADMIN: Obtiene la lista paginada y filtrable de usuarios con datos de CV.
 * Calls GET /api/admin/users/with-cv
 * @param {object} params - Objeto con los parámetros de paginación y filtro.
 */
export const listUsersWithCvApi = (params) => api.get("/admin/users/with-cv", { params });

/**
 * 🔑 ADMIN: Asigna el rol de admin a un usuario.
 * Calls PATCH /api/admin/users/:id/make-admin
 */
export const makeAdminApi = (id) => api.patch(`/admin/users/${id}/make-admin`);

/**
 * 🔑 ADMIN: Revoca el rol de admin a un usuario (lo vuelve 'user').
 * Calls PATCH /api/admin/users/:id/revoke-admin
 */
export const revokeAdminApi = (id) => api.patch(`/admin/users/${id}/revoke-admin`);

/**
 * 🔑 ADMIN: Cambia el estado de un usuario (activo/inactivo).
 * Calls PATCH /api/admin/users/:id/status
 * @param {string} userId El ID del usuario.
 * @param {'activo' | 'inactivo'} estado El nuevo estado.
 */
export const adminSetUserStatusApi = (userId, estado) => api.patch(`/admin/users/${userId}/status`, { estado });

/**
 * 🔑 ADMIN: Cambia el rol de un usuario.
 * Calls PATCH /api/admin/users/:id/role
 * @param {string} userId El ID del usuario.
 * @param {string} rol El nuevo rol ('user', 'admin', 'rrhh').
 */
export const adminSetUserRoleApi = (userId, rol) => api.patch(`/admin/users/${userId}/role`, { rol });

/**
 * 🔑 ADMIN: Obtiene la URL de descarga del CV para un usuario específico.
 * Calls GET /api/admin/users/:userId/cv/download
 * @param {string} userId - El ID del usuario.
 */
export const getUserCvDownloadUrlApi = (userId) => api.get(`/admin/users/${userId}/cv/download`);

/**
 * 🔑 ADMIN: Reset de password a usuario 
 * Calls POST /admin/users/:id/reset-password
 */
export const resetUserPasswordApi = (userId, newPassword) => api.post(`/admin/users/${userId}/reset-password`, { newPassword });

/**
 * 🔑 ADMIN: Actualizar datos básicos de un usuario.
 * Calls PATCH /admin/users/:id
 */
export const adminUpdateUserApi = (userId, data) => api.patch(`/admin/users/${userId}`, data);

/**
 * 🔑 ADMIN: Eliminar un usuario.
 * Calls DELETE /admin/users/:id
 */
export const deleteUserApi = (userId) => api.delete(`/admin/users/${userId}`);
