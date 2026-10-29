import axios from "axios";

const api = axios.create({
  baseURL: `${(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "")}/api`,
  timeout: 120000, // generation can take a while (and free hosts cold-start)
});

export function errMsg(e) {
  if (e.response?.data?.error) return e.response.data.error;
  if (e.code === "ECONNABORTED") return "The request timed out. Please try again.";
  return "Can't reach the server. Check your connection and try again.";
}

export const createCase = (premise, difficulty) => api.post("/cases", { premise, difficulty }).then((r) => r.data);
export const getCase = (id) => api.get(`/cases/${id}`).then((r) => r.data);
export const discoverClue = (id, clueId) => api.post(`/cases/${id}/clues/${clueId}/discover`).then((r) => r.data);
export const requestHint = (id) => api.post(`/cases/${id}/hints`).then((r) => r.data);
export const accuse = (id, suspectId) => api.post(`/cases/${id}/accuse`, { suspectId }).then((r) => r.data);
export const getResult = (id) => api.get(`/cases/${id}/result`).then((r) => r.data);
