import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

type User = { id: string; name: string };
type Chore = { id: string; title: string };
type Completion = {
  id: string;
  completedAt: string;
  user: User;
  chore: Chore;
};

export function LogCompletionPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [userId, setUserId] = useState("");
  const [choreId, setChoreId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // load user + chores + today's completions

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const [u, c, comps] = await Promise.all([
          api<User[]>("/users"),
          api<Chore[]>("/chores?active=true"),
          api<Completion[]>(
            `/completions?date=${new Date().toISOString().slice(0, 10)}`,
          ),
        ]);

        if (!cancelled) {
          setUsers(u);
          setChores(c);
          setCompletions(comps);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logCompletion() {
    if (!userId || !choreId) {
      setError("Select both a user and a chore.");
      return;
    }

    try {
      setError(null);
      const newCompletion = await api<Completion>("/completions", {
        method: "POST",
        body: JSON.stringify({ userId, choreId }),
      });

      setCompletions((prev) => [...prev, newCompletion]);
      setChoreId("");
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <h1>Log Chore Completions</h1>

      {error && (
        <div style={{ border: "1px solid", padding: 8, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Select user</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <select value={choreId} onChange={(e) => setChoreId(e.target.value)}>
          <option value="">Select Chore</option>
          {chores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <button onClick={logCompletion}>Log</button>
      </div>

      <h2>Today</h2>
      <ul>
        {completions.map((c) => (
          <li key={c.id}>
            {c.user.name} - {c.chore.title}
          </li>
        ))}
        {completions.length === 0 && <li>No completions yet.</li>}
      </ul>
    </div>
  );
}
