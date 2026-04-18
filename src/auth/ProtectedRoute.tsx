import { Center, Loader } from "@mantine/core";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requireGroups?: string[];
}

export function ProtectedRoute({ children, requireGroups = [] }: ProtectedRouteProps) {
  const { user, loading, hasGroup } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const missing = requireGroups.filter((g) => !hasGroup(g));
  if (missing.length > 0) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
