'use client';

import React, { useState } from 'react';
import axios from 'axios';

const DEFAULT_URL =
  'https://ykgsk8ggwgcs4skw8gskwsgw.blocktrend.xyz/teknix/tingmoney/wallets/dashboard/external-wallet-total-assets';

export default function Page() {
  const [url, setUrl] = useState(DEFAULT_URL);

  // prefilled tokens (replace as needed)
  const [accessToken, setAccessToken] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMywidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTc2Mjc0NDc0OSwiZXhwIjoxNzYzMzQ5NTQ5fQ.KSgL7PCk087FFllR3G7S-WJvxO8bl1sYXKLYI3LreYM'
  );
  const [proxyAccessToken, setProxyAccessToken] = useState(
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJjRFJjOXNEMHpQSHlWQ0FSMHYwSk5ZRmtoYWVSaXVrYUFOem9vbGtpZDZjIn0.eyJleHAiOjE3NjQwNDIzOTYsImlhdCI6MTc2Mjc0NjM5NiwianRpIjoib2ZydHJvOjgzOWVlNzVkLTUyODUtZTIzOC00MmIwLTQ4YTc4ODg5ZmVmNyIsImlzcyI6Imh0dHBzOi8vYy1rZXljbG9hay5ibG9ja3RyZW5kLnh5ei9yZWFsbXMvdGVrbml4LWF1dGgiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiMjAwNGMzMTAtN2E5ZS00MzQ2LWJiYjYtN2JmNDk1NTlmMzg2IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidGluZy1tb25leSIsInNpZCI6ImZmNGExYWIxLTc5NGQtNDY1Yi1hNDE0LTM5YzY1Y2UzMmY5OSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly90dW5uZWxzLnRla25peC5kZXYiLCJodHRwOi8vMTAuMS4yLjE5NDozMzMzIiwiaHR0cDovL2xvY2FsaG9zdDozMzMzIiwiaHR0cDovL2xvY2FsaG9zdDozMDAyIiwiaHR0cHM6Ly90aW5nLW1vbmV5LW9uYm9hcmQudmVyY2VsLmFwcCIsImh0dHA6Ly8xMC4xLjIuMTk0OjMwMDAiLCJodHRwczovL3RpbmctaG9tZS1mZS52ZXJjZWwuYXBwIiwiaHR0cDovL2xvY2FsaG9zdDozMDAxIiwiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwiaHR0cHM6Ly90aW5nLWFwcC52ZXJjZWwuYXBwIiwiaHR0cDovLzEwLjEuMi4xNTk6MzAwMCIsImh0dHBzOi8vdGluZy1tb25leS1wcmVzYWxlLnZlcmNlbC5hcHAiLCJodHRwczovL3RpbmctdG9uZy52ZXJjZWwuYXBwIiwiaHR0cHM6Ly9reWMtcmhvLXNldmVuLnZlcmNlbC5hcHAiLCJodHRwczovL3Rpbmctb3ZlcnZpZXcudmVyY2VsLmFwcCIsImh0dHBzOi8vY3R1LXdhbGxldC52ZXJjZWwuYXBwIiwiaHR0cHM6Ly9vdmV3dmlldy52ZXJjZWwuYXBwIiwiaHR0cDovLzEwLjEuMi41NDozMDAwIiwiaHR0cHM6Ly9oYXBpLWZlLnZlcmNlbC5hcHAiLCJ0aW5nLm1vbmV5LmFwcDovL2xvZ2luLWNhbGxiYWNrIiwiaHR0cHM6Ly80MmFjYTAyODE2ZWEubmdyb2stZnJlZS5hcHAiLCJodHRwczovL215Y3R1LnRla25peC5kZXYiLCJodHRwczovL3RpbmctYXBwLWZlLXN0Zy5ibG9ja3RyZW5kLnh5eiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLXRla25peC1hdXRoIiwidW1hX2F1dGhzI11dfQ.YEoT0ZpkAn6Ui8tw5zT1NPkEgg5ZzFj-X8GXKcB_tptAlyEyoy88yi2YdsW3CB1pW79XrMatBFFTvsMqoXowZ_Hb9a0Bwbv5tfj-Id9zXfMWXvL6xuvH-xMEwYMjvtDaJjgIIcY5tWc--v7QGaA_fVPq7L1dO3af9YEi7NMFHsUoOOZlS58UdPcjyIDA0nQ_ygYhZ-q2eSSBirLPfH0QmzLzFFRAuKC-YckY7KAQm7mmXmI14V_LSD5CxbqsYjvEyuoqyvTUSYlrwz3UTUmBvAJCJ0nvJBU_AV9GHb574eqU4qyzwNTEUi0hfbD006gCHPA3pcaMlpkhm5-C51tL6g'
  );

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const doRequest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // switched to X-Proxy-Authorization as requested
          'X-Proxy-Authorization': `Bearer ${proxyAccessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      setResult({
        status: response.status,
        headers: response.headers,
        data: response.data,
      });
    } catch (err: any) {
      if (err.response) {
        setError(
          `Request failed - status ${err.response.status}: ${JSON.stringify(
            err.response.data
          )}`
        );
      } else if (err.request) {
        setError('No response received (possible CORS or network error). See console for details.');
        console.error('No response error details:', err.request);
      } else {
        setError('Request setup error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = () => {
    const curl = [
      'curl -v',
      `-H "Authorization: Bearer ${accessToken}"`,
      `-H "X-Proxy-Authorization: Bearer ${proxyAccessToken}"`,
      `-H "Content-Type: application/json"`,
      `"${url}"`,
    ].join(' \\\n  ');
    void navigator.clipboard?.writeText(curl);
    alert('cURL copied to clipboard');
  };

  return (
    <main style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Test endpoint (uses X-Proxy-Authorization)</h1>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>ACCESS_TOKEN (Authorization)</label>
        <textarea
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: 8, fontFamily: 'monospace' }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>
          PROXY_ACCESS_TOKEN (X-Proxy-Authorization)
        </label>
        <textarea
          value={proxyAccessToken}
          onChange={(e) => setProxyAccessToken(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: 8, fontFamily: 'monospace' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button onClick={doRequest} disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Loading…' : 'Send GET'}
        </button>
        <button onClick={copyCurl} style={{ padding: '8px 12px' }}>
          Copy cURL
        </button>
        <button
          onClick={() => {
            setUrl(DEFAULT_URL);
            setAccessToken('');
            setProxyAccessToken('');
            setResult(null);
            setError(null);
          }}
          style={{ padding: '8px 12px' }}
        >
          Reset
        </button>
      </div>

      <section>
        {error && (
          <div style={{ color: 'crimson', whiteSpace: 'pre-wrap', marginBottom: 12 }}>{error}</div>
        )}

        {result && (
          <div style={{ marginBottom: 12 }}>
            <h2>Response (status {result.status})</h2>
            <pre
              style={{
                background: '#f6f8fa',
                padding: 12,
                borderRadius: 6,
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {!result && !error && <div style={{ color: '#666' }}>No response yet — click Send GET.</div>}
      </section>

      <aside style={{ marginTop: 18, color: '#666', fontSize: 13 }}>
        Note:
        <ul>
          <li>
            If the endpoint blocks browser requests due to CORS, run the copied cURL from a terminal or
            call the endpoint from a server-side route.
          </li>
          <li>
            This page now sends the proxy token using the X-Proxy-Authorization header per your request.
          </li>
        </ul>
      </aside>
    </main>
  );
}