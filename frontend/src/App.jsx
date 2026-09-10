import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ============================================================
// LAYOUT
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

// ============================================================
// RESUME AI TOOLS
// ============================================================

import AiSuggestions from "./components/Pages/AiSuggestions";

// ============================================================
// SIX CAREER ASSISTANT PAGES
// ============================================================

import SkillGapAnalysis from "./components/Pages/SkillGapAnalysis";
import CareerRecommendations from "./components/Pages/CareerRecommendations";
import RecommendedSkills from "./components/Pages/RecommendedSkills";
import JobRecommendations from "./components/Pages/JobRecommendations";
import SavedJobs from "./components/Pages/SavedJobs";
import AiMockInterview from "./components/Pages/AiMockInterview";
import CareerProgress from "./components/Pages/CareerProgress";

// ============================================================
// OTHER TOOLS
// ============================================================

import JobMatch from "./components/Pages/JobMatch";
import ATS from "./components/Pages/ATS";

// ============================================================
// TEMPLATES
// ============================================================

import Templates from "./components/Pages/Templates";
import Template from "./components/Pages/Template";
import TemplateBuilder from "./components/Pages/TemplateBuilder";

// ============================================================
// SETTINGS
// ============================================================

import Settings from "./components/Pages/Settings";

// ============================================================
// AUTH
// ============================================================

import Login from "./components/Pages/Login";
import Register from "./components/Pages/Register";


// ============================================================
// HOME LAYOUT
// ============================================================
// IMPORTANT:
// Sidebar + Navbar are ONLY shown on /home.
// All other pages are completely separate/full-screen pages.
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

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

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


      {/* ======================================================
          HOME RIGHT SIDE
      ====================================================== */}

      <div
        className="
          min-h-screen
          w-full
          pl-64
        "
      >

        {/* ====================================================
            NAVBAR
        ==================================================== */}

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


        {/* ====================================================
            HOME CONTENT
        ==================================================== */}

        <main
          className="
            min-h-screen
            w-full
            pt-[76px]
          "
        >
          <Home />
        </main>

      </div>

    </div>
  );
}


// ============================================================
// NORMAL PAGE WRAPPER
// ============================================================
// No Sidebar.
// No Navbar.
// ============================================================

