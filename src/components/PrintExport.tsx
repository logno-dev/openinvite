"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PreviewPayload } from "@/lib/preview-template";

type PrintExportProps = {
  previewToken: string;
  kind: "invitation" | "save_the_date";
};

export default function PrintExport({ previewToken, kind }: PrintExportProps) {
  const [source, setSource] = useState<"live" | "draft">("live");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ url: string; filename: string; publicUrl: string } | null>(null);
  const urlRef = useRef<string | null>(null);
  const generation = useRef(0);

  useEffect(() => () => {
    generation.current += 1;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  async function generate() {
    const current = ++generation.current;
    setBusy(true);
    setError("");
    setResult(null);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    try {
      const response = await fetch(`/api/preview/${encodeURIComponent(previewToken)}?kind=${kind}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load the saved invitation. Save your changes and try again.");
      const payload: PreviewPayload = await response.json();
      if (!payload.invitation.openRsvpToken) throw new Error("This invitation does not have a public link yet.");
      const templateUrl = source === "draft"
        ? payload.touchpoint?.templateUrlDraft || payload.invitation.templateUrlDraft
        : payload.touchpoint?.templateUrlLive || payload.invitation.templateUrlLive;
      if (!templateUrl) throw new Error(`Save a ${source} template URL before generating the print image.`);
      let template: Response;
      try {
        template = await fetch(templateUrl, { cache: "no-store", signal: AbortSignal.timeout(20000) });
      } catch {
        throw new Error("The template could not be fetched. For localhost or external templates, enable CORS or use an HTTPS tunnel.");
      }
      if (!template.ok) throw new Error("The template URL returned an error. Check the URL and try again.");
      const publicUrl = new URL(`/i/open/${encodeURIComponent(payload.invitation.openRsvpToken)}`, window.location.origin).href;
      const { renderPrintTemplate, exportPrintPng } = await import("@/lib/print-export");
      const html = await renderPrintTemplate(await template.text(), payload, template.url || new URL(templateUrl, window.location.origin).href, publicUrl);
      if (current !== generation.current) return;
      const blob = await exportPrintPng(html);
      if (current !== generation.current) return;
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const title = payload.invitation.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80) || "invitation";
      setResult({ url, filename: `${title}-${kind}-5x7-300dpi.png`, publicUrl });
    } catch (err) {
      if (current === generation.current) setError(err instanceof Error ? err.message : "Unable to export this template.");
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  return (
    <section className="grid gap-4 border-t border-white/10 pt-6" aria-labelledby="print-export-heading">
      <div>
        <h3 id="print-export-heading" className="text-sm font-semibold">Print / export</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          A 5 &times; 7-inch portrait PNG at 300 DPI (1500 &times; 2100 pixels), with a QR code in place of the RSVP form.
        </p>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Uses your saved title, hosts, date, time, and location. Notes, registry links, and other extras stay on the digital invitation.
          Your template controls the print design through html.oi-print styles.
          The QR code opens the public digital invitation, so set a working live invitation template before printing.
        </p>
        <a href="/docs/templating#print-layout-css" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[var(--accent)] underline underline-offset-4">
          5 &times; 7 template CSS guide
        </a>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-2 sm:w-48">
          <label htmlFor="print-template-source" className="text-xs text-[var(--muted)]">Template source</label>
          <select
            id="print-template-source"
            value={source}
            disabled={busy}
            onChange={(event) => {
              setSource(event.target.value as "draft" | "live");
              setResult(null);
              setError("");
              if (urlRef.current) URL.revokeObjectURL(urlRef.current);
              urlRef.current = null;
            }}
            className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
          >
            <option value="live">Live template</option>
            <option value="draft">Draft template</option>
          </select>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="rounded-full border border-white/20 px-5 py-3 text-sm font-medium transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Rendering print image..." : result ? "Regenerate print preview" : "Generate print preview"}
        </button>
      </div>
      <p role="status" className="text-sm text-[var(--muted)]">
        {error || (busy ? "Loading the template, fonts, and images. This can take a few seconds." : "")}
      </p>
      {result ? (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-start">
          <a href={result.url} target="_blank" rel="noreferrer" aria-label="Open full-size print preview">
            <Image src={result.url} width={1500} height={2100} unoptimized alt="5 by 7 inch invitation with a QR code" className="h-auto w-full rounded-lg border border-white/15" />
          </a>
          <div className="grid justify-items-start gap-3">
            <a href={result.url} download={result.filename} className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-black">
              Download PNG
            </a>
            <p className="text-xs leading-5 text-[var(--muted)]">Export size: 5 &times; 7 inches at 300 DPI. Print at actual size (100%).</p>
            <a href={result.publicUrl} target="_blank" rel="noreferrer" className="text-sm text-[var(--accent)] underline underline-offset-4">Open QR destination</a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
