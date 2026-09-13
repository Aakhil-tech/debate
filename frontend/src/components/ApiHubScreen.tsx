import React, { useState, useEffect } from 'react';
import { fetchApiEndpoints, testRawEndpoint, testWebhookEndpoint } from '../services/api';

interface ApiHubScreenProps {
  showToast: (msg: string) => void;
  onNavigateToReceipts?: () => void;
}

interface EndpointDoc {
  path: string;
  method: 'GET' | 'POST';
  category: string;
  description: string;
  requestBody?: Record<string, any>;
  responseSample: Record<string, any>;
}

export const ApiHubScreen: React.FC<ApiHubScreenProps> = ({ showToast, onNavigateToReceipts }) => {
  const [endpoints, setEndpoints] = useState<EndpointDoc[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDoc | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [requestPayloadText, setRequestPayloadText] = useState<string>('{}');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<number | null>(null);
  const [testElapsed, setTestElapsed] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'javascript' | 'python'>('curl');

  // Webhook tester state
  const [webhookUrl, setWebhookUrl] = useState<string>('https://httpbin.org/post');
  const [webhookEvent, setWebhookEvent] = useState<string>('case.created');
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const [webhookTesting, setWebhookTesting] = useState<boolean>(false);

  useEffect(() => {
    async function loadDocs() {
      try {
        const data = await fetchApiEndpoints();
        if (data && data.endpoints) {
          setEndpoints(data.endpoints);
          setSelectedEndpoint(data.endpoints[0]);
          setRequestPayloadText(JSON.stringify(data.endpoints[0].requestBody || {}, null, 2));
        }
      } catch (err) {
        console.warn('Could not load endpoint schema, using fallback catalog');
      }
    }
    loadDocs();
  }, []);

  const handleSelectEndpoint = (ep: EndpointDoc) => {
    setSelectedEndpoint(ep);
    setRequestPayloadText(JSON.stringify(ep.requestBody || {}, null, 2));
    setTestResponse(null);
    setTestStatus(null);
    setTestElapsed(null);
  };

  const handleRunTest = async () => {
    if (!selectedEndpoint) return;
    setIsLoading(true);
    setTestResponse(null);
    setTestStatus(null);
    try {
      let parsedBody: any = null;
      if (selectedEndpoint.method === 'POST') {
        try {
          parsedBody = JSON.parse(requestPayloadText);
        } catch {
          showToast('Invalid JSON in request body');
          setIsLoading(false);
          return;
        }
      }
      const result = await testRawEndpoint(selectedEndpoint.path, selectedEndpoint.method, parsedBody);
      setTestStatus(result.status);
      setTestResponse(result.data);
      setTestElapsed(result.elapsedMs);
      showToast(`API Response: HTTP ${result.status} (${result.elapsedMs}ms)`);
    } catch (err: any) {
      setTestStatus(500);
      setTestResponse({ error: err.message || 'API Execution failed' });
      showToast('API execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      showToast('Please enter a destination webhook URL');
      return;
    }
    setWebhookTesting(true);
    setWebhookResult(null);
    try {
      const res = await testWebhookEndpoint({
        webhookUrl: webhookUrl.trim(),
        event: webhookEvent,
        payload: {
          caseId: 'case-9941',
          title: 'Arbitration Ruling Alert',
          winner: 'user',
          cloutPoints: 25,
          timestamp: new Date().toISOString()
        }
      });
      setWebhookResult(res);
      showToast('Webhook dispatch simulated!');
    } catch (err: any) {
      setWebhookResult({ error: err.message || 'Webhook failed' });
      showToast('Webhook simulation error');
    } finally {
      setWebhookTesting(false);
    }
  };

  const generateSnippet = (ep: EndpointDoc | null, tab: 'curl' | 'javascript' | 'python'): string => {
    if (!ep) return '';
    const bodyStr = requestPayloadText.trim();

    if (tab === 'curl') {
      if (ep.method === 'GET') {
        return `curl -X GET "https://your-host.com${ep.path}" \\
  -H "Accept: application/json"`;
      }
      return `curl -X POST "https://your-host.com${ep.path}" \\
  -H "Content-Type: application/json" \\
  -d '${bodyStr.replace(/'/g, "'\\''")}'`;
    }

    if (tab === 'javascript') {
      if (ep.method === 'GET') {
        return `const res = await fetch("${ep.path}");
const data = await res.json();
console.log(data);`;
      }
      return `const res = await fetch("${ep.path}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${bodyStr})
});
const data = await res.json();
console.log(data);`;
    }

    if (tab === 'python') {
      if (ep.method === 'GET') {
        return `import requests

resp = requests.get("https://your-host.com${ep.path}")
data = resp.json()
print(data)`;
      }
      return `import requests

payload = ${bodyStr}
resp = requests.post(
    "https://your-host.com${ep.path}",
    json=payload
)
data = resp.json()
print(data)`;
    }

    return '';
  };

  const copyCode = (text: string) => {
    navigator.clipboard?.writeText(text);
    showToast('Code snippet copied to clipboard! 📋');
  };

  const categories = ['All', ...Array.from(new Set(endpoints.map((e) => e.category)))];
  const filteredEndpoints =
    selectedCategory === 'All'
      ? endpoints
      : endpoints.filter((e) => e.category === selectedCategory);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-36 flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface-container-lowest border border-black/10 shadow-[2px_2px_0px_#000000]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm font-bold uppercase tracking-wider">
              Developer Hub &amp; Integrations
            </span>
            <span className="flex items-center gap-1 text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Core Proof-Engine v3.0 Online
            </span>
          </div>
          <h1 className="text-headline-md sm:text-headline-lg font-headline-md font-bold tracking-tight text-on-surface">
            REST API &amp; Multimodal OCR Services
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-3xl">
            Integrate Debate &amp; Win conversational intelligence directly into external apps, Discord bots, Slack automations, Zapier workflows, or custom mobile clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToReceipts && (
            <button
              onClick={onNavigateToReceipts}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md uppercase font-semibold border border-black/10 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              Open OCR Studio
            </button>
          )}
          <button
            onClick={() => {
              const spec = JSON.stringify({ version: '3.0.0', endpoints }, null, 2);
              const blob = new Blob([spec], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'debate-and-win-api-spec.json';
              a.click();
              showToast('API Specification downloaded! 💾');
            }}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md uppercase font-semibold shadow-[2px_2px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[0px] active:translate-y-[0px] transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export OpenAPI JSON
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap uppercase font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-on-surface text-surface shadow-[2px_2px_0px_rgba(0,0,0,0.4)]'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-black/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Catalog, Right Interactive Test Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoint List */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
              Available API Endpoints ({filteredEndpoints.length})
            </span>
            <span className="text-xs font-mono text-on-surface-variant/80">Base: /api/*</span>
          </div>

          <div className="flex flex-col gap-2">
            {filteredEndpoints.map((ep) => {
              const isSelected = selectedEndpoint?.path === ep.path;
              return (
                <button
                  key={`${ep.method}-${ep.path}`}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`text-left p-4 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-surface-container-lowest border-primary shadow-[2px_2px_0px_#000000]'
                      : 'bg-surface-container-lowest/60 hover:bg-surface-container-lowest border-black/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                          ep.method === 'POST'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono text-sm font-semibold text-on-surface">
                        {ep.path}
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                      {ep.category}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {ep.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Webhook Dispatcher Card */}
          <div className="mt-4 p-5 rounded-2xl bg-surface-container-lowest border border-black/10 shadow-[2px_2px_0px_#000000] flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">webhook</span>
              <h2 className="font-title-md text-title-md font-bold text-on-surface">
                Outbound Webhook Tester
              </h2>
            </div>
            <p className="text-xs text-on-surface-variant">
              Forward live forensic dispute outcomes to third-party endpoints (Zapier, Slack incoming webhooks, or custom servers).
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono font-bold uppercase text-on-surface-variant">
                Destination Webhook URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-surface-container-low border border-black/15 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono font-bold uppercase text-on-surface-variant">
                Dispute Event Type
              </label>
              <select
                value={webhookEvent}
                onChange={(e) => setWebhookEvent(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-black/15 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              >
                <option value="case.created">case.created (Receipt Autopsy Complete)</option>
                <option value="fumble.detected">fumble.detected (High Dignity Deficit Alert)</option>
                <option value="ruling.rendered">ruling.rendered (Official Arbitration Decision)</option>
                <option value="stance.calibrated">stance.calibrated (Tactical War Room Stance)</option>
              </select>
            </div>

            <button
              onClick={handleTestWebhook}
              disabled={webhookTesting}
              className="w-full py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-container/90 text-on-secondary-fixed font-label-md text-label-md uppercase font-bold border border-black/15 transition-all flex items-center justify-center gap-2"
            >
              {webhookTesting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                  Dispatching Payload...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Simulate Webhook Dispatch
                </>
              )}
            </button>

            {webhookResult && (
              <div className="mt-2 p-3 rounded-xl bg-surface-container-low border border-black/10 text-xs font-mono overflow-x-auto max-h-40">
                <pre>{JSON.stringify(webhookResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Testing Playground & Code Generators */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {selectedEndpoint ? (
            <div className="flex flex-col gap-5 p-6 rounded-2xl bg-surface-container-lowest border border-black/10 shadow-[2px_2px_0px_#000000]">
              {/* Endpoint Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-black/10">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-3 py-1 rounded-md font-mono text-xs font-bold ${
                      selectedEndpoint.method === 'POST'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-base font-bold text-on-surface">
                    {selectedEndpoint.path}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed font-semibold">
                    {selectedEndpoint.category}
                  </span>
                </div>
              </div>

              <p className="text-sm text-on-surface-variant">
                {selectedEndpoint.description}
              </p>

              {/* Code Generator Tab Strip */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
                    <button
                      onClick={() => setActiveCodeTab('curl')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        activeCodeTab === 'curl'
                          ? 'bg-surface-container-lowest text-on-surface shadow-[1px_1px_0px_#000000]'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setActiveCodeTab('javascript')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        activeCodeTab === 'javascript'
                          ? 'bg-surface-container-lowest text-on-surface shadow-[1px_1px_0px_#000000]'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Fetch (JS / TS)
                    </button>
                    <button
                      onClick={() => setActiveCodeTab('python')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        activeCodeTab === 'python'
                          ? 'bg-surface-container-lowest text-on-surface shadow-[1px_1px_0px_#000000]'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Python
                    </button>
                  </div>

                  <button
                    onClick={() => copyCode(generateSnippet(selectedEndpoint, activeCodeTab))}
                    className="text-xs font-label-md uppercase font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    Copy Code
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs overflow-x-auto max-h-48 border border-black/20">
                  <pre>{generateSnippet(selectedEndpoint, activeCodeTab)}</pre>
                </div>
              </div>

              {/* Interactive Request Editor */}
              {selectedEndpoint.method === 'POST' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">tune</span>
                      JSON Request Body (Editable Payload)
                    </label>
                    <button
                      onClick={() =>
                        setRequestPayloadText(
                          JSON.stringify(selectedEndpoint.requestBody || {}, null, 2)
                        )
                      }
                      className="text-xs text-on-surface-variant hover:text-on-surface underline font-mono"
                    >
                      Reset to Sample
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={requestPayloadText}
                    onChange={(e) => setRequestPayloadText(e.target.value)}
                    className="w-full p-3 font-mono text-xs bg-surface-container-low rounded-xl border border-black/15 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* Action Runner Button */}
              <button
                onClick={handleRunTest}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md uppercase font-bold shadow-[2px_2px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[0px] active:translate-y-[0px] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                    Executing Request...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                    Send Request to Live Endpoint
                  </>
                )}
              </button>

              {/* Live Test Response Panel */}
              {testResponse && (
                <div className="flex flex-col gap-2 pt-2 border-t border-black/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant">
                        Live Response
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                          testStatus && testStatus < 300
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        HTTP {testStatus}
                      </span>
                      {testElapsed !== null && (
                        <span className="text-xs font-mono text-on-surface-variant">
                          {testElapsed}ms latency
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => copyCode(JSON.stringify(testResponse, null, 2))}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      Copy JSON
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-[#1e1e1e] text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 border border-black/20">
                    <pre>{JSON.stringify(testResponse, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-on-surface-variant">
              Select an endpoint from the left column to view documentation and run live requests.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
