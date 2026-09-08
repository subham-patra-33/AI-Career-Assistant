import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Pages/Navbar";
import Sidebar from "./components/Sidebar";

import Home from "./components/Pages/Home";
import Dashboard from "./components/Pages/Dashboard";
import Resume from "./components/Pages/Resume";
import Resumes from "./components/Pages/Resumes";
import TotalResumes from "./components/Pages/TotalResumes";
import AiSuggestions from "./components/Pages/AiSuggestions";
import JobMatch from "./components/Pages/JobMatch";
import ATS from "./components/Pages/ATS";
import Templates from "./components/Pages/Templates";
import Template from "./components/Pages/Template";
import TemplateBuilder from "./components/Pages/TemplateBuilder";
import Settings from "./components/Pages/Settings";

import Login from "./components/Pages/Login";
import Register from "./components/Pages/Register";


// ============================================================
// ROUTES
// ============================================================

function AppRoutes() {
  return (
    <Routes>

      {/* HOME */}
      <Route
        path="/home"
        element={<Home />}
      />


      {/* DASHBOARD */}
      <Route
        path="/db"
        element={<Dashboard />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />


      {/* RESUME */}
      <Route
        path="/resume"
        element={<Resume />}
      />

      <Route
        path="/create-resume"
        element={<Resume />}
      />


      {/* RESUMES */}
      <Route
        path="/resumes"
        element={<Resumes />}
      />

      <Route
        path="/total-resumes"
        element={<TotalResumes />}
      />


      {/* AI SUGGESTIONS */}
      <Route
        path="/ai-suggestions"
        element={<AiSuggestions />}
      />


      {/* JOB MATCH */}
      <Route
        path="/job-match"
        element={<JobMatch />}
      />


      {/* ATS */}
      <Route
        path="/ats"
        element={<ATS />}
      />


      {/* TEMPLATES */}
      <Route
        path="/templates"
        element={<Templates />}
      />

      <Route
        path="/template"
        element={<Template />}
      />

      <Route
        path="/template-builder"
        element={<TemplateBuilder />}
      />


      {/* SETTINGS */}
      <Route
        path="/setting"
        element={<Settings />}
      />

      <Route
        path="/settings"
        element={<Settings />}
      />


      {/* FALLBACK */}
      <Route
        path="*"
        element={
          <Navigate
            to="/home"
            replace
          />
        }
      />

    </Routes>
  );
}


// ============================================================
// HOME LAYOUT
// ============================================================

function HomeLayout() {

  return (
    <div
      className="
        relative
        min-h-screen
        w-full
        bg-background
        text-foreground
      "
    >

      {/* SIDEBAR ONLY ON HOME */}

      <aside
        className="
          fixed
          inset-y-0
          left-0
          z-40
          w-64
        "
      >
        <Sidebar />
      </aside>


      {/* HOME RIGHT SIDE */}

      <div
        className="
          min-h-screen
          w-full
          pl-64
        "
      >

        {/* NAVBAR ONLY ON HOME */}

        <div
          className="
            fixed
            left-64
            right-0
            top-0
            z-30
            h-[76px]
          "
        >
          <Navbar />
        </div>


        {/* HOME CONTENT */}

        <main
          className="
            min-h-screen
            w-full
            pt-[76px]
          "
        >

          <div className="w-full">
            <AppRoutes />
          </div>

        </main>

      </div>

    </div>
  );
}


// ============================================================
// NORMAL PAGE LAYOUT
// ============================================================

function NormalLayout() {

  return (
    <div
      className="
        min-h-screen
        w-full
        bg-background
        text-foreground
      "
    >

      <main
        className="
          min-h-screen
          w-full
        "
      >

        <div
          className="
            min-h-screen
            w-full
            p-0
            m-0
          "
        >
          <AppRoutes />
        </div>

      </main>

    </div>
  );
}


// ============================================================
// APPLICATION CONTENT
// ============================================================

function AppContent() {

  const location = useLocation();

  const pathname = location.pathname;


  // ==========================================================
  // AUTH PAGES
  // ==========================================================

  if (
    pathname === "/" ||
    pathname === "/register"
  ) {

    return (
      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    );
  }


  // ==========================================================
  // HOME
  // ==========================================================

  if (pathname === "/home") {
    return <HomeLayout />;
  }


  // ==========================================================
  // ALL OTHER PAGES
  // ==========================================================

  return <NormalLayout />;
}


// ============================================================
// APP
// ============================================================

export default function App() {

  return (
    <BrowserRouter>

      <AppContent />

    </BrowserRouter>
  );
}