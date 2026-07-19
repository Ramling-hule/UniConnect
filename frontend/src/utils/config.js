/**
 * Application-wide configuration variables.
 * 
 * SOLID applied:
 *  - Config abstraction: we depend on an env var instead of a hardcoded URL.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";
