import { NavLink, Outlet } from "react-router-dom";

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: "block",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: "inherit",
  background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
});

export default function Layout() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateRows: "56px 1fr",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>Chores Chart</div>
        <div style={{ marginLeft: "auto", opacity: 0.75, fontSize: 13 }}>
          Calendar & Visibility
        </div>
      </header>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr" }}>
        <aside
          style={{
            borderRight: "1px solid rgba(255,255,255,0.08)",
            padding: 12,
          }}
        >
          <nav style={{ display: "grid", gap: 8 }}>
            <NavLink to="/" style={linkStyle} end>
              Home
            </NavLink>
            <NavLink to="/calendar" style={linkStyle}>
              Calendar
            </NavLink>
          </nav>
        </aside>

        <main style={{ padding: 16 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
