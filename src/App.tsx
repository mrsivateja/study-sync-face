import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { DashboardLayout } from "./components/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import ManualAttendance from "./pages/ManualAttendance";
import FaceAttendance from "./pages/FaceAttendance";
import Records from "./pages/Records";
import Holidays from "./pages/Holidays";
import AdminManagement from "./pages/AdminManagement";
import StudentAttendance from "./pages/StudentAttendance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/students"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <Students />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/manual-attendance"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <ManualAttendance />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/face-attendance"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <FaceAttendance />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/records"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <Records />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/holidays"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <Holidays />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/admin-management"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <AdminManagement />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/my-attendance"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <StudentAttendance />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
