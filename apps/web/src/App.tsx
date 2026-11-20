import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import CalendarMonthView from "./pages/CalendarMonthView";
import PointsReportPage from "./pages/PointsReportPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<CalendarMonthView />} />
          <Route path="/reports/points" element={<PointsReportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
