import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute() {
  const auth = useContext(AuthContext);
  if (!auth) return <Navigate to="/auth" replace />;
  if (auth.loading) return null; // Could show a spinner
  return auth.isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
}
