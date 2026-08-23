import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import Exams from "./pages/Exams";
import ExamPassword from "./pages/ExamPassword";
import ExamTake from "./pages/ExamTake";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminChallenges from "./pages/AdminChallenges";
import AdminExams from "./pages/AdminExams";
import AdminSubmissions from "./pages/AdminSubmissions";
import AdminViolations from "./pages/AdminViolations";
import Leaderboard from "./pages/Leaderboard";

function Layout() {
  return (
    <div className="min-h-screen bg-[var(--color-vellum)]">
      <div className="sticky top-0 z-20">
        <Navbar />
      </div>

      <div className="flex">
        <div className="hidden lg:block sticky top-16 self-start h-[calc(100vh-64px)] overflow-y-auto">
          <Sidebar />
        </div>

        <main className="flex-1 p-5 md:p-8 min-w-0">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/challenges/:slug" element={<ChallengeDetail />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/exams/:id" element={<ExamPassword />} />
            <Route path="/exams/:id/take" element={<ExamTake />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/challenges" element={<AdminChallenges />} />
            <Route path="/admin/exams" element={<AdminExams />} />
            <Route path="/admin/submissions" element={<AdminSubmissions />} />
            <Route path="/admin/violations" element={<AdminViolations />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<Layout />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}