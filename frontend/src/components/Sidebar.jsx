import { Home, FileText, Settings, CheckCircle } from "lucide-react";
import { MdDashboard } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Home", path: "/home", icon: Home },
  { label: "Dashboard", path: "/db", icon: MdDashboard },
  { label: "Create Resume", path: "/resume", icon: FileText },
  { label: "ATS Checker", path: "/ats", icon: CheckCircle },
  { label: "Settings", path: "/setting", icon: Settings },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="fixed top-0 left-0 h-screen w-20 md:w-64 p-3 md:p-4 bg-sidebar text-sidebar-foreground overflow-hidden border-r border-sidebar-border"
      aria-label="Primary"
    >
      <div className="flex flex-col items-center md:items-start gap-6 h-full">
        <div className="flex items-center gap-3 md:pl-2 pt-2">
          <div className="h-10 w-10 rounded-md border-2 border-foreground flex items-center justify-center font-display font-bold text-sm shrink-0">
            A/R
          </div>
          <div className="hidden md:block">
            <div className="font-display font-semibold text-sm tracking-tight">AI Resume</div>
            <div className="text-xs muted">Editor's desk</div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-1.5">
          {LINKS.map(({ label, path, icon: Icon }, i) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                title={label}
                onClick={() => navigate(path)}
                aria-current={isActive ? "page" : undefined}
                className={cn("nav-btn animate-pop", isActive && "active")}
                style={{ transitionDelay: `${40 + i * 20}ms` }}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden md:inline">{label}</span>
                {isActive && (
                  <span className="hidden md:inline ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
