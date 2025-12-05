import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Courses from "./pages/Courses";
import Batches from "./pages/Batches";
import Enrollments from "./pages/Enrollments";
import Attendance from "./pages/Attendance";
import Receipts from "./pages/Receipts";
import Certificates from "./pages/Certificates";
import Staff from "./pages/Staff";
import Branches from "./pages/Branches";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/batches" element={<Batches />} />
              <Route path="/enrollments" element={<Enrollments />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/receipts" element={<Receipts />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
