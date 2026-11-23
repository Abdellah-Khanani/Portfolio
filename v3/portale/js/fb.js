// AK Portale — Firebase layer. Same project, accounts and documents as the AK Studio iOS app.
// Every write keeps the app's schema: full field set, `updatedAt` (server time) and `deleted:false`.
// Deletes are tombstones ({deleted:true}) so the app's sync removes the item too.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore, collection, doc, onSnapshot, setDoc, serverTimestamp, Timestamp,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyC4LQB8rsiPqYBIdggehhFKDEgKNdb0Aww",
  authDomain: "ak-studio-64f55.firebaseapp.com",
  projectId: "ak-studio-64f55",
  appId: "1:451668963814:web:51474348fb1020e36f6627",
});
export const auth = getAuth(app);
const db = getFirestore(app);

export const login = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
export const logout = () => signOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
export const onUser = (cb) => onAuthStateChanged(auth, cb);

// Field defaults for collections shared with the iOS app (see AKBase/Sync/SyncModels.swift).
// Dates are JS Date objects (or null); they are stored as Firestore timestamps.
const now = () => new Date();
export const SCHEMA = {
  leads: () => ({ name: "", city: "", sectorRaw: "altro", email: "", statusRaw: "da_inviare", sentAt: null,
    followUp: null, replyAt: null, channel: "mail", note: "", link: "", whatsapp: "" }),
  jobs: () => ({ title: "", client: "", stage: "", progress: 0, next: "", link: "", order: 0, value: 0,
    deadline: null, colorIndex: 0, archived: false }),
  tasks: () => ({ text: "", due: null, done: false, doneAt: null, createdAt: now() }),
  transactions: () => ({ title: "", amount: 0, kindRaw: "uscita", categoryRaw: "altroOut", date: now(), note: "", jobKey: null }),
  debts: () => ({ name: "", amount: 0, due: null, note: "", paid: false, paidAt: null }),
  planned: () => ({ title: "", amount: 0, due: null, categoryRaw: "altroOut", priorityRaw: "importante", saved: 0,
    note: "", link: "", bought: false, boughtAt: null, txKey: null, createdAt: now() }),
  bando: () => ({ phase: "", phaseOrder: 0, order: 0, title: "", detail: "", done: false, doneAt: null }),
  settings: () => ({ savingsTarget: 3000, savingsSaved: 0, savingsDeadline: new Date("2027-04-15"), borsaDate: new Date("2026-11-27") }),
  profiles: () => ({ name: "", photo: "" }),
  // Portal-only collections (the app ignores them):
  business: () => ({}),                 // doc "profile": name, tagline, bio, services[], brand{}, audience, pitch
  ideas: () => ({ title: "", text: "", stage: "nuova", gain: 0, cost: 0, effort: 2, next: "", createdAt: now() }),
  posts: () => ({ title: "", caption: "", platform: "instagram", format: "carosello", date: null, status: "idea", link: "", createdAt: now() }),
  research: () => ({ title: "", body: "", sources: "", createdAt: now() }),
  docs: () => ({ title: "", kind: "link", url: "", body: "", client: "", amount: 0, createdAt: now() }),
  requests: () => ({ text: "", status: "nuova", result: "", createdAt: now(), from: "" }),
  approvals: () => ({ kind: "mail", title: "", body: "", status: "da_approvare", target: "", createdAt: now(), decidedAt: null, note: "" }),
};

const toJS = (v) => (v instanceof Timestamp ? v.toDate() : Array.isArray(v) ? v.map(toJS)
  : v && typeof v === "object" && !(v instanceof Date) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toJS(x)])) : v);

/** Live list of a collection (tombstones filtered). cb(items[]) — each item has `id`. Returns unsubscribe. */
export function watch(col, cb, onError) {
  return onSnapshot(collection(db, col), (snap) => {
    const items = [];
    snap.forEach((d) => { const x = toJS(d.data()); if (!x.deleted) items.push({ id: d.id, ...x }); });
    cb(items);
  }, (e) => { console.error(col, e); onError && onError(e); });
}

/** Live single document. */
export function watchDoc(col, id, cb) {
  return onSnapshot(doc(db, col, id), (d) => cb(d.exists() && !d.data().deleted ? { id: d.id, ...toJS(d.data()) } : null));
}

export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).toUpperCase();

/** Create or update. For new docs pass the full object; for edits pass the changed fields plus `existing`. */
export async function save(col, id, fields, existing) {
  const base = existing ? stripMeta(existing) : (SCHEMA[col] ? SCHEMA[col]() : {});
  const data = { ...base, ...fields, updatedAt: serverTimestamp(), deleted: false };
  delete data.id;
  await setDoc(doc(db, col, id || newId()), data);
  return id;
}

export async function remove(col, id) {
  await setDoc(doc(db, col, id), { deleted: true, updatedAt: serverTimestamp() });
}

function stripMeta(o) { const c = { ...o }; delete c.id; delete c.updatedAt; delete c.deleted; return c; }
