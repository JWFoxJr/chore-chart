import React, { useEffect, useMemo, useState } from "react";

type SummaryDay = { date: string; count: number };
type SummaryResponse = { from: string; to: string; days: SummaryDay[] };

// Matches your API router paths
const API_BASE = "http://localhost:8787";

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
// Sunday-start grid
function startOfCalendarGrid(month: Date) {
  const first = startOfMonth(month);
  const dow = first.getDay(); // 0=Sun
  return addDays(first, -dow);
}
function endOfCalendarGrid(month: Date) {
  const last = endOfMonth(month);
  const dow = last.getDay(); // 6=Sat
  return addDays(last, 6 - dow);
}
function monthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

type Completion = {
  id: string;
  completedAt: string;
  user: { id: string; name: string };
  chore: { id: string; title: string; pointValue: number };
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function CalendarMonthView() {
  const [month, setMonth] = useState(() => new Date());

  const [countsByDate, setCountsByDate] = useState<Record<string, number>>({});
  const [maxCount, setMaxCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);
  const [dayCompletions, setDayCompletions] = useState<Completion[]>([]);

  const gridStart = useMemo(() => startOfCalendarGrid(month), [month]);
  const gridEnd = useMemo(() => endOfCalendarGrid(month), [month]);

  const days = useMemo(() => {
    const out: Date[] = [];
    for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
      out.push(new Date(d));
    }
    return out;
  }, [gridStart, gridEnd]);

  useEffect(() => {
    const from = toYMD(gridStart);
    const to = toYMD(gridEnd);

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/completions/summary?from=${encodeURIComponent(
          from,
        )}&to=${encodeURIComponent(to)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(await res.text());

        const data = (await res.json()) as SummaryResponse;

        const map: Record<string, number> = {};
        let max = 0;

        for (const day of data.days) {
          map[day.date] = day.count;
          if (day.count > max) max = day.count;
        }

        if (!cancelled) {
          setCountsByDate(map);
          setMaxCount(max);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load summary");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [gridStart, gridEnd]);

  const todayKey = toYMD(new Date());

  function goPrev() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }
  function goNext() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }
  function goToday() {
    setMonth(new Date());
  }

  async function openDay(dateKey: string) {
    setSelectedDate(dateKey);
    setDayLoading(true);
    setDayError(null);
    setDayCompletions([]);

    try {
      const url = `${API_BASE}/completions?date=${encodeURIComponent(dateKey)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Completion[];
      setDayCompletions(data);
    } catch (e: any) {
      setDayError(e?.message ?? "Failed to load day details");
    } finally {
      setDayLoading(false);
    }
  }

  function closeDay() {
    setSelectedDate(null);
    setDayCompletions([]);
    setDayError(null);
    setDayLoading(false);
  }

  const dowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Heatmap intensity: 0..1 based on max visible count
  function heatAlpha(count: number) {
    if (count <= 0 || maxCount <= 0) return 0;
    const t = count / maxCount; // 0..1
    // Keep it subtle and readable
    return clamp(0.1 + 0.35 * t, 0.1, 0.45);
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{monthLabel(month)}</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={goPrev}>Prev</button>
          <button onClick={goToday}>Today</button>
          <button onClick={goNext}>Next</button>
        </div>
      </div>

      <div style={{ marginTop: 8, minHeight: 24 }}>
        {loading ? <span>Loading…</span> : null}
        {error ? <span style={{ color: "crimson" }}>{error}</span> : null}
        {!loading && !error ? (
          <span style={{ opacity: 0.6, marginLeft: 8 }}>
            Max/day this view: {maxCount || 0}
          </span>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 8,
          marginTop: 8,
        }}
      >
        {dowLabels.map((d) => (
          <div key={d} style={{ fontWeight: 600, opacity: 0.8 }}>
            {d}
          </div>
        ))}

        {days.map((d) => {
          const key = toYMD(d);
          const inMonth = d.getMonth() === month.getMonth();
          const isToday = key === todayKey;
          const count = countsByDate[key] ?? 0;

          const alpha = heatAlpha(count);

          return (
            <button
              key={key}
              onClick={() => openDay(key)}
              style={{
                textAlign: "left",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 10,
                minHeight: 92,
                cursor: "pointer",
                opacity: inMonth ? 1 : 0.45,
                outline: isToday ? "2px solid rgba(255,255,255,0.35)" : "none",
                background: `rgba(255,255,255,${alpha})`,
              }}
              title="Click for details"
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ fontWeight: 800 }}>{d.getDate()}</div>

                {count > 0 ? (
                  <span
                    style={{
                      marginLeft: "auto",
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(0,0,0,0.25)",
                      background: "rgba(0,0,0,0.20)",
                      fontSize: 12,
                    }}
                    title={`${count} completion${count === 1 ? "" : "s"}`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                ) : (
                  <span style={{ marginLeft: "auto" }} />
                )}
              </div>

              <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
                {count > 0 ? "Activity" : "No activity"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {selectedDate ? (
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            // click outside to close
            if (e.target === e.currentTarget) closeDay();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "min(900px, 100%)",
              maxHeight: "80vh",
              overflow: "auto",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(25,25,25,0.98)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Details: {selectedDate}</h3>
              <button onClick={closeDay} style={{ marginLeft: "auto" }}>
                Close
              </button>
            </div>

            <div style={{ marginTop: 10, minHeight: 24 }}>
              {dayLoading ? <span>Loading…</span> : null}
              {dayError ? (
                <span style={{ color: "crimson" }}>{dayError}</span>
              ) : null}
            </div>

            {!dayLoading && !dayError ? (
              <>
                <div style={{ opacity: 0.7, marginTop: 4 }}>
                  {dayCompletions.length} completion
                  {dayCompletions.length === 1 ? "" : "s"}
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {dayCompletions.map((c) => {
                    const t = new Date(c.completedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div
                        key={c.id}
                        style={{
                          border: "1px solid rgba(255,255,255,0.10)",
                          borderRadius: 12,
                          padding: 12,
                          display: "grid",
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "baseline",
                          }}
                        >
                          <div style={{ fontWeight: 800 }}>{c.chore.title}</div>
                          <div style={{ opacity: 0.7, fontSize: 13 }}>
                            {c.chore.pointValue} pts
                          </div>
                          <div
                            style={{
                              marginLeft: "auto",
                              opacity: 0.7,
                              fontSize: 13,
                            }}
                          >
                            {t}
                          </div>
                        </div>
                        <div style={{ opacity: 0.75, fontSize: 13 }}>
                          Completed by <strong>{c.user.name}</strong>
                        </div>
                      </div>
                    );
                  })}

                  {dayCompletions.length === 0 ? (
                    <div style={{ opacity: 0.8, padding: 12 }}>
                      No completions recorded on this day.
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
