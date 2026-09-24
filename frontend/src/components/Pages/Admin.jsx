import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../BackButton";
import { getToken } from "../../lib/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";


function ActivityBars({ items, emptyMessage }) {
  if (!items?.length) {
    return (
      <div className="py-8 text-center">
        <p className="muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const max = Math.max(
    ...items.map((item) => Number(item.count) || 0),
    1
  );

  return (
    <div className="mt-2">
      <div className="relative h-48">
        {/* Y AXIS */}
        <div className="absolute inset-y-0 left-0 flex flex-col justify-between">
          <span className="muted text-[10px]">{max}</span>
          <span className="muted text-[10px]">{Math.ceil(max / 2)}</span>
          <span className="muted text-[10px]">0</span>
        </div>

        {/* CHART */}
        <div className="absolute inset-0 left-7">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div
              className="border-t"
              style={{ borderColor: "var(--color-border)" }}
            />
            <div
              className="border-t border-dashed"
              style={{ borderColor: "var(--color-border)" }}
            />
            <div
              className="border-t"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>

          <div className="absolute inset-0 flex items-end justify-between gap-2">
            {items.map((item) => {
              const count = Number(item.count) || 0;
              const height = count > 0
                ? Math.max((count / max) * 100, 8)
                : 0;

              return (
                <div
                  key={item._id}
                  className="flex-1 h-full flex flex-col justify-end items-center"
                  title={`${new Date(`${item._id}T00:00:00`).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric", year: "numeric" }
                  )}: ${count}`}
                >
                  <span className="text-[11px] font-bold mb-1">
                    {count}
                  </span>

                  <div
                    className="w-full max-w-10 rounded-t-md transition-all duration-500"
                    style={{
                      height: `${height}%`,
                      minHeight: count > 0 ? "8px" : "0",
                      background:
                        count > 0
                          ? "var(--color-accent)"
                          : "transparent",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DATE LABELS */}
      <div className="ml-7 flex justify-between gap-2 mt-2">
        {items.map((item) => (
          <div key={item._id} className="flex-1 text-center">
            <span className="muted text-[10px]">
              {new Date(`${item._id}T00:00:00`).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric" }
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
<<<<<<< HEAD
const [stats, setStats] = useState({
  totalUsers: 0,
  totalAdmins: 0,
  totalNormalUsers: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  totalResumes: 0,

    analytics: {
    userGrowth: [],
    resumeGrowth: [],
    roleDistribution: [],
    mostActiveUsers: [],
    templateUsage: [],
  },
}); 
 const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
const [roleFilter, setRoleFilter] = useState("all");
  useEffect(() => {
    async function load() {
      const token = getToken();
      if (!token) {
        navigate("/");
        return;
      }
      try {
        const [usersRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (usersRes.status === 403 || statsRes.status === 403) {
          setError("You don't have admin access.");
          setLoading(false);
          return;
        }

        setUsers(await usersRes.json());
        setStats(await statsRes.json());
      } catch (err) {
        setError("Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    }
    load();
=======
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAdmins: 0,
    totalNormalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalResumes: 0,
    totalLogins: 0,
    resumesCreated: 0,
    atsUsage: 0,
    jobMatchUsage: 0,
    aiInterviewUsage: 0,
    aiInterviewCompleted: 0,
    questionBankUsage: 0,
    questionBankCompleted: 0,
    careerAssistantUsage: 0,
    skillGapUsage: 0,
    analytics: {
      userGrowth: [],
      resumeGrowth: [],
      roleDistribution: [],
      mostActiveUsers: [],
      templateUsage: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadData = async () => {
    const token = getToken();
    if (!token) {
      navigate("/");
      return;
    }
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (usersRes.status === 403 || statsRes.status === 403) {
        setError("You don't have admin access.");
        setLoading(false);
        return;
      }

      setUsers(await usersRes.json());
      setStats(await statsRes.json());
      setError("");
    } catch (err) {
      setError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
>>>>>>> 1c15bfd (Update GauravGo gaming website)
  }, [navigate]);
const filteredUsers = users.filter((u) => {
  const searchText = search.toLowerCase().trim();

  const matchesSearch =
    !searchText ||
    (u.name || "").toLowerCase().includes(searchText) ||
    (u.username || "").toLowerCase().includes(searchText)

  const matchesRole =
    roleFilter === "all" || u.role === roleFilter;

  return matchesSearch && matchesRole;
});

  return (
    <div className="flex justify-center w-full px-4 pb-8">
      <div className="max-w-5xl w-full">
        <div className="mb-6 ruled">
          <BackButton fallbackRoute="/db" />
          <h1 className="text-3xl font-display font-bold mt-2">Admin panel</h1>
          <p className="muted mt-1">Read-only view of all users and their resume activity.</p>
        </div>

        {error && (
          <p className="text-sm text-brick bg-brick/10 border border-brick/30 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {!error && (
          <>
           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

  <div className="card p-5">
    <p className="muted text-xs uppercase tracking-wider">
      Total Users
    </p>
    <p className="text-3xl font-display font-bold mt-2">
      {loading ? "—" : stats.totalUsers}
    </p>
  </div>

  <div className="card p-5">
    <p className="muted text-xs uppercase tracking-wider">
      Total Resumes
    </p>
    <p className="text-3xl font-display font-bold mt-2">
      {loading ? "—" : stats.totalResumes}
    </p>
  </div>

  <div className="card p-5">
    <p className="muted text-xs uppercase tracking-wider">
      Admins
    </p>
    <p className="text-3xl font-display font-bold mt-2">
      {loading ? "—" : stats.totalAdmins}
    </p>
  </div>

  <div className="card p-5">
    <p className="muted text-xs uppercase tracking-wider">
      Normal Users
    </p>
    <p className="text-3xl font-display font-bold mt-2">
      {loading ? "—" : stats.totalNormalUsers}
    </p>
  </div>

  <div className="card p-5">
    <p className="muted text-xs uppercase tracking-wider">
      Active Users
    </p>
    <p className="text-3xl font-display font-bold mt-2">
      {loading ? "—" : stats.activeUsers}
    </p>
  </div>

  <div className="card p-5">
    <p className="muted text-xs uppercase tracking-wider">
      Inactive Users
    </p>
    <p className="text-3xl font-display font-bold mt-2">
      {loading ? "—" : stats.inactiveUsers}
    </p>
  </div>

</div>
<<<<<<< HEAD
{/* ANALYTICS */}
=======

{/* PLATFORM FEATURE USAGE ANALYTICS */}
<div className="mb-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] muted">
        Platform Activity
      </p>
      <h2 className="text-xl font-display font-bold mt-1">
        Feature Usage & Student Actions
      </h2>
      <p className="muted text-xs mt-0.5">
        Live database counters tracking student feature engagements in real-time.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={loadData}
        className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-black/[0.04] transition inline-flex items-center gap-1.5"
        style={{ borderColor: "var(--color-border)" }}
      >
        <span>↻</span> Refresh Live Stats
      </button>
      <div className="stamp stamp-teal">Real-time DB</div>
    </div>
  </div>

  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div className="card p-4">
      <p className="muted text-xs uppercase tracking-wider font-semibold">Total Students</p>
      <p className="text-2xl font-display font-bold mt-1">
        {loading ? "—" : (stats.totalStudents ?? stats.totalNormalUsers ?? 0)}
      </p>
      <p className="muted text-[11px] mt-1">Registered non-admin students</p>
    </div>

    <div className="card p-4">
      <p className="muted text-xs uppercase tracking-wider font-semibold">Login Count</p>
      <p className="text-2xl font-display font-bold mt-1">
        {loading ? "—" : (stats.totalLogins ?? 0)}
      </p>
      <p className="muted text-[11px] mt-1">Successful student logins</p>
    </div>

    <div className="card p-4">
      <p className="muted text-xs uppercase tracking-wider font-semibold">Resume Creation</p>
      <p className="text-2xl font-display font-bold mt-1">
        {loading ? "—" : (stats.resumesCreated ?? stats.totalResumes ?? 0)}
      </p>
      <p className="muted text-[11px] mt-1">Total created resumes</p>
    </div>

    <div className="card p-4">
      <p className="muted text-xs uppercase tracking-wider font-semibold">ATS Usage</p>
      <p className="text-2xl font-display font-bold mt-1">
        {loading ? "—" : (stats.atsUsage ?? 0)}
      </p>
      <p className="muted text-[11px] mt-1">ATS resume evaluations</p>
    </div>

    <div className="card p-4">
      <p className="muted text-xs uppercase tracking-wider font-semibold">Job Match Usage</p>
      <p className="text-2xl font-display font-bold mt-1">
        {loading ? "—" : (stats.jobMatchUsage ?? 0)}
      </p>
      <p className="muted text-[11px] mt-1">Job description match runs</p>
    </div>

    <div className="card p-4">
      <p className="muted text-xs uppercase tracking-wider font-semibold">AI Interview</p>
      <p className="text-2xl font-display font-bold mt-1">
        {loading ? "—" : `${stats.aiInterviewUsage ?? 0} started / ${stats.aiInterviewCompleted ?? 0} done`}
      </p>
      <p className="muted text-[11px] mt-1">AI Mock Interview sessions</p>
    </div>

    <div className="card p-4">
      <p className="muted text-xs uppercase tracking-wider font-semibold">Question Bank</p>
      <p className="text-2xl font-display font-bold mt-1">
        {loading ? "—" : `${stats.questionBankUsage ?? 0} started / ${stats.questionBankCompleted ?? 0} done`}
      </p>
      <p className="muted text-[11px] mt-1">Question bank practice sessions</p>
    </div>

    <div className="card p-4">
      <p className="muted text-xs uppercase tracking-wider font-semibold">Skill Gap / Career AI</p>
      <p className="text-2xl font-display font-bold mt-1">
        {loading ? "—" : `${stats.skillGapUsage ?? 0} / ${stats.careerAssistantUsage ?? 0}`}
      </p>
      <p className="muted text-[11px] mt-1">Skill Gap & Career Assistant runs</p>
    </div>
  </div>
</div>
>>>>>>> 1c15bfd (Update GauravGo gaming website)

{/* ANALYTICS */}

<div className="mb-8">

  {/* ANALYTICS HEADER */}
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] muted">
        Platform overview
      </p>

      <h2 className="text-2xl font-display font-bold mt-1">
        Analytics
      </h2>

      <p className="muted text-sm mt-1">
        Monitor user activity, resume creation and platform usage.
      </p>
    </div>

    <div className="stamp">
      Last 7 days
    </div>
  </div>


  {/* ANALYTICS GRID */}

  <div className="grid lg:grid-cols-2 gap-5">


    {/* USER GROWTH */}

    <div className="card p-5">

      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg">
            User Growth
          </h3>

          <p className="muted text-xs mt-1">
            New accounts created
          </p>
        </div>

        <div className="h-9 w-9 rounded-lg border flex items-center justify-center text-sm font-bold"
          style={{ borderColor: "var(--color-border)" }}
        >
          ↑
        </div>
      </div>

      {stats.analytics?.userGrowth?.length > 0 ? (
        <ActivityBars
          items={stats.analytics.userGrowth}
          emptyMessage="No new users in the last 7 days."
        />
      ) : (
        <div className="py-8 text-center">
          <p className="muted text-sm">
            No new users in the last 7 days.
          </p>
        </div>
      )}

    </div>


    {/* RESUME GROWTH */}

    <div className="card p-5">

      <div className="flex items-start justify-between mb-6">

        <div>
          <h3 className="font-semibold text-lg">
            Resume Activity
          </h3>

          <p className="muted text-xs mt-1">
            Resumes created
          </p>
        </div>

        <div
          className="h-9 w-9 rounded-lg border flex items-center justify-center text-sm font-bold"
          style={{
            borderColor:
              "var(--color-border)",
          }}
        >
          ↗
        </div>

      </div>

      {stats.analytics?.resumeGrowth?.length > 0 ? (
        <ActivityBars
          items={stats.analytics.resumeGrowth}
          emptyMessage="No resume activity in the last 7 days."
        />
      ) : (
        <div className="py-8 text-center">
          <p className="muted text-sm">
            No resume activity in the last 7 days.
          </p>
        </div>
      )}

    </div>


    {/* ROLE DISTRIBUTION */}

    <div className="card p-5">

      <div className="mb-6">
        <h3 className="font-semibold text-lg">
          User Distribution
        </h3>

        <p className="muted text-xs mt-1">
          Accounts by role
        </p>
      </div>

      <div className="space-y-5">

        {stats.analytics?.roleDistribution?.map(
          (item) => {

            const total =
              stats.totalUsers || 1;

            const percentage = Math.round(
              (item.count / total) * 100
            );

            const roleName =
              item._id === "admin"
                ? "Administrators"
                : item._id === "user"
                ? "Users"
                : "Unassigned";

            return (
              <div key={item._id || "unknown"}>

                <div className="flex items-center justify-between mb-2">

                  <div className="flex items-center gap-2">

                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background:
                          "var(--color-accent)",
                      }}
                    />

                    <span className="text-sm font-medium">
                      {roleName}
                    </span>

                  </div>

                  <span className="text-sm font-bold">
                    {item.count}
                  </span>

                </div>

                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{
                    background:
                      "var(--color-border)",
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${percentage}%`,
                      background:
                        "var(--color-accent)",
                    }}
                  />
                </div>

                <p className="muted text-[11px] mt-1">
                  {percentage}% of all users
                </p>

              </div>
            );
          }
        )}

      </div>

    </div>


    {/* MOST ACTIVE USERS */}

    <div className="card p-5">

      <div className="flex items-start justify-between mb-6">

        <div>
          <h3 className="font-semibold text-lg">
            Most Active Users
          </h3>

          <p className="muted text-xs mt-1">
            Based on resume creation
          </p>
        </div>

        <span className="stamp">
          Top 5
        </span>

      </div>

      {stats.analytics?.mostActiveUsers?.length > 0 ? (

        <div className="space-y-1">

          {stats.analytics.mostActiveUsers.map(
            (user, index) => (

              <div
                key={`${user.username}-${index}`}
                className="flex items-center gap-3 py-3 border-b last:border-b-0"
                style={{
                  borderColor:
                    "var(--color-border)",
                }}
              >

                {/* RANK */}

                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold border"
                  style={{
                    borderColor:
                      "var(--color-border)",
                  }}
                >
                  {index + 1}
                </div>


                {/* USER */}

                <div className="flex-1 min-w-0">

                  <p className="text-sm font-semibold truncate">
                    {user.name ||
                      user.username ||
                      "Unknown user"}
                  </p>

                  {user.username && (
                    <p className="muted text-xs truncate">
                      @{user.username}
                    </p>
                  )}

                </div>


                {/* COUNT */}

                <div className="text-right">

                  <p className="text-sm font-bold">
                    {user.resumeCount}
                  </p>

                  <p className="muted text-[11px]">
                    resumes
                  </p>

                </div>

              </div>

            )
          )}

        </div>

      ) : (

        <div className="py-8 text-center">
          <p className="muted text-sm">
            No resume activity yet.
          </p>
        </div>

      )}

    </div>


    {/* TEMPLATE USAGE */}

    <div className="card p-5 lg:col-span-2">

      <div className="flex items-start justify-between mb-6">

        <div>
          <h3 className="font-semibold text-lg">
            Resume Template Usage
          </h3>

          <p className="muted text-xs mt-1">
            Most selected templates
          </p>
        </div>

        <span className="stamp">
          Top templates
        </span>

      </div>


      {stats.analytics?.templateUsage?.length > 0 ? (

        <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">

          {stats.analytics.templateUsage.map(
            (item) => {

              const totalTemplates =
                stats.analytics.templateUsage.reduce(
                  (sum, x) => sum + x.count,
                  0
                );

              const percentage =
                totalTemplates > 0
                  ? Math.round(
                      (item.count /
                        totalTemplates) *
                        100
                    )
                  : 0;

              const templateName =
                (item._id || "Unknown")
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) =>
                    c.toUpperCase()
                  );

              return (
                <div key={item._id}>

                  <div className="flex justify-between mb-2">

                    <span className="text-sm font-medium">
                      {templateName}
                    </span>

                    <span className="text-xs font-bold">
                      {item.count}
                    </span>

                  </div>

                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{
                      background:
                        "var(--color-border)",
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(
                          percentage,
                          6
                        )}%`,
                        background:
                          "var(--color-accent)",
                      }}
                    />
                  </div>

                  <p className="muted text-[11px] mt-1">
                    {percentage}% of template usage
                  </p>

                </div>
              );
            }
          )}

        </div>

      ) : (

        <p className="muted text-sm">
          No template usage data yet.
        </p>

      )}

    </div>

  </div>

</div>
  {/* ROLE FILTER */}
 {/* USER MANAGEMENT */}

<div className="card p-5 mb-6">

  {/* HEADER */}

  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">

    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] muted">
        Administration
      </p>

      <h2 className="text-xl font-display font-bold mt-1">
        User Management
      </h2>

      <p className="muted text-sm mt-1">
        Manage and review registered users and their resume activity.
      </p>
    </div>

    <div className="stamp">
      {filteredUsers.length} users
    </div>

  </div>


  {/* SEARCH + FILTER */}

  <div className="flex flex-col sm:flex-row gap-3">

    {/* SEARCH */}

    <div className="relative flex-1">

      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 muted text-sm"
      >
        ⌕
      </span>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or username..."
        className="input w-full pl-9"
      />

    </div>


    {/* ROLE FILTER */}

    <select
      value={roleFilter}
      onChange={(e) => setRoleFilter(e.target.value)}
      className="input sm:w-44"
    >
      <option value="all">All roles</option>
      <option value="user">Users</option>
      <option value="admin">Admins</option>
    </select>

  </div>

</div>


{/* USER TABLE */}

<div className="card p-0 overflow-hidden">

  <div className="px-5 py-4 border-b flex items-center justify-between"
    style={{ borderColor: "var(--color-border)" }}
  >

    <div>
      <h3 className="font-semibold">
        Registered Users
      </h3>

      <p className="muted text-xs mt-1">
        User accounts currently registered on the platform
      </p>
    </div>

    <span className="muted text-xs">
      {users.length} total
    </span>

  </div>


  <div className="overflow-x-auto">

    <table className="w-full text-sm">

      <thead>

        <tr
          className="border-b"
          style={{
            borderColor: "var(--color-border)",
          }}
        >

          <th className="text-left px-5 py-3 text-xs uppercase tracking-wider muted font-bold">
            User
          </th>

          <th className="text-left px-5 py-3 text-xs uppercase tracking-wider muted font-bold">
            Role
          </th>

          <th className="text-left px-5 py-3 text-xs uppercase tracking-wider muted font-bold">
            Resumes
          </th>

          <th className="text-left px-5 py-3 text-xs uppercase tracking-wider muted font-bold">
<<<<<<< HEAD
=======
            Last Login
          </th>

          <th className="text-left px-5 py-3 text-xs uppercase tracking-wider muted font-bold">
>>>>>>> 1c15bfd (Update GauravGo gaming website)
            Joined
          </th>

          <th className="text-right px-5 py-3 text-xs uppercase tracking-wider muted font-bold">
            Action
          </th>

        </tr>

      </thead>


      <tbody>

        {loading ? (

          <tr>
            <td
              className="px-5 py-8 muted text-center"
<<<<<<< HEAD
              colSpan={5}
=======
              colSpan={6}
>>>>>>> 1c15bfd (Update GauravGo gaming website)
            >
              Loading users…
            </td>
          </tr>

        ) : filteredUsers.length === 0 ? (

          <tr>

            <td
              className="px-5 py-10 text-center"
<<<<<<< HEAD
              colSpan={5}
=======
              colSpan={6}
>>>>>>> 1c15bfd (Update GauravGo gaming website)
            >

              <div className="muted text-sm">
                No users found.
              </div>

              {(search || roleFilter !== "all") && (
                <button
                  type="button"
                  className="text-sm font-semibold underline mt-2"
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}

            </td>

          </tr>

        ) : (

          filteredUsers.map((u) => (

            <tr
              key={u.id}
              className="border-b transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.025]"
              style={{
                borderColor: "var(--color-border)",
              }}
            >

              {/* USER */}

              <td className="px-5 py-4">

                <div className="flex items-center gap-3">

                  {/* AVATAR */}

                  <div
                    className="h-9 w-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      borderColor: "var(--color-border)",
                      background:
                        "var(--color-surface-muted, rgba(0,0,0,0.03))",
                    }}
                  >
                    {(
                      u.name ||
                      u.username ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>


                  {/* NAME */}

                  <div className="min-w-0">

                    <p className="font-semibold truncate">
                      {u.name || "Unnamed user"}
                    </p>

                    <p className="muted text-xs mt-0.5 truncate">
                      @{u.username || "unknown"}
                    </p>

                  </div>

                </div>

              </td>


              {/* ROLE */}

              <td className="px-5 py-4">

                <span
                  className={`stamp ${
                    u.role === "admin"
                      ? "stamp-teal"
                      : ""
                  }`}
                >
                  {u.role === "admin"
                    ? "ADMIN"
                    : "USER"}
                </span>

              </td>


              {/* RESUMES */}

              <td className="px-5 py-4">

                <div className="flex items-center gap-2">

                  <span className="font-bold">
                    {u.resumeCount || 0}
                  </span>

                  <span className="muted text-xs">
                    {u.resumeCount === 1
                      ? "resume"
                      : "resumes"}
                  </span>

                </div>

              </td>

<<<<<<< HEAD
=======
              {/* LAST LOGIN */}

              <td className="px-5 py-4">

                <div>

                  <p className="text-sm">
                    {u.lastLogin
                      ? new Date(
                          u.lastLogin
                        ).toLocaleDateString(
                          undefined,
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "Never"}
                  </p>

                </div>

              </td>

>>>>>>> 1c15bfd (Update GauravGo gaming website)

              {/* JOINED */}

              <td className="px-5 py-4">

                <div>

                  <p className="text-sm">
                    {u.createdAt
                      ? new Date(
                          u.createdAt
                        ).toLocaleDateString(
                          undefined,
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "—"}
                  </p>

                </div>

              </td>


              {/* ACTION */}

              <td className="px-5 py-4 text-right">

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  style={{
                    borderColor:
                      "var(--color-border)",
                  }}
                  onClick={() => {
                    alert(
                      `User: ${
                        u.name || u.username
                      }\nUsername: @${
                        u.username
                      }\nRole: ${
                        u.role
                      }\nResumes: ${
                        u.resumeCount || 0
                      }`
                    );
                  }}
                >
                  View
                  <span>→</span>
                </button>

              </td>

            </tr>

          ))

        )}

      </tbody>

    </table>

  </div>

</div>

          </>
        )}
      </div>
    </div>
  );
}

export default Admin;
