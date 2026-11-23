export type OperationStatus = "Pendiente" | "En proceso" | "Completado";
export type OperationPriority = "Baja" | "Media" | "Alta";

export interface OperationItem {
  id: string;
  title: string;
  branch: string;
  category: string;
  priority: OperationPriority;
  status: OperationStatus;
  estimatedCost: number;
  scheduledDate: string;
  createdAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export type SimulatedHttpCode = 200 | 400 | 404 | 500;

export interface ApiCheckLog {
  id: string;
  endpoint: string;
  method: "GET" | "POST";
  statusCode: number;
  latencyMs: number;
  ok: boolean;
  message: string;
  timestamp: string;
}

