import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Search, ShieldCheck, ExternalLink, Globe, Sparkles } from 'lucide-react';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export const BrowserApp: React.FC = () => {
  const [url, setUrl] = useState('edge://newtab');
  const [addressInput, setAddressInput] = useState('edge://newtab');
  const [history, setHistory] = useState<string[]>(['edge://newtab']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const navigateTo = (targetUrl: string) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, targetUrl]);
    setHistoryIndex(nextHistory.length);
    setUrl(targetUrl);
    setAddressInput(targetUrl);
    setSelectedResult(null);
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setUrl(history[idx]);
      setAddressInput(history[idx]);
      setSelectedResult(null);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setUrl(history[idx]);
      setAddressInput(history[idx]);
      setSelectedResult(null);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 600);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  const executeSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/web/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      setSearchResults(data.results || []);
      navigateTo(`https://www.bing.com/search?q=${encodeURIComponent(query)}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSelected = (item: SearchResult) => {
    setSelectedResult(item);
    setUrl(item.url);
    setAddressInput(item.url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans select-text">
      {/* Top Browser controls */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700 select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={handleGoBack}
            disabled={historyIndex === 0}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleGoForward}
            disabled={historyIndex === history.length - 1}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRefresh}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigateTo('edge://newtab')}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address Input Box */}
        <div className="flex-1 flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-lg border border-slate-700 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (addressInput.startsWith('http://') || addressInput.startsWith('https://')) {
                  navigateTo(addressInput);
                } else {
                  setSearchQuery(addressInput);
                  executeSearch();
                }
              }
            }}
            className="flex-1 bg-transparent border-none outline-none font-mono text-slate-200"
          />
        </div>
      </div>

      {/* Browser Canvas Content Area */}
      <div className="flex-1 bg-slate-950 overflow-auto">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <RotateCw className="w-8 h-8 animate-spin mb-2 text-blue-500" />
            <span className="text-xs font-mono">Connecting to remote servers...</span>
          </div>
        ) : url === 'edge://newtab' ? (
          /* Bing homepage */
          <div className="min-h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="flex items-center gap-2.5 mb-6 text-slate-100 font-semibold text-3xl select-none">
              <Globe className="w-8 h-8 text-blue-500 animate-pulse" />
              <span>Microsoft Edge</span>
              <span className="font-mono text-xs px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-white font-normal shadow">
                Co-Pilot Grounded
              </span>
            </div>

            {/* Bing search */}
            <div className="w-full max-w-xl flex items-center bg-slate-900 border border-slate-700 hover:border-slate-500 focus-within:border-blue-500 rounded-full px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-900/90 shadow-2xl transition">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search the web with Gemini-Grounded Bing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="flex-1 bg-transparent border-0 outline-none text-slate-100 text-sm py-1"
              />
              <button
                onClick={executeSearch}
                className="bg-blue-600 flex items-center gap-1 hover:bg-blue-500 text-white font-semibold text-xs rounded-full px-4.5 py-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3" /> Search
              </button>
            </div>

            {/* Default Presets */}
            <div className="grid grid-cols-4 gap-4 mt-8 w-full max-w-lg select-none">
              {[
                { name: "Wikipedia", url: "https://en.wikipedia.org", icon: "📖", snippet: "Free Online Encyclopedia" },
                { name: "Google", url: "https://www.google.com", icon: "🌐", snippet: "Simple Search Simulator" },
                { name: "Lumina AI Hub", url: "https://copilot.microsoft.com", icon: "🤖", snippet: "AI System Portal" },
                { name: "GitHub OS Project", url: "https://github.com", icon: "💻", snippet: "Build Operating Systems" }
              ].map(preset => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setSearchQuery(preset.name);
                    executeSearch();
                  }}
                  className="flex flex-col items-center justify-center p-3.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700/80 rounded-xl transition text-center group cursor-pointer"
                >
                  <span className="text-2xl mb-1.5">{preset.icon}</span>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400">{preset.name}</span>
                  <span className="text-[9px] text-slate-500 mt-0.5 leading-tight">{preset.snippet}</span>
                </button>
              ))}
            </div>
          </div>
        ) : url.startsWith('https://www.bing.com') ? (
          /* Search Results output */
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-slate-300 mb-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-400" /> Grounded Search Results
            </h2>
            <p className="text-xs text-slate-500 mb-6 flex items-center gap-1.5 font-mono">
              Searched: <strong className="text-slate-400">"{searchQuery}"</strong>
            </p>

            <div className="flex flex-col gap-5">
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSearchSelected(item)}
                    className="p-4 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-900 transition shadow"
                  >
                    <div className="text-xs text-blue-400 font-mono mb-1 truncate">{item.url}</div>
                    <h3 className="text-base font-semibold text-blue-300 hover:underline flex items-center gap-1.5">
                      {item.title} <ExternalLink className="w-3 h-3 opacity-60" />
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 lines-2 leading-relaxed">{item.snippet}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
                  <p className="text-slate-400 text-sm font-semibold">No results returned.</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">Try searching for simple topics or configure your GEMINI_API_KEY.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Rendered Single Simulated Website View */
          <div className="p-6 max-w-3xl mx-auto bg-slate-900/30 min-h-full">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 font-mono text-[10px] text-slate-500">
                <div>SECURE CONNECTION PRECISE LY</div>
                <div>RESOLVING URL: {url}</div>
              </div>

              {selectedResult ? (
                <div>
                  <h1 className="text-2xl font-bold text-slate-100 tracking-tight leading-snug">{selectedResult.title}</h1>
                  <div className="text-xs text-emerald-400 font-mono mt-1 mb-6 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Verified Host Online
                  </div>

                  <div className="prose text-sm text-slate-300 leading-relaxed space-y-4">
                    <p>{selectedResult.snippet}</p>
                    <p>
                      This simulated sandbox renders complete encyclopedic indexes dynamically. In a full, standalone build, this browser routes fully functional cross-origin proxy systems. Double-click other folders inside File Explorer, or interact with clean OS tools in your Taskbar!
                    </p>
                    <p>
                      Let's ask the **Lumina AI** (Sparkles system engine) to help you crawl data, write automation script files to folders, or load specific coordinates.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-spin" />
                  <h1 className="text-lg font-semibold text-slate-300">Resolving Simulated Target</h1>
                  <p className="text-xs text-slate-500 mt-2 font-mono">{url}</p>
                </div>
              )}

              <button
                onClick={() => navigateTo('edge://newtab')}
                className="mt-8 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs transition cursor-pointer"
              >
                Back to Bing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
