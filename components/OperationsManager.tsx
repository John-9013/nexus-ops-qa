"use client";

import React, { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { validateOperationInput } from "../lib/qa-validators";
import type {
  OperationItem,
  OperationPriority,
  OperationStatus,
} from "../models/operations";

const STORAGE_KEY = "nexus_ops_qa_operations";

const BRANCHES = [
  "Bogotá — Sede Principal",
  "Medellín — Planta Norte",
  "Cali — Centro Logístico",
  "Barranquilla — Hub Costa",
];

const CATEGORIES = [
  "Preventivo Eléctrico",
  "Correctivo HVAC",
  "Redes y Conectividad",
  "Seguridad y Cámaras",
];

const INITIAL_OPERATIONS: OperationItem[] = [
  {
    id: "OP-101",
    title: "Revisión de tablero eléctrico principal",
    branch: "Bogotá — Sede Principal",
    category: "Preventivo Eléctrico",
    priority: "Alta",
    status: "En proceso",
    estimatedCost: 1450000,
    scheduledDate: "2026-11-25",
    createdAt: "2026-11-23",
  },
  {
    id: "OP-102",
    title: "Mantenimiento de aire acondicionado central",
    branch: "Medellín — Planta Norte",
    category: "Correctivo HVAC",
    priority: "Media",
    status: "Pendiente",
    estimatedCost: 980000,
    scheduledDate: "2026-11-27",
    createdAt: "2026-11-23",
  },
];

// Store sobre localStorage: evita desajustes de hidratación (el servidor renderiza
// INITIAL_OPERATIONS) y mantiene un respaldo en memoria si el almacenamiento falla.
let memoryRaw: string | null = null;
const storeListeners = new Set<() => void>();

function subscribeToStore(listener: () => void) {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

function readStore(): string | null {
  if (memoryRaw !== null) return memoryRaw;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStore(raw: string) {
  memoryRaw = raw;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Cuota o almacenamiento bloqueado: se mantiene solo en memoria
  }
  storeListeners.forEach((listener) => listener());
}

function parseOperations(raw: string | null): OperationItem[] {
  if (!raw) return INITIAL_OPERATIONS;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OperationItem[]) : INITIAL_OPERATIONS;
  } catch {
    return INITIAL_OPERATIONS;
  }
}

export default function OperationsManager() {
  const rawOperations = useSyncExternalStore(
    subscribeToStore,
    readStore,
    () => null
  );
  const operations = useMemo(() => parseOperations(rawOperations), [rawOperations]);
  const setOperations = useCallback(
    (update: (prev: OperationItem[]) => OperationItem[]) =>
      writeStore(JSON.stringify(update(parseOperations(readStore())))),
    []
  );
  const [branchFilter, setBranchFilter] = useState<string>("Todas");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");

  const [title, setTitle] = useState("");
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<OperationPriority>("Media");
  const [estimatedCost, setEstimatedCost] = useState("500000");
  const [scheduledDate, setScheduledDate] = useState("2026-11-28");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredOperations = useMemo(() => {
    return operations.filter((item) => {
      const matchesBranch =
        branchFilter === "Todas" || item.branch === branchFilter;
      const matchesStatus =
        statusFilter === "Todos" || item.status === statusFilter;
      return matchesBranch && matchesStatus;
    });
  }, [operations, branchFilter, statusFilter]);

  const totalCost = useMemo(() => {
    return filteredOperations.reduce((acc, item) => acc + item.estimatedCost, 0);
  }, [filteredOperations]);

  function handleCreateOperation(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const parsedCost = Number(estimatedCost);
    const validation = validateOperationInput({
      title,
      branch,
      category,
      priority,
      estimatedCost: parsedCost,
      scheduledDate,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const nextNumber =
      operations.reduce(
        (max, item) => Math.max(max, Number(item.id.replace("OP-", "")) || 0),
        102
      ) + 1;
    const newOp: OperationItem = {
      id: `OP-${nextNumber}`,
      title: title.trim(),
      branch,
      category,
      priority,
      status: "Pendiente",
      estimatedCost: parsedCost,
      scheduledDate,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setOperations((prev) => [newOp, ...prev]);
    setTitle("");
    setEstimatedCost("500000");
    setFeedback(`Orden ${newOp.id} creada y validada correctamente.`);
  }

  function handleStatusChange(id: string, nextStatus: OperationStatus) {
    setOperations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
    );
  }

  function handleDelete(id: string) {
    setOperations((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 text-slate-100 shadow-lg">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Gestión de Operaciones Multi-Sede
          </h2>
          <p className="text-sm text-slate-400">
            Registro de mantenimiento con validación de reglas QA y control por sucursal.
          </p>
        </div>
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-right">
          <span className="block text-xs text-sky-300">Costo Filtrado</span>
          <strong className="text-base text-white">
            ${totalCost.toLocaleString("es-CO")} COP
          </strong>
        </div>
      </div>

      <form
        onSubmit={handleCreateOperation}
        noValidate
        className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            Título de la orden *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Cambio de UPS en cuarto de cómputo"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-rose-400">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            Sucursal *
          </label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
          >
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {errors.branch && (
            <p className="mt-1 text-xs text-rose-400">{errors.branch}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            Categoría *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs text-rose-400">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            Prioridad
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as OperationPriority)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
          >
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            Costo estimado (COP) *
          </label>
          <input
            type="number"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
          />
          {errors.estimatedCost && (
            <p className="mt-1 text-xs text-rose-400">{errors.estimatedCost}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            Fecha programada *
          </label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
          />
          {errors.scheduledDate && (
            <p className="mt-1 text-xs text-rose-400">{errors.scheduledDate}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 md:col-span-2 lg:col-span-3">
          <div className="text-xs text-emerald-400">{feedback ?? ""}</div>
          <button
            type="submit"
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            + Registrar Orden
          </button>
        </div>
      </form>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200"
        >
          <option value="Todas">Todas las sucursales</option>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200"
        >
          <option value="Todos">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En proceso">En proceso</option>
          <option value="Completado">Completado</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
              <th className="py-2.5 pr-3">ID</th>
              <th className="py-2.5 pr-3">Orden</th>
              <th className="py-2.5 pr-3">Sucursal</th>
              <th className="py-2.5 pr-3">Prioridad</th>
              <th className="py-2.5 pr-3">Costo</th>
              <th className="py-2.5 pr-3">Estado</th>
              <th className="py-2.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {filteredOperations.map((op) => (
              <tr key={op.id} className="hover:bg-slate-800/30">
                <td className="py-3 pr-3 font-mono text-xs text-sky-400">
                  {op.id}
                </td>
                <td className="py-3 pr-3">
                  <div className="font-medium text-white">{op.title}</div>
                  <div className="text-xs text-slate-400">
                    {op.category} · {op.scheduledDate}
                  </div>
                </td>
                <td className="py-3 pr-3 text-slate-300">{op.branch}</td>
                <td className="py-3 pr-3 text-slate-300">{op.priority}</td>
                <td className="py-3 pr-3 text-slate-200">
                  ${op.estimatedCost.toLocaleString("es-CO")}
                </td>
                <td className="py-3 pr-3">
                  <select
                    value={op.status}
                    onChange={(e) =>
                      handleStatusChange(op.id, e.target.value as OperationStatus)
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Completado">Completado</option>
                  </select>
                </td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(op.id)}
                    className="rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/20"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {filteredOperations.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No hay órdenes que coincidan con el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}