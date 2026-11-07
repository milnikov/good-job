import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { DossierPage } from "./pages/DossierPage";
import { ScreenerPage } from "./pages/ScreenerPage";
import { WatchlistPage } from "./pages/WatchlistPage";

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<ScreenerPage />} />
        <Route path="/companies/:slug" element={<DossierPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
