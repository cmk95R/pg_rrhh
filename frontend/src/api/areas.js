import api from "./client";

export const listAreasApi = () => api.get("/areas");
export const createAreaApi = (data) => api.post("/areas", data);
export const deleteAreaApi = (id) => api.delete(`/areas/${id}`);