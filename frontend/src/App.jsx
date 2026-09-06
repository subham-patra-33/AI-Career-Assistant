import Navbar from "./components/Pages/Navbar";
import Sidebar from "./components/Sidebar";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import TemplateBuilder from './components/Pages/TemplateBuilder';
import TotalResumes from './components/Pages/TotalResumes';

// Route Structure:
// "/" → Login
// "/home" → Home (landing page)
// "/db" → Dashboard (main hub with clickable cards)
// "/resume" → Resume Editor (edit existing or create new)
// "/create-resume" → Resume Editor (alias for creating new resume)
// "/resumes" → Resumes List (legacy/backup route)
// "/total-resumes" → TotalResumes (dedicated page: shows all resumes, empty state with + button)
// "/ai-suggestions" → AI Suggestions (generate resume content)
// "/templates" → Templates (browse and select templates)
// "/template-builder" → Template Builder (form-based resume builder)
// "/ats" → ATS Checker (upload and analyze resume)
// "/setting" → Settings (user preferences)

function AppRoutes() {
  const location = useLocation();
  return (
    <div className="flex flex-1 overflow-hidden bg-background h-full">
      <div className="w-16 md:w-64 shrink-0 h-full overflow-y-auto">
        <Sidebar />
      </div>

      <div className="flex-1 h-full overflow-hidden flex items-center justify-center p-4">
        <div key={location.pathname} className="route-wrapper page-inner animate-fade w-full max-w-7xl h-full max-h-full" role="group" aria-live="polite">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<Home />} />
            <Route path="/db" element={<Dashboard />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/create-resume" element={<Resume />} />
            <Route path="/resumes" element={<Resumes />} />
            <Route path="/total-resumes" element={<TotalResumes />} />
            <Route path="/ai-suggestions" element={<AiSuggestions />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/template-builder" element={<TemplateBuilder />} />
            <Route path="/ats" element={<ATS />} />
            <Route path="/setting" element={<Settings />} />
            <Route path="/template" element={<Template />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
        <Navbar />
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
export default App;