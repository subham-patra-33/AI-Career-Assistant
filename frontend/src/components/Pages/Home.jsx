import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center w-full h-full bg-background px-4">
      <div className="text-center max-w-2xl animate-slide-up">
        <span className="stamp mb-6">Draft → Review → Pass</span>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight mb-4 mt-5">
          Build a resume the ATS
          <br className="hidden sm:block" /> actually reads
        </h1>

        <p className="text-sm sm:text-base md:text-lg muted mb-8 max-w-lg mx-auto">
          Write your draft, let AI sharpen the wording, and check it against
          an ATS scan before you send it out.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate("/db")} className="btn btn-primary px-8 py-3">
            Go to dashboard
          </button>
          <button onClick={() => navigate("/resume")} className="btn btn-secondary px-8 py-3">
            Start a resume
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
