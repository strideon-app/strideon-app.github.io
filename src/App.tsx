import { Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AdminPlanEditorPage } from "@/pages/AdminPlanEditorPage";
import { AdminPlansPage } from "@/pages/AdminPlansPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireGroups={["Admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/plans"
        element={
          <ProtectedRoute requireGroups={["Admin"]}>
            <AdminPlansPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/plans/:planId"
        element={
          <ProtectedRoute requireGroups={["Admin"]}>
            <AdminPlanEditorPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
