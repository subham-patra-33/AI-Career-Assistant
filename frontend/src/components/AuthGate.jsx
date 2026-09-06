import { useNavigate } from 'react-router-dom';

// Inline banner shown in place of a protected action (generate, upload, save)
// when the visitor isn't logged in. The page itself stays fully visible/browsable —
// only the action is replaced with this prompt.
export default function AuthGate({ action = 'do this' }) {
  const navigate = useNavigate();
  return (
    <div className="card p-4 border-2 border-dashed border-gold/50 bg-gold/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <span className="stamp">Sign in required</span>
        <p className="mt-2 text-sm">Create a free account to {action}.</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button className="btn btn-secondary" onClick={() => navigate('/register')}>
          Register
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Log in
        </button>
      </div>
    </div>
  );
}
