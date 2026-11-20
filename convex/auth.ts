import { setupGoogle } from "@convex-dev/auth/methods/google/server";
import { setupConvexAuth } from "@convex-dev/auth/server";
import { components, internal } from "./_generated/api";

const DEFAULT_ORIGINS = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3100"];

const allowedRedirectOrigins = (process.env.AUTH_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const auth = setupConvexAuth({ component: components.auth });

export const { signOut, refreshSession, isAuthenticated } = auth;

export const { startSignInWithGoogle, completeSignInWithGoogle } = setupGoogle(auth, {
  component: components.authGoogle,
  allowedRedirectOrigins: allowedRedirectOrigins.length ? allowedRedirectOrigins : DEFAULT_ORIGINS,
}).attachUserCallbacks({ createUser: internal.users.createUserGoogle });
