import { useState } from "react";

type PointsReportRow = {
  userId: string;
  name: string;
  lifetimePoints: number;
  rangePoints: number;
};

export default function PointsReportPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [report, setReport] = useState<PointsReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  async function loadReport() {
    setLoading(true);
    setError("");
    setReport([]);
    setHasLoaded(false);

    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
      });

      const response = await fetch(
        "http://localhost:8787/reports/points?" + params.toString(),
      );

      if (!response.ok) {
        let message = "Report request failed (" + response.status + ").";

        const errorBody: unknown = await response.json().catch(() => null);

        if (
          typeof errorBody === "object" &&
          errorBody !== null &&
          "error" in errorBody &&
          typeof errorBody.error === "string" &&
          errorBody.error !== ""
        ) {
          message = errorBody.error;
        }

        throw new Error(message);
      }

      const data: PointsReportRow[] = await response.json();

      setReport(data);
      setHasLoaded(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to load the report.");
      }
    } finally {
      setLoading(false);
    }
  }

  let statusMessage = "Choose dates and select Load report.";

  if (loading) {
    statusMessage = "Loading report...";
  } else if (error) {
    statusMessage = "Report could not be loaded.";
  } else if (hasLoaded) {
    if (report.length == 0) {
      statusMessage = "No users to report.";
    } else {
      statusMessage = "Report loaded.";
    }
  }

  return (
    <section style={{ maxWidth: 1100 }} aria-labelledby="points-report-heading">
      <h2 id="points-report-heading">Points Report</h2>
      <p>
        Compare lifetime points with points earned within a selected date range.
      </p>

      <fieldset
        disabled={loading}
        aria-describedby="points-report-status"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 12,
        }}
      >
        <legend>Date range</legend>
        <label style={{ display: "grid", gap: 4 }}>
          From
          <input
            type="date"
            name="from"
            value={fromDate}
            onChange={(event) => setFromDate(event.currentTarget.value)}
          />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          To
          <input
            type="date"
            name="to"
            value={toDate}
            onChange={(event) => setToDate(event.currentTarget.value)}
          />
        </label>
        <button
          type="button"
          onClick={loadReport}
          disabled={!fromDate || !toDate}
        >
          Load report
        </button>
      </fieldset>

      <p id="points-report-status" role="status">
        {statusMessage}
      </p>
      {error && <p role="alert">{error}</p>}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            textAlign: "left",
            borderCollapse: "collapse",
          }}
        >
          <caption style={{ textAlign: "left", paddingBottom: 12 }}>
            Points earned per user
          </caption>
          <thead>
            <tr>
              <th scope="col" style={{ padding: 12 }}>
                User
              </th>
              <th scope="col" style={{ padding: 12 }}>
                Lifetime points
              </th>
              <th scope="col" style={{ padding: 12 }}>
                Points in selected range
              </th>
            </tr>
          </thead>
          <tbody>
            {report.map((row) => (
              <tr key={row.userId}>
                <td style={{ padding: 12 }}>{row.name}</td>
                <td style={{ padding: 12 }}>{row.lifetimePoints}</td>
                <td style={{ padding: 12 }}>{row.rangePoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
