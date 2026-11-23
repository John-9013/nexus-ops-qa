import type {
  OperationItem,
  SimulatedHttpCode,
  ValidationResult,
} from "../models/operations";

export function validateOperationInput(
  input: Partial<OperationItem>
): ValidationResult {
  const errors: Record<string, string> = {};

  const title = (input.title ?? "").trim();
  if (!title) {
    errors.title = "El título de la orden es obligatorio.";
  } else if (title.length < 4) {
    errors.title = "El título debe tener al menos 4 caracteres.";
  } else if (title.length > 80) {
    errors.title = "El título no puede superar los 80 caracteres.";
  }

  const branch = (input.branch ?? "").trim();
  if (!branch) {
    errors.branch = "Debes seleccionar una sucursal.";
  }

  const category = (input.category ?? "").trim();
  if (!category) {
    errors.category = "Selecciona una categoría de mantenimiento.";
  }

  const cost = Number(input.estimatedCost);
  if (Number.isNaN(cost) || cost <= 0) {
    errors.estimatedCost = "El costo estimado debe ser mayor a $0.";
  } else if (cost > 100_000_000) {
    errors.estimatedCost = "El monto excede el límite operativo permitido.";
  }

  const scheduledDate = (input.scheduledDate ?? "").trim();
  if (!scheduledDate) {
    errors.scheduledDate = "Debes indicar una fecha programada.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getSimulatedHttpDetails(code: SimulatedHttpCode): {
  ok: boolean;
  message: string;
} {
  switch (code) {
    case 200:
      return {
        ok: true,
        message: "200 OK — Servicio operativo y respuesta válida del servidor.",
      };
    case 400:
      return {
        ok: false,
        message:
          "400 Bad Request — Parámetros inválidos detectados por validación de esquema.",
      };
    case 404:
      return {
        ok: false,
        message:
          "404 Not Found — Recurso o sucursal solicitada no existe en el registro.",
      };
    case 500:
      return {
        ok: false,
        message:
          "500 Internal Server Error — Falla simulada en base de datos; UI protegida sin caída.",
      };
  }
}

