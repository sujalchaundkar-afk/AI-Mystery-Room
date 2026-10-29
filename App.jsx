import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Create from "./pages/Create.jsx";
import Investigation from "./pages/Investigation.jsx";
import Accusation from "./pages/Accusation.jsx";
import Results from "./pages/Results.jsx";
import { SearchIcon } from "./components.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-ink/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl text-tag">
            <span className="text-string"><SearchIcon /></span>
            AI Mystery Room
          </Link>
          <Link to="/create" className="text-sm border border-line rounded-md px-3 py-1.5 text-muted hover:text-tag hover:border-tag transition">
            New mystery
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/case/:id" element={<Investigation />} />
          <Route path="/case/:id/accuse" element={<Accusation />} />
          <Route path="/case/:id/result" element={<Results />} />
          <Route
            path="*"
            element={
              <div>
                <h1 className="font-display text-3xl mb-3">This page isn't in the file</h1>
                <Link to="/" className="text-tag underline">Back to the start</Link>
              </div>
            }
          />
        </Routes>
      </main>

      <footer className="border-t border-line text-center text-xs text-muted py-4">
        Mysteries are written by Gemini. Any resemblance to real people is coincidence.
      </footer>
    </div>
  );
}
