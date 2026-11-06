import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import "./styles.css";

type Kpi = { label: string; value: string; delta: string };
type Data = {
  user: string;
  health: number;
  kpis: Kpi[];
  revenue: number[];
  leads: number[];
  insight: string;
  roadmap: { title: string; status: string }[];
  agents: { name: string; status: string; task: string }[];
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const TABS = ["Overview", "Analysis", "Health", "Revenue", "Roadmap", "SEO", "AEO"];

const Logo = ({ big = false }: { big?: boolean }) =>
  big ? (
    <img src="/logo.png" alt="Grovcentric — AI Business Operating System" className="logo-full" />
  ) : (
    <div className="logo">
      <img src="/mark.png" alt="" />
      <span>
        Grov<b>centric</b>
      </span>
    </div>
  );

function Login({ onAuth }: { onAuth: (t: string) => void }) {
  const [email, setEmail] = useState("demo@grovcentric.com"),
    [pw, setPw] = useState("demo1234");
  const [err, setErr] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      if (!r.ok) throw new Error();
      onAuth((await r.json()).token);
    } catch {
      setErr("Could not sign in. Check your details and that the API is running.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <Logo big />
      <form className="card login-card" onSubmit={submit}>
        <h1>Sign in to Grovcentric</h1>
        <p className="sub">Welcome back — enter your details.</p>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </label>
        <a className="forgot" href="#">
          Forgot password?
        </a>
        {err && <div className="err">{err}</div>}
        <button className="btn" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <button type="button" className="btn ghost">
          Continue with Google
        </button>
        <p className="sub center">
          New here? <a href="#">Create an account</a>
        </p>
      </form>
    </main>
  );
}

const Chart = ({ a, b }: { a: number[]; b: number[] }) => {
  const max = Math.max(...a, ...b),
    pts = (v: number[]) =>
      v.map((y, i) => `${30 + i * (550 / (v.length - 1))},${170 - (y / max) * 150}`).join(" ");
  return (
    <svg viewBox="0 0 600 200" className="chart">
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="30" x2="580" y1={20 + i * 50} y2={20 + i * 50} stroke="var(--line)" />
      ))}
      <polyline
        fill="none"
        stroke="var(--green)"
        strokeWidth="3"
        strokeLinejoin="round"
        points={pts(a)}
      />
      <polyline
        fill="none"
        stroke="var(--blue)"
        strokeWidth="3"
        strokeLinejoin="round"
        points={pts(b)}
      />
      {MONTHS.map((m, i) => (
        <text
          key={m}
          x={30 + i * (550 / 6)}
          y="194"
          fill="var(--sub)"
          fontSize="11"
          textAnchor="middle"
        >
          {m}
        </text>
      ))}
    </svg>
  );
};

type Sec = {
  title: string;
  sub: string;
  note?: string;
  kpis: Kpi[];
  aLabel: string;
  bLabel: string;
  a: number[];
  b: number[];
  tableTitle: string;
  cols: string[];
  rows: string[][];
  tips: string[];
};
function Section({ name, token }: { name: string; token: string }) {
  const [s, setS] = useState<Sec | null>(null),
    [err, setErr] = useState(false);
  useEffect(() => {
    setS(null);
    setErr(false);
    fetch(`/api/section/${name.toLowerCase()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setS)
      .catch(() => setErr(true));
  }, [name, token]);
  if (!s)
    return (
      <p className="sub pad">
        {err ? "Could not load this page. Is the API running?" : "Loading…"}
      </p>
    );
  return (
    <section className="pad">
      <h2>{s.title}</h2>
      <p className="sub">{s.sub}</p>
      {s.note && <div className="note">{s.note}</div>}
      <div className="kpis">
        {s.kpis.map((k) => (
          <div className="card kpi" key={k.label}>
            <span className="sub">{k.label}</span>
            <strong>{k.value}</strong>
            <em>{k.delta}</em>
          </div>
        ))}
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Trend</h3>
          <Chart a={s.a} b={s.b} />
          <p className="sub">
            <span style={{ color: "var(--green)" }}>●</span> {s.aLabel} &nbsp;{" "}
            <span style={{ color: "var(--blue)" }}>●</span> {s.bLabel}
          </p>
        </div>
        <div className="card insight">
          <h3>RECOMMENDED ACTIONS</h3>
          <ul>
            {s.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="card wide2">
          <h3>{s.tableTitle}</h3>
          <table>
            <thead>
              <tr>
                {s.cols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Dashboard({ token, onOut }: { token: string; onOut: () => void }) {
  const [d, setD] = useState<Data | null>(null),
    [failed, setFailed] = useState(false),
    [tab, setTab] = useState("Overview");
  useEffect(() => {
    fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 401) {
          onOut();
          throw new Error();
        }
        return r.json();
      })
      .then(setD)
      .catch(() => setFailed(true));
  }, [token]);
  const C = 2 * Math.PI * 52;
  return (
    <div className="app">
      <header className="top">
        <Logo />
        <nav>
          {TABS.map((t) => (
            <button key={t} className={t === tab ? "on" : ""} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </nav>
        <button className="avatar" title="Sign out" onClick={onOut}>
          {d?.user?.[0] ?? "S"}
        </button>
      </header>
      {tab !== "Overview" ? (
        <Section name={tab} token={token} />
      ) : !d ? (
        <p className="sub pad">
          {failed ? "Could not load data. Is the API running?" : "Loading…"}
        </p>
      ) : (
        <section className="pad">
          <h2>Welcome back, {d.user}</h2>
          <p className="sub">Last 30 days · all channels</p>
          <div className="kpis">
            {d.kpis.map((k) => (
              <div className="card kpi" key={k.label}>
                <span className="sub">{k.label}</span>
                <strong>{k.value}</strong>
                <em>{k.delta} vs last month</em>
              </div>
            ))}
          </div>
          <div className="grid">
            <div className="card">
              <h3>Revenue & leads</h3>
              <Chart a={d.revenue} b={d.leads} />
            </div>
            <div className="card insight">
              <h3>AI INSIGHT</h3>
              <p>{d.insight}</p>
              <button className="btn">Apply suggestion</button>
            </div>
            <div className="card health">
              <h3>Business health</h3>
              <svg viewBox="0 0 130 130" width="130">
                <circle cx="65" cy="65" r="52" fill="none" stroke="var(--line)" strokeWidth="12" />
                <circle
                  cx="65"
                  cy="65"
                  r="52"
                  fill="none"
                  stroke="var(--green)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(d.health / 100) * C} ${C}`}
                  transform="rotate(-90 65 65)"
                />
                <text x="65" y="72" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700">
                  {d.health}
                </text>
              </svg>
            </div>
            <div className="card">
              <h3>
                Roadmap <span className="pill">Preview</span>
              </h3>
              {d.roadmap.map((r) => (
                <div className="row" key={r.title}>
                  <span>{r.title}</span>
                  <span className="sub">{r.status}</span>
                </div>
              ))}
            </div>
            <div className="card wide">
              <h3>AI agents</h3>
              {d.agents.map((a) => (
                <div className="row" key={a.name}>
                  <span>{a.name}</span>
                  <span className="sub">{a.task}</span>
                  <span className={`pill ${a.status === "Live" ? "ok" : ""}`}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(null); // in-memory for the demo; use httpOnly cookies in production
  return token ? (
    <Dashboard token={token} onOut={() => setToken(null)} />
  ) : (
    <Login onAuth={setToken} />
  );
}
