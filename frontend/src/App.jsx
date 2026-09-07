import Navbar from "./components/Pages/Navbar";
import Sidebar from "./components/Sidebar";
import JobMatch from "./components/Pages/JobMatch";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Dashboard from "./components/Pages/Dashboard";
import Home from "./components/Pages/Home";
import Resume from "./components/Pages/Resume";
import Settings from "./components/Pages/Settings";
import Template from "./components/Pages/Template";
import Templates from "./components/Pages/Templates";
import Login from "./components/Pages/Login";
import Register from "./components/Pages/Register";
import Resumes from "./components/Pages/Resumes";
import AiSuggestions from "./components/Pages/AiSuggestions";
import ATS from "./components/Pages/ATS";
import TemplateBuilder from "./components/Pages/TemplateBuilder";
import TotalResumes from "./components/Pages/TotalResumes";

/*
|--------------------------------------------------------------------------
| NEW
|--------------------------------------------------------------------------
| Create this file:
|
| frontend/src/components/Pages/JobMatch.jsx
|
| Then this import will work.
*/


function AppRoutes() {
  const location = useLocation();

  return (
    <div
      className="
        flex
        flex-1
        min-h-0

        w-full

        overflow-hidden

        bg-background
      "
    >

      {/* =========================================================
          SIDEBAR
      ========================================================= */}

      <Sidebar />


      {/* =========================================================
          MAIN APPLICATION AREA
      ========================================================= */}

      <main
        className="
          relative

          flex
          min-w-0
          min-h-0
          flex-1
          flex-col

          md:ml-64

          pt-[76px]

          overflow-hidden
        "
      >

        {/* =======================================================
            PAGE CONTENT
        ======================================================= */}

        <div
          className="
            flex-1
            min-h-0

            w-full

            overflow-y-auto
            overflow-x-hidden

            px-4
            py-5

            sm:px-6
            sm:py-6

            lg:px-8
            lg:py-7
          "
        >

          <div
            key={location.pathname}
            className="
              route-wrapper
              page-inner
              animate-fade

              mx-auto

              w-full
              max-w-7xl
            "
            role="group"
            aria-live="polite"
          >

            <Routes
              location={location}
              key={location.pathname}
            >

              {/* =================================================
                  PUBLIC ROUTES
              ================================================= */}

              <Route
                path="/"
                element={<Login />}
              />

              <Route
                path="/register"
                element={<Register />}
              />


              {/* =================================================
                  MAIN APPLICATION
              ================================================= */}

              <Route
                path="/home"
                element={<Home />}
              />

              <Route
                path="/db"
                element={<Dashboard />}
              />


              {/* =================================================
                  RESUME
              ================================================= */}

              <Route
                path="/resume"
                element={<Resume />}
              />

              <Route
                path="/create-resume"
                element={<Resume />}
              />

              <Route
                path="/resumes"
                element={<Resumes />}
              />

              <Route
                path="/total-resumes"
                element={<TotalResumes />}
              />


              {/* =================================================
                  AI FEATURES
              ================================================= */}

              <Route
                path="/ai-suggestions"
                element={<AiSuggestions />}
              />

              <Route
                path="/job-match"
                element={<JobMatch />}
              />


              {/* =================================================
                  ATS
              ================================================= */}

              <Route
                path="/ats"
                element={<ATS />}
              />


              {/* =================================================
                  TEMPLATES
              ================================================= */}

              <Route
                path="/templates"
                element={<Templates />}
              />

              <Route
                path="/template-builder"
                element={<TemplateBuilder />}
              />

              <Route
                path="/template"
                element={<Template />}
              />


              {/* =================================================
                  SETTINGS
              ================================================= */}

              <Route
                path="/setting"
                element={<Settings />}
              />

            </Routes>

          </div>

        </div>

      </main>

    </div>
  );
}


function App() {
  return (
    <BrowserRouter>

      <div
        className="
          flex
          h-screen
          w-screen
          flex-col

          overflow-hidden

          bg-background

          text-foreground
        "
      >

        {/* Fixed top navigation */}

        <Navbar />


        {/* Sidebar + page area */}

        <AppRoutes />

      </div>

    </BrowserRouter>
  );
}


export default App;