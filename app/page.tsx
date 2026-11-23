import ApiQaDashboard from "../components/ApiQaDashboard";
import OperationsManager from "../components/OperationsManager";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Nexus Ops QA
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Panel de operaciones de mantenimiento y monitoreo de API.
          </p>
        </header>
        <OperationsManager />
        <ApiQaDashboard />
      </main>
    </div>
  );
}
