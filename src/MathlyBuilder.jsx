import { useState, useMemo, useCallback, useEffect } from "react";
import mathlyLogo from "./assets/mathly-logo.png";
import {
  SKILLS,
  GRADES,
  CATEGORIES,
  skillsForGrade,
  gradeLabel,
  buildSheet,
  regenerateOne,
  maxQuestions,
  reorderSheet,
} from "./generators";
import { downloadWorksheetPdf } from "./pdf";
import { trackViewWorksheet } from "./analytics";

const DIFFICULTIES = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

const WORKSPACE_SIZES = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
];

const WORKSPACE_HEIGHT = { small: 40, medium: 70, large: 110 };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap');

.mb { --desk:#EDF1F5; --paper:#FFFFFF; --ink:#16202B; --ink-soft:#5A6B7C;
      --rule:#D3E3F2; --blue:#2563EB; --blue-deep:#1D4FD7; --mint:#10B981;
      font-family:'Inter',system-ui,sans-serif; color:var(--ink);
      background:var(--desk); min-height:100vh; min-height:100dvh; overflow-x:hidden; }
.mb *,.mb *::before,.mb *::after { box-sizing:border-box; }
:where(.mb button) { font:inherit; cursor:pointer; border:none; background:none; color:inherit; }
.mb :focus-visible { outline:2px solid var(--blue); outline-offset:3px; }

.mb-shell { max-width:1120px; margin:0 auto; padding:0 24px 120px; }
.mb-bar { display:flex; align-items:center; gap:10px; padding:20px 0;
          border-bottom:1px solid var(--rule); margin-bottom:28px; }
.mb-back { display:flex; align-items:center; gap:7px; font-size:14px; color:var(--ink-soft); }
.mb-back:hover { color:var(--blue); }
.mb-logo { height:60px; width:auto; object-fit:contain; display:block; }
.mb-feedback { font-size:14px; color:var(--ink-soft); white-space:nowrap; }
.mb-feedback:hover { color:var(--blue); }

.mb-letterhead { margin-bottom:20px; }
.mb-letterhead-logo { height:68px; width:auto; object-fit:contain; display:block; }

.mb-nameline { display:flex; gap:26px; flex-wrap:wrap; margin:16px 0 20px;
               font-size:12.5px; color:var(--ink-soft); }
.mb-nameline span { display:flex; align-items:baseline; gap:6px; }
.mb-nameline b { flex:none; }
.mb-nameline i { flex:none; width:130px; border-bottom:1px solid var(--rule); height:1px; }
.mb-nameline span:nth-child(2) i,
.mb-nameline span:nth-child(3) i { width:80px; }

.mb-cols { display:grid; grid-template-columns:minmax(0,5fr) minmax(0,6fr); gap:44px;
           align-items:start; }

.mb-lab { font-size:13px; color:var(--ink-soft); margin:0 0 10px; }
.mb-group { margin-bottom:28px; }

.mb-pills { display:flex; gap:8px; flex-wrap:wrap; }
.mb-pill { border:1px solid var(--rule); background:var(--paper); border-radius:20px;
           padding:9px 20px; font-size:14px; color:var(--ink-soft); }
