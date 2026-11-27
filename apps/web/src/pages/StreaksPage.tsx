import { useEffect, useState } from "react";

type UserStreak = {
  userId: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
};

type StreaksResponse = {
  interval: string;
  timeZone: string;
  users: UserStreak[];
};

export default function StreaksPage() {
  const [interval, setStreakInterval] = useState("day");
  const [report, setReport] = useState<StreaksResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setError("");
      setReport(null);

      try {
        const query = new URLSearchParams({ interval });
        const response = await fetch(
          "http://localhost:8787/reports/streaks?" + query,
        );

        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          let message = "Streaks request failed";

          if (
            typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof body.error === "string"
          ) {
            message = body.error;
          }

          throw new Error(message);
        }

        const data = (await response.json()) as StreaksResponse;

        if (!cancelled) {
          setReport(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Request Failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [interval]);

  let unit = "days";

  if (report?.interval === "week") {
    unit = "weeks";
  }

  return (
    <section>
      <h1>Streaks</h1>
      <p>Current and longest completion streaks for each user.</p>
      <label>
        Interval{" "}
        <select
          value={interval}
          onChange={(event) => setStreakInterval(event.target.value)}
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
        </select>
      </label>
      {loading && <p>Loading streaks...</p>}
      {error && <p role="alert">{error}</p>}
      {report && <p>{report.users.length} users loaded</p>}
      {report && (
        <table style={{ marginTop: 16 }}>
          <caption>
            Streaks in {unit} ({report.timeZone})
          </caption>
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Current Streak</th>
              <th scope="col">Longest Streak</th>
            </tr>
          </thead>
          <tbody>
            {report.users.map((user) => (
              <tr key={user.userId}>
                <td>{user.name}</td>
                <td>{user.currentStreak}</td>
                <td>{user.longestStreak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
