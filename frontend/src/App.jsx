import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ============================================================
// LAYOUT COMPONENTS
// ============================================================

import Navbar from "./components/Pages/Navbar";
import Sidebar from "./components/Sidebar";

// ============================================================
// MAIN PAGES
// ============================================================

import Home from "./components/Pages/Home";
import Dashboard from "./components/Pages/Dashboard";

// ============================================================
// RESUME PAGES
// ============================================================

import Resume from "./components/Pages/Resume";
import Resumes from "./components/Pages/Resumes";
import TotalResumes from "./components/Pages/TotalResumes";
import Templates from "./components/Pages/Templates";
import Template from "./components/Pages/Template";
import TemplateBuilder from "./components/Pages/TemplateBuilder";
import AiSuggestions from "./components/Pages/AiSuggestions";

// ============================================================
// CAREER ANALYSIS & TOOLS
// ============================================================

import SkillGapAnalysis from "./components/Pages/SkillGapAnalysis";
import CareerRecommendations from "./components/Pages/CareerRecommendations";
import RecommendedSkills from "./components/Pages/RecommendedSkills";
import JobMatch from "./components/Pages/JobMatch";
import ATS from "./components/Pages/ATS";

// ============================================================
// JOBS & INTERVIEW
// ============================================================

import JobRecommendations from "./components/Pages/JobRecommendations";
import SavedJobs from "./components/Pages/SavedJobs";
import AiMockInterview from "./components/Pages/AiMockInterview";
import CareerProgress from "./components/Pages/CareerProgress";

// ============================================================
// SETTINGS, ADMIN & AUTH
// ============================================================

import Settings from "./components/Pages/Settings";
<<<<<<< HEAD

=======
import Admin from "./components/Pages/Admin";
>>>>>>> 1c15bfd (Update GauravGo gaming website)
import Login from "./components/Pages/Login";
import Register from "./components/Pages/Register";

// ============================================================
<<<<<<< HEAD
// HOME LAYOUT
// ============================================================
<<<<<<< HEAD

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
=======
//
// DESKTOP
// ------------------------------------------------------------
// Sidebar:
//   fixed
//   width = 256px
//
// Main area:
//   width = 100%
//   padding-left = 256px
//
// MOBILE / TABLET
// ------------------------------------------------------------
// Sidebar becomes an overlay/drawer.
//
// Main area:
//   width = 100%
//   padding-left = 0
//
// IMPORTANT:
// Do NOT use md:ml-64 here.
// Use md:pl-64 so the content width remains 100%.
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
=======
// SAAS APP LAYOUT (SIDEBAR + TOP NAVBAR + MAIN CONTENT)
>>>>>>> 1c15bfd (Update GauravGo gaming website)
// ============================================================

function AppLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      {/* SIDEBAR */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* MAIN CONTAINER */}
      <div className="relative min-h-screen w-full overflow-x-hidden pl-0 md:pl-[var(--sidebar-width,256px)] transition-[padding-left] duration-200">
        {/* PAGE-AWARE TOP NAVBAR */}
        <Navbar
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* PAGE CONTENT */}
        <main className="relative min-h-screen w-full overflow-x-hidden pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}

// Backward-compatible alias
function HomeLayout() {
  return (
    <AppLayout>
      <Home />
    </AppLayout>
  );
}

// Fullscreen layout for Login/Register
function NormalLayout({ children }) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <main className="min-h-screen w-full max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

// ============================================================
// APPLICATION ROUTES
// ============================================================

