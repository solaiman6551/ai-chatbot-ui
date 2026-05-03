// src/components/SearchActivity.jsx
// Drop this into your React frontend.
// Usage: <SearchActivity toolsUsed={toolsUsed} />
// Where toolsUsed comes from the /chat API response.

import React, { useState } from "react";

export default function SearchActivity({ toolsUsed = [] }) {
  const [expanded, setExpanded] = useState(false);

  const searches = toolsUsed.filter((t) => t.tool === "web_search");
  if (searches.length === 0) return null;

  return (
    <div className="search-activity">
      <button
        className="search-activity-toggle"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="search-icon">🔍</span>
        <span>
          Rex searched {searches.length === 1 ? "the web" : `${searches.length} queries`}
        </span>
        <span className="chevron">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="search-results-panel">
          {searches.map((s, i) => (
            <div key={i} className="search-query-block">
              <div className="search-query-label">
                <span className="search-q-num">Query {i + 1}</span>
                <code className="search-query-text">{s.query}</code>
              </div>

              {s.result?.success && s.result.results?.length > 0 ? (
                <ul className="search-result-list">
                  {s.result.results.map((r, j) => (
                    <li key={j} className="search-result-item">
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        {r.title}
                      </a>
                      {r.description && (
                        <p className="search-result-desc">{r.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="search-error">
                  {s.result?.error || "No results found"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}