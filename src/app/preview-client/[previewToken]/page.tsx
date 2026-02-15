"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { applyPreviewDataToHtml, type PreviewPayload } from "@/lib/preview-template";

export default function PreviewClientPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = typeof params.previewToken === "string" ? params.previewToken : "";
  const mode = (searchParams.get("mode") ?? "open") === "guest" ? "guest" : "open";
  const source = (searchParams.get("source") ?? "live") === "draft" ? "draft" : "live";
  const kind =
    (searchParams.get("kind") ?? "invitation") === "save_the_date"
      ? "save_the_date"
      : "invitation";
  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      const response = await fetch(`/api/preview/${token}?kind=${kind}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Preview not found");
        return;
      }
      setPayload(data);
    }

    load();
  }, [token, kind]);

  useEffect(() => {
    async function render() {
      if (!payload) return;
      const templateUrl =
        source === "draft"
          ? payload.touchpoint?.templateUrlDraft ?? payload.invitation.templateUrlDraft
          : payload.touchpoint?.templateUrlLive ?? payload.invitation.templateUrlLive;
      if (!templateUrl) {
        setError(
          source === "draft"
            ? "Draft template URL is missing."
            : "Live template URL is missing."
        );
        return;
      }
      try {
        const templateResponse = await fetch(templateUrl, {
          cache: "no-store",
        });
        if (!templateResponse.ok) {
          setError("Template URL is not reachable from this browser.");
          return;
        }
        const templateHtml = await templateResponse.text();
        setHtml(applyPreviewDataToHtml(templateHtml, payload, mode));
      } catch {
        setError("Template URL is not reachable from this browser.");
      }
    }

    render();
  }, [payload, mode, source]);

  const guestUrl = useMemo(() => `?mode=guest&source=${source}&kind=${kind}`, [source, kind]);
  const openUrl = useMemo(() => `?mode=open&source=${source}&kind=${kind}`, [source, kind]);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-[var(--foreground)]">
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0a0a14] px-5 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Client preview</span>
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {mode === "guest" ? "Guest" : "Open"} · {source === "draft" ? "Draft" : "Live"} · {kind === "save_the_date" ? "Save the Date" : "Invitation"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            className={`rounded-full border px-3 py-1 text-xs ${
              mode === "guest"
                ? "border-[#00f0ff] bg-[#00f0ff] text-[#0a0a14]"
                : "border-white/30 text-white"
            }`}
            href={guestUrl}
          >
            Guest
          </a>
          <a
            className={`rounded-full border px-3 py-1 text-xs ${
              mode === "open"
                ? "border-[#c7ff1a] bg-[#c7ff1a] text-[#0a0a14]"
                : "border-white/30 text-white"
            }`}
            href={openUrl}
          >
            Open
          </a>
        </div>
      </div>

      {error ? (
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-[var(--muted)]">
          {error}
        </div>
      ) : html ? (
        <iframe className="h-[calc(100vh-60px)] w-full" srcDoc={html} />
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-[var(--muted)]">
          Loading preview...
        </div>
      )}
    </div>
  );
}
