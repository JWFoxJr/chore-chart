import { useEffect, useState } from "react";

type MissingChore = {
  id: string;
  title: string;
  lastCompletedAt: string | null;
};

type MissingChoresResponse = {
  days: number;
  rangeStart: string;
  rangeEnd: string;
  timeZone: string;
  chores: MissingChore[];
};

function formatLastCompleted(value: string | null, timeZone: string) {
  if (value === null) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function MissingChoresPage() {
  const [days, setDays] = useState("7");
  const [report, setReport] = useState<MissingChoresResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setError("");
      setReport(null);

      try {
        const query = new URLSearchParams({ days });
        const response = await fetch(
          "http://localhost:8787/reports/missing-chores?" + query,
        );

        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          let message = "Missing chores request failed";

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

        const data = (await response.json()) as MissingChoresResponse;

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
  }, [days]);

  return (
    <section>
      <h1>Missing Chores</h1>
      <p>Active chores with no completions in the selected number of days.</p>
      <label>
        Lookback (days){" "}
        <input
          type="number"
          min="1"
          step="1"
          value={days}
          onChange={(event) => setDays(event.target.value)}
          style={{ width: 96 }}
        />
      </label>
      {loading && <p>Loading missing chores...</p>}
      {error && <p role="alert">{error}</p>}
      {report && <p>{report.chores.length} missing chores found.</p>}

      {report && (
        <table style={{ marginTop: 16 }}>
          <caption>Last completed dates ({report.timeZone})</caption>
          <thead>
            <tr>
              <th scope="col">Chore</th>
              <th scope="col">Last completed</th>
            </tr>
          </thead>
          <tbody>
            {report.chores.map((chore) => (
              <tr key={chore.id}>
                <td>{chore.title}</td>
                <td>
                  {formatLastCompleted(chore.lastCompletedAt, report.timeZone)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
