"use client";

import { useState } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const PARTS = Array.from({ length: 5 }, (_, index) => `/downloads/kit/kit.part-${String(index).padStart(2, "0")}`);

export function KitDownloadButton() {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState(false);

  async function downloadKit() {
    setError(false);
    setProgress(0);
    try {
      const chunks: ArrayBuffer[] = [];
      for (let index = 0; index < PARTS.length; index += 1) {
        const response = await fetch(PARTS[index]);
        if (!response.ok) throw new Error(`No se pudo descargar el bloque ${index + 1}.`);
        chunks.push(await response.arrayBuffer());
        setProgress(Math.round(((index + 1) / PARTS.length) * 100));
      }
      const url = URL.createObjectURL(new Blob(chunks, { type: "application/zip" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "people-analytics-dax-kit-free-v7.zip";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setProgress(null);
    } catch {
      setError(true);
      setProgress(null);
    }
  }

  return <div className="download-control">
    <Button size="lg" className="primary-cta" onClick={downloadKit} disabled={progress !== null}>
      {progress === null ? <>Descargar kit gratuito <ArrowDown /></> : <>Preparando descarga… {progress}%</>}
    </Button>
    {error && <span role="alert">La descarga se interrumpió. Vuelve a intentarlo.</span>}
  </div>;
}
