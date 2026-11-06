"""Grovcentric API (demo). Replace DEMO_* with a real DB + hashed passwords + JWT before production."""
import secrets
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Grovcentric API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])
DEMO_USER = {"email": "demo@grovcentric.com", "password": "demo1234", "name": "Sara"}
TOKENS: set[str] = set()

class Login(BaseModel):
    email: str
    password: str

def auth(authorization: str = Header(default="")) -> None:
    if authorization.removeprefix("Bearer ") not in TOKENS:
        raise HTTPException(401, "Unauthorized")

@app.post("/api/auth/login")
def login(body: Login):
    if body.email != DEMO_USER["email"] or body.password != DEMO_USER["password"]:
        raise HTTPException(401, "Invalid credentials")
    token = secrets.token_urlsafe(24); TOKENS.add(token)
    return {"token": token}

@app.get("/api/dashboard", dependencies=[Depends(auth)])
def dashboard():
    # Each block below will later be fed by a partner-built AI agent service.
    return {
        "user": DEMO_USER["name"], "health": 78,
        "kpis": [{"label": "Revenue", "value": "$48,290", "delta": "+12.4%"},
                 {"label": "Business health", "value": "78/100", "delta": "+4 pts"},
                 {"label": "SEO score", "value": "82", "delta": "+6"},
                 {"label": "AEO visibility", "value": "41%", "delta": "+9%"}],
        "revenue": [18, 24, 22, 31, 36, 42, 48], "leads": [12, 15, 19, 21, 27, 30, 38],
        "insight": "Your AEO visibility is 41%: AI answer engines cite competitors for 'best local bakery software'. Publish 3 FAQ pages to close the gap this month.",
        "roadmap": [{"title": "Launch referral program", "status": "Draft"},
                    {"title": "Expand to 2 new channels", "status": "Planned"},
                    {"title": "Hire first sales rep", "status": "Locked"}],
        "agents": [{"name": "Analyst Agent", "status": "Live", "task": "Weekly business analysis"},
                   {"name": "SEO Agent", "status": "Live", "task": "Audited 48 pages"},
                   {"name": "AEO Agent", "status": "Beta", "task": "Tracking 25 AI prompts"},
                   {"name": "Roadmap Agent", "status": "In development", "task": "Preview data only"}],
    }

# ---- Section pages. Each entry below is the contract a partner agent will later fulfil. ----
M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]
def S(title, sub, kpis, al, bl, a, b, tt, cols, rows, tips, note=None):
    return {"title": title, "sub": sub, "note": note, "kpis": [{"label": k[0], "value": k[1], "delta": k[2]} for k in kpis],
            "aLabel": al, "bLabel": bl, "a": a, "b": b, "tableTitle": tt, "cols": cols, "rows": rows, "tips": tips}

