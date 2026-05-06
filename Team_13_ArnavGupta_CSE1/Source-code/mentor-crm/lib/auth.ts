"use client";

import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "mentor_crm_token";
const NAME_KEY  = "mentor_crm_name";
const EMAIL_KEY = "mentor_crm_email";

export type Session = {
  uid: string;
  email: string;
  name: string;
  role?: string;
  exp?: number;
};

export function setSession(token: string, name: string, email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(NAME_KEY, name);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Decode the JWT and combine with cached name/email. Returns null if no
// token is present or if the token is malformed/expired.
export function getSession(): Session | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<{ uid?: string; email?: string; exp?: number; role?: string }>(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      clearSession();
      return null;
    }
    return {
      uid:   decoded.uid   ?? "",
      email: decoded.email ?? localStorage.getItem(EMAIL_KEY) ?? "",
      name:  localStorage.getItem(NAME_KEY) ?? decoded.email ?? "Mentor",
      role:  decoded.role,
      exp:   decoded.exp,
    };
  } catch {
    clearSession();
    return null;
  }
}
