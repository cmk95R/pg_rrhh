import api from "./client";

export const listAreasApi = () => api.get("/areas");
export const getAreaApi = (id) => api.get(`/areas/${id}`);
export const createAreaApi = (payload) => api.post("/areas", payload);
export const updateAreaApi = (id, payload) => api.put(`/areas/${id}`, payload);
export const deleteAreaApi = (id) => api.delete(`/areas/${id}`);