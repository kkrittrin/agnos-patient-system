import { nanoid } from "nanoid";

const STORAGE_KEY = "agnos_patient_session_id";

export function getOrCreatePatientId() {
  if (typeof window === "undefined") return null;
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = nanoid(10);
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
