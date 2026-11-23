import { NextRequest, NextResponse } from "next/server";

const ALLOWED_CODES = [200, 400, 404, 500] as const;

export async function GET(request: NextRequest) {
  const start = performance.now();
  const statusParam = request.nextUrl.searchParams.get("status");
  const parsed = statusParam ? Number(statusParam) : 200;

  const statusCode = (ALLOWED_CODES as readonly number[]).includes(parsed)
    ? parsed
    : 200;

  const elapsedMs = Math.round(performance.now() - start);

  if (statusCode === 200) {
    return NextResponse.json(
      {
        service: "nexus-ops-qa-api",
        status: "healthy",
        statusCode: 200,
        latencyMs: elapsedMs,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  if (statusCode === 400) {
    return NextResponse.json(
      {
        service: "nexus-ops-qa-api",
        status: "bad_request",
        statusCode: 400,
        error: "Parámetro de consulta inválido o incompleto.",
        latencyMs: elapsedMs,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  if (statusCode === 404) {
    return NextResponse.json(
      {
        service: "nexus-ops-qa-api",
        status: "not_found",
        statusCode: 404,
        error: "El recurso operativo solicitado no fue encontrado.",
        latencyMs: elapsedMs,
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      service: "nexus-ops-qa-api",
      status: "internal_error",
      statusCode: 500,
      error: "Falla interna simulada para pruebas de resiliencia QA.",
      latencyMs: elapsedMs,
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}
