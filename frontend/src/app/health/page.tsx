'use client';

import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
  info?: Record<string, { status: string }>;
};

export default function HealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${apiUrl}/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Health</h1>
      {error && <p className="text-red-500">Erro ao consultar o backend: {error}</p>}
      {!error && !health && <p className="text-neutral-500">Consultando...</p>}
      {health && (
        <pre className="rounded bg-neutral-100 p-4 text-sm text-neutral-800">
          {JSON.stringify(health, null, 2)}
        </pre>
      )}
    </main>
  );
}