function AppRoutes() {
  return (
    <Routes>
      {/* AUTH */}
      <Route
        path="/"
        element={
          <NormalLayout>
            <Login />
          </NormalLayout>
        }
      />
      <Route
        path="/register"
        element={
          <NormalLayout>
            <Register />
          </NormalLayout>
        }
      />

      {/* HOME (AI CAREER ASSISTANT LANDING) */}
      <Route
        path="/home"
        element={
          <AppLayout>
            <Home />
          </AppLayout>
        }
      />

      {/* DASHBOARD / COMMAND CENTER */}
      <Route
        path="/db"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />

      {/* RESUME */}
      <Route
        path="/resume"
        element={
          <AppLayout>
            <Resume />
          </AppLayout>
        }
      />
      <Route
        path="/create-resume"
        element={
          <AppLayout>
            <Resume />
          </AppLayout>
        }
      />
      <Route
        path="/resumes"
        element={
          <AppLayout>
            <Resumes />
          </AppLayout>
        }
      />
      <Route
        path="/my-resumes"
        element={
          <AppLayout>
            <Resumes />
          </AppLayout>
        }
      />
      <Route
        path="/total-resumes"
        element={
          <AppLayout>
            <TotalResumes />
          </AppLayout>
        }
      />
      <Route
        path="/templates"
        element={
          <AppLayout>
            <Templates />
          </AppLayout>
        }
      />
      <Route
        path="/resume-templates"
        element={
          <AppLayout>
            <Templates />
          </AppLayout>
        }
      />
      <Route
        path="/template"
        element={
          <AppLayout>
            <Template />
          </AppLayout>
        }
      />
      <Route
        path="/template-builder"
        element={
          <AppLayout>
            <TemplateBuilder />
          </AppLayout>
        }
      />
      <Route
        path="/ai-suggestions"
        element={
          <AppLayout>
            <AiSuggestions />
          </AppLayout>
        }
      />
      <Route
        path="/resume-suggestions"
        element={
          <AppLayout>
            <AiSuggestions />
          </AppLayout>
        }
      />

      {/* CAREER ANALYSIS */}
      <Route
        path="/skill-gap"
        element={
          <AppLayout>
            <SkillGapAnalysis />
          </AppLayout>
        }
      />
      <Route
        path="/skill-gap-analysis"
        element={
          <AppLayout>
            <SkillGapAnalysis />
          </AppLayout>
        }
      />
      <Route
        path="/career-recommendations"
        element={
          <AppLayout>
            <CareerRecommendations />
          </AppLayout>
        }
      />
      <Route
        path="/career-recommendation"
        element={
          <AppLayout>
            <CareerRecommendations />
          </AppLayout>
        }
      />
      <Route
        path="/recommended-skills"
        element={
          <AppLayout>
            <RecommendedSkills />
          </AppLayout>
        }
      />
      <Route
        path="/recommended-skill"
        element={
          <AppLayout>
            <RecommendedSkills />
          </AppLayout>
        }
      />

      {/* JOB TOOLS */}
      <Route
        path="/ats"
        element={
          <AppLayout>
            <ATS />
          </AppLayout>
        }
      />
      <Route
        path="/ats-checker"
        element={
          <AppLayout>
            <ATS />
          </AppLayout>
        }
      />
      <Route
        path="/job-match"
        element={
          <AppLayout>
            <JobMatch />
          </AppLayout>
        }
      />
      <Route
        path="/ai-job-match"
        element={
          <AppLayout>
            <JobMatch />
          </AppLayout>
        }
      />

      {/* JOBS */}
      <Route
        path="/jobs"
        element={
          <AppLayout>
            <JobRecommendations />
          </AppLayout>
        }
      />
      <Route
        path="/job-recommendations"
        element={
          <AppLayout>
            <JobRecommendations />
          </AppLayout>
        }
      />
      <Route
        path="/job-recommendation"
        element={
          <AppLayout>
            <JobRecommendations />
          </AppLayout>
        }
      />
      <Route
        path="/saved-jobs"
        element={
          <AppLayout>
            <SavedJobs />
          </AppLayout>
        }
      />
      <Route
        path="/saved-job"
        element={
          <AppLayout>
            <SavedJobs />
          </AppLayout>
        }
      />

      {/* INTERVIEW */}
      <Route
        path="/mock-interview"
        element={
          <AppLayout>
            <AiMockInterview />
          </AppLayout>
        }
      />
      <Route
        path="/ai-mock-interview"
        element={
          <AppLayout>
            <AiMockInterview />
          </AppLayout>
        }
      />
      <Route
        path="/interview"
        element={
          <AppLayout>
            <AiMockInterview />
          </AppLayout>
        }
      />

      {/* CAREER PROGRESS */}
      <Route
        path="/career-progress"
        element={
          <AppLayout>
            <CareerProgress />
          </AppLayout>
        }
      />
      <Route
        path="/progress"
        element={
          <AppLayout>
            <CareerProgress />
          </AppLayout>
        }
      />

      {/* SETTINGS & ADMIN */}
      <Route
        path="/setting"
        element={
          <AppLayout>
            <Settings />
          </AppLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <AppLayout>
            <Settings />
          </AppLayout>
        }
      />
      <Route
        path="/admin"
        element={
          <AppLayout>
            <Admin />
          </AppLayout>
        }
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

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}