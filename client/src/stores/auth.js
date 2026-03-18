import { writable } from "svelte/store";
const stored = typeof window !== "undefined" ? localStorage.getItem("token") : null;
export const token = writable(stored);
export function login(newToken) {
  localStorage.setItem("token", newToken);
  token.set(newToken);
}
export function logout() {
  localStorage.removeItem("token");
  token.set(null);
}