SECTIONS = {
    "analysis": S("Business analysis", "Who your customers are and how they behave", [("Acquisition cost", "$18.40", "-6%"), ("Churn", "3.2%", "-0.4 pts"), ("Avg. order value", "$62", "+5%"), ("Repeat customers", "34%", "+3 pts")],
        "Customers", "Orders", [210, 240, 255, 290, 310, 345, 380], [160, 190, 205, 240, 262, 290, 330], "Top customer segments", ["Segment", "Share", "Growth"],
        [["Local shoppers", "42%", "+9%"], ["Online buyers", "31%", "+14%"], ["Wholesale", "17%", "+3%"], ["Events", "10%", "-2%"]],
        ["Online buyers grow fastest: increase their budget share", "Wholesale margin is lowest: review pricing", "Repeat rate is rising: launch a loyalty offer"]),
    "health": S("Business health", "Overall score 78/100 across four areas", [("Cash runway", "7.2 mo", "+0.6"), ("Profit margin", "31%", "+2 pts"), ("Satisfaction", "4.5/5", "+0.1"), ("Team workload", "82%", "+5 pts")],
        "Health score", "Target", [66, 68, 70, 72, 74, 76, 78], [80] * 7, "Health factors", ["Factor", "Score", "Status"],
        [["Cash flow", "71", "Watch"], ["Growth", "84", "Strong"], ["Customers", "88", "Strong"], ["Operations", "69", "Watch"]],
        ["Cash flow: invoice faster to lift runway above 9 months", "Operations: automate order handling", "Team workload is high: plan a hire"]),
    "revenue": S("Revenue", "Income, forecast and where it comes from", [("Monthly revenue", "$48,290", "+12.4%"), ("Avg. per customer", "$62", "+5%"), ("Next month forecast", "$53,100", "+9.9%"), ("Refund rate", "1.8%", "-0.3 pts")],
        "Revenue ($k)", "Forecast ($k)", [18, 24, 22, 31, 36, 42, 48], [20, 23, 26, 30, 35, 41, 53], "Revenue by channel", ["Channel", "Revenue", "Change"],
        [["Paid ads", "$19,400", "+8%"], ["Email", "$12,900", "+21%"], ["SEO", "$9,300", "+15%"], ["Social", "$6,690", "+4%"]],
        ["Email converts best: shift $1,200 from ads", "Forecast assumes current growth continues", "Cut refund causes in the top product"]),
    "roadmap": S("Roadmap", "Your plan for the next two quarters", [("Milestones", "9", "3 done"), ("On track", "6", "+1"), ("At risk", "2", "0"), ("Next review", "Dec 2", "")],
        "Planned", "Completed", [1, 2, 3, 4, 6, 8, 9], [0, 0, 1, 1, 2, 3, 3], "Milestones", ["Milestone", "Target", "Status"],
        [["Launch referral program", "Dec 15", "Draft"], ["Expand to 2 new channels", "Jan 30", "Planned"], ["Hire first sales rep", "Feb 28", "Locked"], ["Open second location", "Apr 30", "Idea"]],
        ["Confirm goals so the roadmap agent can plan around them", "Add budget limits per milestone"], "Preview: the roadmap agent is still in development. Data shown is a sample."),
    "seo": S("SEO", "How easily search engines find you", [("SEO score", "82", "+6"), ("Organic visits", "12,480", "+11%"), ("Keywords in top 10", "64", "+9"), ("Backlinks", "318", "+24")],
        "Organic visits (hundreds)", "Top-10 keywords", [70, 78, 85, 96, 104, 115, 125], [30, 36, 41, 48, 53, 58, 64], "Pages to fix", ["Page", "Issue", "Priority"],
        [["/pricing", "Missing meta description", "High"], ["/blog/launch", "Slow hero image", "Medium"], ["/about", "Only one H1 heading needed", "Low"], ["/contact", "No local business markup", "High"]],
        ["Fix the two high-priority pages first", "Add FAQ content for your 5 top searches", "Ask 3 partners for backlinks"]),
    "aeo": S("AEO", "How often AI answer engines mention you", [("AEO visibility", "41%", "+9%"), ("AI mentions", "128", "+31"), ("Citations", "37", "+8"), ("Prompts tracked", "25", "+5")],
        "Visibility %", "Competitor avg %", [22, 25, 28, 31, 35, 38, 41], [48, 48, 49, 50, 50, 51, 52], "Tracked prompts", ["Prompt", "Engine", "Mentioned"],
        [["best bakery software", "ChatGPT", "No"], ["top tools for new cafes", "Gemini", "Yes"], ["how to grow a small shop", "Perplexity", "Yes"], ["cheap POS for startups", "ChatGPT", "No"]],
        ["Publish clear answer pages for the prompts you miss", "Add structured data to your top pages", "Get cited on trusted review sites"], "Beta: the AEO agent is still being tested. Results can vary between runs."),
}

@app.get("/api/section/{name}", dependencies=[Depends(auth)])
def section(name: str):
    if name not in SECTIONS:
        raise HTTPException(404, "Unknown section")
    return SECTIONS[name]
