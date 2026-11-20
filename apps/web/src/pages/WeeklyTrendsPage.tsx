import { useEffect, useState } from "react";

const ranges = ["1W", "1M", "3M", "6M", "12M", "ALL"];

type TrendWeek = {
  weekStart: string;
  value: number;
};

type TrendsResponse = {
  interval: string;
  metric: string;
  range: string;
  timeZone: string;
  weekStart: string;
  rangeStart: string;
  weeks: TrendWeek[];
};

function formatWeek(value: string, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return formatter.format(new Date(value));
}

export default function WeeklyTrendsPage() {
  const [metric, setMetric] = useState("points");
  const [range, setRange] = useState("3M");
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTrends() {
      setLoading(true);
      setError("");
      setTrends(null);

      try {
        const params = new URLSearchParams({
          interval: "week",
          metric,
          range,
        });

        const response = await fetch(
          "http://localhost:8787/reports/trends?" + params.toString(),
        );

        if (!response.ok) {
          throw new Error("Trends request failed (" + response.status + ")");
        }

        const data: TrendsResponse = await response.json();

        if (!cancelled) {
          setTrends(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load trends.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTrends();

    return () => {
      cancelled = true;
    };
  }, [metric, range]);

  let maxValue = 1;

  if (trends !== null) {
    for (const week of trends.weeks) {
      maxValue = Math.max(maxValue, week.value);
    }
  }

  return (
    <section>
      <h2>Weekly Trends</h2>
      <p>Compare points earned or chores completed each week.</p>
      <label>
        Metric{" "}
        <select
          value={metric}
          onChange={(event) => setMetric(event.currentTarget.value)}
        >
          <option value="points">Points earned</option>
          <option value="count">Chores completed</option>
        </select>
      </label>
      <div
        role="group"
        aria-label="Time range"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 16,
        }}
      >
        {ranges.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={range === option}
            onClick={() => setRange(option)}
            style={{
              border:
                range === option
                  ? "2px solid currentColor"
                  : "2px solid transparent",
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {loading && <p role="status">Loading trends...</p>}

      {error && <p role="alert"> {error}</p>}

      {trends !== null && (
        <p role="status">Loaded {trends.weeks.length} weeks.</p>
      )}

      {trends !== null && (
        <figure style={{ margin: "24px 0" }}>
          <figcaption>
            {trends.metric === "points"
              ? "Points earned per week"
              : "Chores completed per week"}
            {" — "}
            {trends.timeZone}
          </figcaption>

          <div
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              padding: "16px 0",
            }}
          >
            {trends.weeks.map((week) => (
              <div
                key={week.weekStart}
                style={{
                  flex: "0 0 112px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    height: 200,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    borderBottom: "1px solid currentColor",
                  }}
                >
                  <span>{week.value}</span>

                  <div
                    aria-hidden="true"
                    style={{
                      height: (week.value / maxValue) * 160,
                      width: 40,
                      background: "#646cff",
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                </div>

                <div style={{ fontSize: 12, marginTop: 8 }}>
                  {formatWeek(week.weekStart, trends.timeZone)}
                </div>
              </div>
            ))}
          </div>
        </figure>
      )}
    </section>
  );
}