.mb-pill:hover { border-color:var(--blue); }
.mb-pill[aria-pressed="true"] { background:var(--ink); border-color:var(--ink); color:#fff; }

.mb-cat { margin-bottom:16px; }
.mb-cat-h { display:flex; align-items:center; gap:7px; font-size:12px; margin:0 0 8px; }
.mb-cat-dot { width:7px; height:7px; border-radius:2px; }
.mb-chips { display:flex; gap:7px; flex-wrap:wrap; }
.mb-chip { border:1px solid var(--rule); background:var(--paper); border-radius:16px;
           padding:8px 14px; font-size:13.5px; color:var(--ink-soft); text-align:left;
           transition:border-color .12s ease; }
.mb-chip:hover { border-color:var(--blue); }
.mb-chip[aria-pressed="true"] { color:#fff; border-color:transparent; }

.mb-seg { display:flex; gap:6px; }
.mb-seg button { flex:1; border:1px solid var(--rule); background:var(--paper);
                 border-radius:8px; padding:11px 0; font-size:14px; color:var(--ink-soft); }
.mb-seg button:hover { border-color:var(--blue); }
.mb-seg button[aria-pressed="true"] { background:#EAF1FE; border-color:var(--blue);
                                      color:var(--blue-deep); }
.mb-seg button:disabled { opacity:.45; cursor:not-allowed; }
.mb-seg button:disabled:hover { border-color:var(--rule); }

.mb-count { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:10px; }
.mb-count b { font-family:'Space Grotesk',sans-serif; font-weight:500; font-size:17px;
              font-variant-numeric:tabular-nums; }
.mb-range { width:100%; accent-color:var(--blue); height:24px; }
.mb-cap { font-size:12px; color:var(--ink-soft); margin:6px 0 0; }

.mb-row { display:flex; align-items:center; justify-content:space-between;
          padding:13px 0; border-top:1px solid var(--rule); font-size:14.5px; }
.mb-row:disabled { opacity:.45; cursor:not-allowed; }
.mb-tog { width:42px; height:24px; border-radius:12px; background:#CBD5E1; position:relative;
          flex:none; transition:background .15s ease; }
.mb-tog[aria-pressed="true"] { background:var(--blue); }
.mb-tog span { position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%;
               background:#fff; transition:transform .15s ease; }
.mb-tog[aria-pressed="true"] span { transform:translateX(18px); }

.mb-pane { position:sticky; top:20px; }
.mb-pane-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:11px; }
.mb-tabs { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.mb-tab { border-radius:16px; padding:6px 14px; font-size:13px; color:var(--ink-soft); }
.mb-tab[aria-pressed="true"] { background:#EAF1FE; color:var(--blue-deep); }
.mb-pane-acts { display:flex; align-items:center; gap:16px; }
.mb-shuffle { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--blue); }
.mb-shuffle svg { transition:transform .35s ease; }
.mb-shuffle:hover svg { transform:rotate(140deg); }

.mb-sheet { background:var(--paper); border:1px solid var(--rule); border-radius:4px;
            padding:30px 32px; }
.mb-sheet-top { display:flex; justify-content:space-between; align-items:baseline; gap:14px;
                border-bottom:1px solid var(--rule); padding-bottom:13px; margin-bottom:4px;
                font-size:12.5px; color:var(--ink-soft); }
.mb-sheet-title { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis;
                   white-space:nowrap; }
.mb-sheet-top > span:last-child { flex:none; white-space:nowrap; }
.mb-q { display:flex; align-items:flex-start; gap:12px; padding:10px 0;
        border-bottom:1px solid #F1F5F9; }
.mb-q:last-child { border-bottom:none; }
.mb-dot { width:6px; height:6px; border-radius:50%; flex:none; margin-top:9px; }
.mb-n { font-size:12.5px; color:var(--ink-soft); width:22px; flex:none; margin-top:4px;
        font-variant-numeric:tabular-nums; }
.mb-t { font-family:'Space Grotesk',sans-serif; font-size:18px; line-height:1.5; flex:1;
        font-variant-numeric:tabular-nums; }
.mb-t.prose { font-family:'Inter',sans-serif; font-size:15px; }
.mb-a { color:var(--mint); font-family:'Space Grotesk',sans-serif; font-size:17px;
        margin-left:10px; }
.mb-space { display:block; }
.mb-redo { flex:none; width:32px; height:32px; border-radius:6px; display:grid;
           place-items:center; color:#94A3B8; }
.mb-redo:hover { color:var(--blue); background:#F1F5F9; }

.mb-empty { background:var(--paper); border:1px dashed var(--rule); border-radius:4px;
            padding:52px 28px; text-align:center; color:var(--ink-soft); font-size:14.5px; }

.mb-acts { display:flex; gap:9px; margin-top:16px; }
.mb-go { flex:1; background:var(--blue); color:#fff; border-radius:8px; padding:14px 0;
         font-size:15px; font-weight:500; text-align:center; min-height:48px; }
.mb-go:hover { background:var(--blue-deep); }
.mb-go:disabled { background:#B6C6DC; cursor:not-allowed; }
.mb-alt { border:1px solid var(--rule); background:var(--paper); border-radius:8px;
          padding:0 18px; min-height:48px; display:flex; align-items:center; gap:7px;
          font-size:15px; }
.mb-alt:hover { border-color:var(--blue); color:var(--blue); }

.mb-dock { display:none; }

@media (max-width:920px) {
  .mb-cols { grid-template-columns:minmax(0,1fr); gap:30px; }
  .mb-pane { position:static; min-width:0; }
}
@media (max-width:520px) {
  .mb-shell { padding:0 16px 108px; }
  .mb-sheet { padding:20px 18px; }
  .mb-t { font-size:17px; }
  .mb-q { padding:12px 0; }
  .mb-pill { padding:11px 18px; min-height:44px; display:inline-flex; align-items:center; }
  .mb-chip { padding:11px 15px; min-height:44px; display:inline-flex; align-items:center; }
  .mb-acts { display:none; }
  .mb-dock { display:flex; position:sticky; bottom:0; gap:9px; align-items:center;
             background:var(--paper); border-top:1px solid var(--rule);
             padding:12px 16px calc(12px + env(safe-area-inset-bottom));
             margin:20px -16px 0; }
  .mb-dock-info { font-size:13px; color:var(--ink-soft); line-height:1.35; }
}

@media print {
  .mb { background:#fff; }
  .mb-bar,.mb-cols > div:first-child,.mb-pane-top,.mb-acts,.mb-dock,.mb-redo { display:none !important; }
  .mb-shell { max-width:none; padding:0; }
  .mb-cols { display:block; }
  .mb-sheet { border:none; padding:0; }
  .mb-q { break-inside:avoid; page-break-inside:avoid; }
  .mb-letterhead { break-inside:avoid; page-break-inside:avoid; margin-bottom:12px; }
  .mb-t { font-size:13pt; }
  .mb-t.prose { font-size:12pt; }
  @page { size:letter; margin:0.5in; }
}
`;

function Refresh({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function Reorder({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}

export default function MathlyBuilder({ initialGrade = 4, initialSkillIds = [], onBack }) {
  const [grade, setGrade] = useState(initialGrade);
  const [skillIds, setSkillIds] = useState(initialSkillIds);
  const [difficulties, setDifficulties] = useState(["medium"]);
  const [count, setCount] = useState(20);
  const [showAnswers, setShowAnswers] = useState(false);
  const [workspace, setWorkspace] = useState(false);
  const [workspaceSize, setWorkspaceSize] = useState("small");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [sheet, setSheet] = useState([]);

  const available = useMemo(() => skillsForGrade(grade), [grade]);
  const cap = useMemo(
    () => (skillIds.length ? maxQuestions(skillIds) : 40),
    [skillIds]
  );

  useEffect(() => {
    const next = buildSheet({ skillIds, difficulty: difficulties, count: Math.min(count, cap), seed });
    setSheet(next);
    if (next.length) trackViewWorksheet({ grade, skillIds, difficulty: difficulties.join(".") });
  }, [grade, skillIds, difficulties, count, cap, seed]);

  useEffect(() => {
    if (count > cap) setCount(cap);
  }, [cap, count]);

  const toggleSkill = useCallback((id) => {
    setSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const toggleDifficulty = useCallback((id) => {
    setDifficulties((prev) => {
      if (prev.includes(id)) {
        // Always leave at least one difficulty selected.
        return prev.length === 1 ? prev : prev.filter((d) => d !== id);
      }
      return DIFFICULTIES.filter((d) => prev.includes(d.id) || d.id === id).map((d) => d.id);
    });
  }, []);

  const changeGrade = useCallback((g) => {
    setGrade(g);
    setSkillIds([]);
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    for (const s of available) (map[s.cat] ||= []).push(s);
    return map;
  }, [available]);

  const chosenSkills = useMemo(
    () => available.filter((s) => skillIds.includes(s.id)),
    [available, skillIds]
  );
  const worksheetTitle = useMemo(() => {
    if (!chosenSkills.length) return "Worksheet";
    if (chosenSkills.length <= 2) return chosenSkills.map((s) => s.name).join(" & ");
    return "Mixed practice";
  }, [chosenSkills]);
  const gradeText = `${gradeLabel(grade) === "K" ? "Kindergarten" : `Grade ${grade}`}${
    showAnswers ? " — answer key" : ""
  }`;

  const ready = skillIds.length > 0 && sheet.length > 0;
  const shuffle = () => setSeed(Math.floor(Math.random() * 1e6));
  const reorder = () => setSheet((s) => reorderSheet(s, Math.floor(Math.random() * 1e6)));
  const redo = (i) => setSheet((s) => regenerateOne(s, i, Math.floor(Math.random() * 1e6)));

  const [downloading, setDownloading] = useState(false);
  const downloadPdf = useCallback(async () => {
    if (!ready || downloading) return;
    setDownloading(true);
    try {
      await downloadWorksheetPdf({
        title: worksheetTitle,
        gradeText,
        sheet,
        showAnswers,
        workspaceSize: workspace ? workspaceSize : "none",
        grade,
        skillIds,
        difficulty: difficulties.join("."),
      });
    } finally {
      setDownloading(false);
    }
  }, [ready, downloading, worksheetTitle, gradeText, sheet, showAnswers, workspace, workspaceSize, grade, skillIds, difficulties]);

  return (
    <div className="mb">
      <style>{CSS}</style>

      <div className="mb-shell">
        <header className="mb-bar">
          <button className="mb-back" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "18px" }}>
            <a className="mb-feedback" href="mailto:feedback@mathly.us?subject=Mathly%20feedback">
              Feedback
            </a>
            <img src={mathlyLogo} alt="Mathly" className="mb-logo" />
          </div>
        </header>

        <div className="mb-cols">
          <div>
            <div className="mb-group">
              <p className="mb-lab">Grade</p>
              <div className="mb-pills">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    className="mb-pill"
                    aria-pressed={grade === g}
                    onClick={() => changeGrade(g)}
                  >
                    {g === 0 ? "Kindergarten" : `Grade ${g}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-group">
              <p className="mb-lab">
                Skills{skillIds.length > 0 ? ` \u2014 ${skillIds.length} selected` : ""}
              </p>
              {Object.entries(grouped).map(([cat, list]) => (
                <div className="mb-cat" key={cat}>
                  <p className="mb-cat-h" style={{ color: CATEGORIES[cat].tone }}>
                    <span className="mb-cat-dot" style={{ background: CATEGORIES[cat].tone }} />
                    {CATEGORIES[cat].label}
                  </p>
                  <div className="mb-chips">
                    {list.map((s) => {
                      const on = skillIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          className="mb-chip"
                          aria-pressed={on}
                          title={`${s.ccss} \u2014 ${s.hint}`}
                          style={on ? { background: CATEGORIES[cat].tone } : undefined}
                          onClick={() => toggleSkill(s.id)}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-group">
              <p className="mb-lab">
                Difficulty{difficulties.length > 1 ? " — mixed" : ""}
              </p>
              <div className="mb-seg">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    aria-pressed={difficulties.includes(d.id)}
                    onClick={() => toggleDifficulty(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-group">
              <div className="mb-count">
                <span className="mb-lab" style={{ margin: 0 }}>Questions</span>
                <b>{Math.min(count, cap)}</b>
              </div>
              <input
                type="range"
                className="mb-range"
                min="5"
                max={cap}
                step="1"
                value={Math.min(count, cap)}
                onChange={(e) => setCount(Number(e.target.value))}
                aria-label="Number of questions"
              />
              {skillIds.length > 0 && cap < 40 && (
                <p className="mb-cap">
                  Capped at {cap} so no question repeats within the sheet.
                </p>
              )}
            </div>

            <div>
              <button
                className="mb-row"
                style={{ width: "100%" }}
                aria-pressed={showAnswers}
                onClick={() => setShowAnswers((v) => !v)}
              >
                Show answer key
                <span className="mb-tog" aria-pressed={showAnswers}><span /></span>
              </button>
              <button
                className="mb-row"
                style={{ width: "100%" }}
                aria-pressed={workspace}
                disabled={showAnswers}
                onClick={() => setWorkspace((v) => !v)}
              >
                Add working space
                <span className="mb-tog" aria-pressed={workspace}><span /></span>
              </button>
            </div>

            {workspace && (
              <div className="mb-group" style={{ marginTop: 16 }}>
                <p className="mb-lab">Space size</p>
                <div className="mb-seg">
                  {WORKSPACE_SIZES.map((w) => (
                    <button
                      key={w.id}
                      aria-pressed={workspaceSize === w.id}
                      disabled={showAnswers}
                      onClick={() => setWorkspaceSize(w.id)}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-pane">
            <div className="mb-pane-top">
              <div className="mb-tabs">
                <button className="mb-tab" aria-pressed={!showAnswers} onClick={() => setShowAnswers(false)}>
                  Worksheet
                </button>
                <button className="mb-tab" aria-pressed={showAnswers} onClick={() => setShowAnswers(true)}>
                  Answer key
                </button>
              </div>
              {ready && (
                <span className="mb-pane-acts">
                  <button
                    className="mb-shuffle"
                    onClick={reorder}
                    title="Same questions in a new order — print one copy, reorder, print the next"
                  >
                    <Reorder />
                    Reorder
                  </button>
                  <button
                    className="mb-shuffle"
                    onClick={shuffle}
                    title="Replace every question with a new one"
                  >
                    <Refresh />
                    Regenerate
                  </button>
                </span>
              )}
            </div>

            {ready ? (
              <div className="mb-sheet">
                <div className="mb-letterhead">
                  <img src={mathlyLogo} alt="Mathly" className="mb-letterhead-logo" />
                </div>
                {!showAnswers && (
                  <div className="mb-nameline">
                    <span><b>Name:</b><i /></span>
                    <span><b>Date:</b><i /></span>
                    <span><b>Period:</b><i /></span>
                  </div>
                )}
                <div className="mb-sheet-top">
                  <span className="mb-sheet-title" title={worksheetTitle}>{worksheetTitle}</span>
                  <span>{gradeText}</span>
                </div>
                {sheet.map((q, i) => {
                  const prose = q.cat === "word" || q.cat === "geometry";
                  return (
                    <div className="mb-q" key={`${seed}-${q.prompt}`}>
                      <span className="mb-dot" style={{ background: CATEGORIES[q.cat].tone }} />
                      <span className="mb-n">{i + 1}.</span>
                      <span className={`mb-t${prose ? " prose" : ""}`}>
                        {q.prompt}
                        {showAnswers && <span className="mb-a">{q.answer}</span>}
                        {workspace && !showAnswers && (
                          <span
                            className="mb-space"
                            style={{ height: WORKSPACE_HEIGHT[workspaceSize] }}
                          />
                        )}
                      </span>
                      <button
                        className="mb-redo"
                        onClick={() => redo(i)}
                        aria-label={`Replace question ${i + 1}`}
                      >
                        <Refresh size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-empty">
                Pick a skill to start building your worksheet.
              </div>
            )}

            <div className="mb-acts">
              <button className="mb-go" disabled={!ready || downloading} onClick={downloadPdf}>
                {downloading ? "Preparing…" : "Download PDF"}
              </button>
              <button className="mb-alt" disabled={!ready} onClick={() => window.print()}>
                Print
              </button>
            </div>
          </div>
        </div>

        <div className="mb-dock">
          <div className="mb-dock-info">
            {ready ? `${sheet.length} questions` : "No skills yet"}
            <br />
            {ready ? (grade === 0 ? "Kindergarten" : `Grade ${grade}`) : "Pick one above"}
          </div>
          <button
            className="mb-go"
            style={{ flex: 1 }}
            disabled={!ready || downloading}
            onClick={downloadPdf}
          >
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
