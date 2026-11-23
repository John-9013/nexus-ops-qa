"use client";

import React, { useRef, useState } from "react";
import { getSimulatedHttpDetails } from "../lib/qa-validators";
import type { ApiCheckLog, SimulatedHttpCode } from "../models/operations";

const TEST_CODES: SimulatedHttpCode[] = [200, 400, 404, 500];

export default function ApiQaDashboard() {
  const [selectedCode, setSelectedCode] = useState<SimulatedHttpCode>(200);
  const [logs, setLogs] = useState<ApiCheckLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const checkCounter = useRef(0);

  function nextCheckId() {
    checkCounter.current += 1;
    return `CHK-${String(checkCounter.current).padStart(3, "0")}`;
  }

  async function runHealthCheck(codeToTest: SimulatedHttpCode) {
    setIsRunning(true);
    const startTime = performance.now();
    const endpoint = `/api/health?status=${codeToTest}`;

    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const latencyMs = Math.max(1, Math.round(performance.now() - startTime));
      const details = getSimulatedHttpDetails(codeToTest);

      const newLog: ApiCheckLog = {
        id: nextCheckId(),
        endpoint,
        method: "GET",
        statusCode: response.status,
        latencyMs,
        ok: response.ok,
        message: details.message,
        timestamp: new Date().toLocaleTimeString("es-CO"),
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 12));
    } catch {
      const latencyMs = Math.max(1, Math.round(performance.now() - startTime));
      const newLog: ApiCheckLog = {
        id: nextCheckId(),
        endpoint,
        method: "GET",
        statusCode: 503,
        latencyMs,
        ok: false,
        message: "Error de red al consultar el endpoint de salud.",
        timestamp: new Date().toLocaleTimeString("es-CO"),
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 12));
    } finally {
      setIsRunning(false);
    }
  }

  async function runAllScenarios() {
    for (const code of TEST_CODES) {
      await runHealthCheck(code);
    }
  }

  const passedCount = logs.filter((l) => l.ok).length;
  const failedCount = logs.filter((l) => !l.ok).length;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 text-slate-100 shadow-lg">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Laboratorio API &amp; Monitoreo QA
          </h2>
          <p className="text-sm text-slate-400">
            Prueba de resiliencia contra <code className="text-sky-400">/api/health</code> con estados 200, 400, 404 y 500.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">
            OK (2xx): <strong>{passedCount}</strong>
          </span>
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-300">
            Incidencias QA: <strong>{failedCount}</strong>
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-slate-300">
          Código HTTP a simular:
        </label>
        <select
          value={selectedCode}
          onChange={(e) =>
            setSelectedCode(Number(e.target.value) as SimulatedHttpCode)
          }
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        >
          {TEST_CODES.map((code) => (
            <option key={code} value={code}>
              HTTP {code}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={isRunning}
          onClick={() => runHealthCheck(selectedCode)}
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
        >
          {isRunning ? "Ejecutando..." : "Ejecutar Check"}
        </button>

        <button
          type="button"
          disabled={isRunning}
          onClick={runAllScenarios}
          className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 disabled:opacity-50"
        >
          Probar 200 / 400 / 404 / 500
        </button>

        {logs.length > 0 && (
          <button
            type="button"
            onClick={() => setLogs([])}
            className="ml-auto text-xs text-slate-400 underline hover:text-slate-200"
          >
            Limpiar historial
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex flex-col justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3 sm:flex-row sm:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs font-semibold ${
                    log.ok
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {log.statusCode}
                </span>
                <code className="text-xs text-slate-300">
                  {log.method} {log.endpoint}
                </code>
                <span className="text-xs text-slate-500">· {log.timestamp}</span>
              </div>
              <p className="mt-1 text-xs text-slate-300">{log.message}</p>
            </div>
            <div className="text-right font-mono text-xs text-sky-400">
              {log.latencyMs} ms
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-800 py-8 text-center text-sm text-slate-400">
            Aún no se han ejecutado pruebas. Haz clic en <strong>Ejecutar Check</strong> o <strong>Probar 200 / 400 / 404 / 500</strong>.
          </div>
        )}
      </div>
    </section>
  );
}
