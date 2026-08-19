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
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminChallenges from "./pages/AdminChallenges";
import AdminExams from "./pages/AdminExams";
import AdminSubmissions from "./pages/AdminSubmissions";

function Layout() {
  return (
    <div className="min-h-screen bg-[#07090d]">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-5 md:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/challenges/:slug" element={<ChallengeDetail />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/challenges" element={<AdminChallenges />} />
            <Route path="/admin/exams" element={<AdminExams />} />
            <Route path="/admin/submissions" element={<AdminSubmissions />} />
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