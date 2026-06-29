"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { HealthCheckResponse } from "@/types";

type Status = "loading" | "up" | "down";

export default function HealthStatus() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    api
      .get<HealthCheckResponse>("/health/")
      .then((data) => {
        setStatus(data.status === "ok" ? "up" : "down");
      })
      .catch(() => {
        setStatus("down");
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Backend Health Check</h1>
      {status === "loading" && (
        <p className="text-gray-500" data-testid="health-loading">
          Checking backend...
        </p>
      )}
      {status === "up" && (
        <p className="text-green-600 font-semibold" data-testid="health-up">
          Backend: up
        </p>
      )}
      {status === "down" && (
        <p className="text-red-600 font-semibold" data-testid="health-down">
          Backend: down
        </p>
      )}
    </div>
  );
}
