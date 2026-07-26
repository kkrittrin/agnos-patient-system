import { nanoid } from "nanoid";

const STORAGE_KEY = "agnos_patient_session_id";

// A patient keeps the same id across a page refresh (so staff don't
// see them as a brand-new record every time they reload), but a new
// browser/tab/incognito session gets a fresh id.
export function getOrCreatePatientId() {
  if (typeof window === "undefined") return null;
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = nanoid(10);
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
