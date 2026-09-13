import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { DataContext, loadData, type Data } from "./data/load";
import Search from "./components/Search";
import Home from "./pages/Home";
import Course from "./pages/Course";
import Unit from "./pages/Unit";
import Concept from "./pages/Concept";
import Roadmap from "./pages/Roadmap";
import Explore from "./pages/Explore";
import Analytics from "./pages/Analytics";

export default function App() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData().then(setData).catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="loading">Could not load data: {error}</div>;
  if (!data) return <div className="loading">Loading…</div>;

  return (
    <DataContext.Provider value={data}>
      <div className="shell">
        <header className="topbar">
          <NavLink to="/" className="brand">Study Hub</NavLink>
          <nav>
            <NavLink to="/" end>Program</NavLink>
            <NavLink to="/concepts">Concepts</NavLink>
            <NavLink to="/roadmap">Roadmap</NavLink>
            <NavLink to="/explore">Explore</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
          </nav>
          <div className="spacer" />
          <Search />
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/course/:code" element={<Course />} />
            <Route path="/unit/:code/:slug" element={<Unit />} />
            <Route path="/concepts" element={<Concept />} />
            <Route path="/concept/:slug" element={<Concept />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/skill/:slug" element={<Roadmap />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<p>Not found.</p>} />
          </Routes>
        </main>
      </div>
    </DataContext.Provider>
  );
}