function NormalLayout({ children }) {
  return (
    <div
      className="
        min-h-screen
        w-full
        bg-background
        text-foreground
      "
    >
      <main className="min-h-screen w-full">
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

      {/* ======================================================
          LOGIN
      ====================================================== */}

      <Route
        path="/"
        element={<Login />}
      />


      {/* ======================================================
          REGISTER
      ====================================================== */}

      <Route
        path="/register"
        element={<Register />}
      />


      {/* ======================================================
          HOME
          Sidebar + Navbar ONLY HERE
      ====================================================== */}

      <Route
        path="/home"
        element={<HomeLayout />}
      />


      {/* ======================================================
          DASHBOARD
          No Sidebar / Navbar
      ====================================================== */}

      <Route
        path="/db"
        element={
          <NormalLayout>
            <Dashboard />
          </NormalLayout>
        }
      />

      <Route
        path="/dashboard"
        element={
          <NormalLayout>
            <Dashboard />
          </NormalLayout>
        }
      />


      {/* ======================================================
          RESUME BUILDER
      ====================================================== */}

      <Route
        path="/resume"
        element={
          <NormalLayout>
            <Resume />
          </NormalLayout>
        }
      />

      <Route
        path="/create-resume"
        element={
          <NormalLayout>
            <Resume />
          </NormalLayout>
        }
      />


      {/* ======================================================
          MY RESUMES
      ====================================================== */}

      <Route
        path="/resumes"
        element={
          <NormalLayout>
            <Resumes />
          </NormalLayout>
        }
      />

      <Route
        path="/my-resumes"
        element={
          <NormalLayout>
            <Resumes />
          </NormalLayout>
        }
      />

      <Route
        path="/total-resumes"
        element={
          <NormalLayout>
            <TotalResumes />
          </NormalLayout>
        }
      />


      {/* ======================================================
          RESUME TEMPLATES
      ====================================================== */}

      <Route
        path="/templates"
        element={
          <NormalLayout>
            <Templates />
          </NormalLayout>
        }
      />

      <Route
        path="/resume-templates"
        element={
          <NormalLayout>
            <Templates />
          </NormalLayout>
        }
      />

      <Route
        path="/template"
        element={
          <NormalLayout>
            <Template />
          </NormalLayout>
        }
      />

      <Route
        path="/template-builder"
        element={
          <NormalLayout>
            <TemplateBuilder />
          </NormalLayout>
        }
      />


      {/* ======================================================
          AI RESUME SUGGESTIONS
      ====================================================== */}

      <Route
        path="/ai-suggestions"
        element={
          <NormalLayout>
            <AiSuggestions />
          </NormalLayout>
        }
      />

      <Route
        path="/resume-suggestions"
        element={
          <NormalLayout>
            <AiSuggestions />
          </NormalLayout>
        }
      />


      {/* ======================================================
          AI JOB MATCH
      ====================================================== */}

      <Route
        path="/job-match"
        element={
          <NormalLayout>
            <JobMatch />
          </NormalLayout>
        }
      />

      <Route
        path="/ai-job-match"
        element={
          <NormalLayout>
            <JobMatch />
          </NormalLayout>
        }
      />


      {/* ======================================================
          1. SKILL GAP ANALYSIS
      ====================================================== */}

      <Route
        path="/skill-gap"
        element={
          <NormalLayout>
            <SkillGapAnalysis />
          </NormalLayout>
        }
      />

      <Route
        path="/skill-gap-analysis"
        element={
          <NormalLayout>
            <SkillGapAnalysis />
          </NormalLayout>
        }
      />


      {/* ======================================================
          2. CAREER RECOMMENDATIONS
      ====================================================== */}

      <Route
        path="/career-recommendations"
        element={
          <NormalLayout>
            <CareerRecommendations />
          </NormalLayout>
        }
      />

      <Route
        path="/career-recommendation"
        element={
          <NormalLayout>
            <CareerRecommendations />
          </NormalLayout>
        }
      />


      {/* ======================================================
          ATS CHECKER
      ====================================================== */}

      <Route
        path="/ats"
        element={
          <NormalLayout>
            <ATS />
          </NormalLayout>
        }
      />

      <Route
        path="/ats-checker"
        element={
          <NormalLayout>
            <ATS />
          </NormalLayout>
        }
      />


      {/* ======================================================
          RECOMMENDED SKILLS
      ====================================================== */}
      {/* IMPORTANT:
          This is now a completely separate page from
          SkillGapAnalysis.
      ====================================================== */}

      <Route
        path="/recommended-skills"
        element={
          <NormalLayout>
            <RecommendedSkills />
          </NormalLayout>
        }
      />

      <Route
        path="/recommended-skill"
        element={
          <NormalLayout>
            <RecommendedSkills />
          </NormalLayout>
        }
      />


      {/* ======================================================
          3. JOB RECOMMENDATIONS
      ====================================================== */}

      <Route
        path="/job-recommendations"
        element={
          <NormalLayout>
            <JobRecommendations />
          </NormalLayout>
        }
      />

      <Route
        path="/job-recommendation"
        element={
          <NormalLayout>
            <JobRecommendations />
          </NormalLayout>
        }
      />

      <Route
        path="/jobs"
        element={
          <NormalLayout>
            <JobRecommendations />
          </NormalLayout>
        }
      />


      {/* ======================================================
          4. SAVED JOBS
      ====================================================== */}

      <Route
        path="/saved-jobs"
        element={
          <NormalLayout>
            <SavedJobs />
          </NormalLayout>
        }
      />

      <Route
        path="/saved-job"
        element={
          <NormalLayout>
            <SavedJobs />
          </NormalLayout>
        }
      />


      {/* ======================================================
          5. AI MOCK INTERVIEW
      ====================================================== */}

      <Route
        path="/ai-mock-interview"
        element={
          <NormalLayout>
            <AiMockInterview />
          </NormalLayout>
        }
      />

      <Route
        path="/mock-interview"
        element={
          <NormalLayout>
            <AiMockInterview />
          </NormalLayout>
        }
      />

      <Route
        path="/interview"
        element={
          <NormalLayout>
            <AiMockInterview />
          </NormalLayout>
        }
      />


      {/* ======================================================
          6. CAREER PROGRESS
      ====================================================== */}

      <Route
        path="/career-progress"
        element={
          <NormalLayout>
            <CareerProgress />
          </NormalLayout>
        }
      />

      <Route
        path="/progress"
        element={
          <NormalLayout>
            <CareerProgress />
          </NormalLayout>
        }
      />


      {/* ======================================================
          SETTINGS
      ====================================================== */}

      <Route
        path="/setting"
        element={
          <NormalLayout>
            <Settings />
          </NormalLayout>
        }
      />

      <Route
        path="/settings"
        element={
          <NormalLayout>
            <Settings />
          </NormalLayout>
        }
      />


      {/* ======================================================
          FALLBACK
      ====================================================== */}

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
// APP
// ============================================================

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}