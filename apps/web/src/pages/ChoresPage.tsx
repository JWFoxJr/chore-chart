import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

type Chore = {
  id: string;
  title: string;
  points: number;
  active: boolean;
  createdAt: string;
};

export function ChoresPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setError(null);
        const data = await api<Chore[]>("/chores");
        if (!cancelled) {
          setChores(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  async function addChore(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const newChore = await api<Chore>("/chores", {
      method: "POST",
      body: JSON.stringify({ title, points }),
    });

    setChores((prev) => [...prev, newChore]);
    setTitle("");
    setPoints(1);
  }

  async function toggleActive(chore: Chore) {
    setError(null);
    const updated = await api<Chore>(`/chores/${chore.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !chore.active }),
    });

    setChores((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function updatePoints(chore: Chore, newPoints: number) {
    setError(null);
    const updated = await api<Chore>(`/chores/${chore.id}`, {
      method: "PATCH",
      body: JSON.stringify({ points: newPoints }),
    });

    setChores((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  return (
    <div style={{ maxWidth: 800, margin: "0, auto", padding: 16 }}>
      <h1>Chores</h1>

      {error && (
        <div style={{ padding: 12, border: "1px solid", marginBottom: 12 }}>
          {error}
        </div>
      )}

      <form
        onSubmit={addChore}
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chore title"
          style={{ flex: 1 }}
        />
        <input
          type="number"
          min={1}
          step={1}
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          style={{ width: 120 }}
        />
        <button type="submit">Add</button>
      </form>

      <table
        width="100%"
        cellPadding={8}
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th align="left">Title</th>
            <th align="left">Points</th>
            <th align="left">Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {chores.map((c) => (
            <tr key={c.id} style={{ opacity: c.active ? 1 : 0.5 }}>
              <td>{c.title}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={c.points}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isInteger(v) && v > 0 && v !== c.points) {
                      updatePoints(c, v).catch((err) => setError(String(err)));
                    }
                  }}
                  style={{ width: 80 }}
                />
              </td>
              <td>{c.active ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => toggleActive(c)}>
                  {c.active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
          {chores.length === 0 && (
            <tr>
              <td colSpan={4}>No chores yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
