"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TemplateGalleryItem } from "@/lib/template-gallery";

type TemplateGalleryClientProps = {
  templates: TemplateGalleryItem[];
};

type TemplateFormState = {
  name: string;
  url: string;
  thumbnailUrl: string;
  repoUrl: string;
};

export default function TemplateGalleryClient({ templates }: TemplateGalleryClientProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [items, setItems] = useState<TemplateGalleryItem[]>(templates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormState>({
    name: "",
    url: "",
    thumbnailUrl: "",
    repoUrl: "",
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setItems(templates);
  }, [templates]);

  function handleCopy(template: TemplateGalleryItem) {
    void navigator.clipboard.writeText(template.url);
    setCopiedId(template.id);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => setCopiedId(null), 1800);
  }

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", url: "", thumbnailUrl: "", repoUrl: "" });
  }

  function openForCreate() {
    resetForm();
    setFormOpen(true);
  }

  function openForEdit(template: TemplateGalleryItem) {
    setEditingId(template.id);
    setForm({
      name: template.name,
      url: template.url,
      thumbnailUrl: template.thumbnailUrl ?? "",
      repoUrl: template.repoUrl ?? "",
    });
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.url.trim()) {
      setError("Template name and URL are required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      url: form.url.trim(),
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      repoUrl: form.repoUrl.trim() || null,
    };

    try {
      const response = await fetch(
        editingId ? `/api/templates/${editingId}` : "/api/templates",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json") ? await response.json() : {};

      if (!response.ok) {
        setError(data.error ?? "Failed to save template.");
        setSaving(false);
        return;
      }

      const saved = data.template as TemplateGalleryItem | undefined;
      if (saved) {
        setItems((prev) =>
          editingId ? prev.map((item) => (item.id === saved.id ? saved : item)) : [...prev, saved]
        );
      }

      resetForm();
      setFormOpen(false);
      setSaving(false);
    } catch {
      setError("Failed to save template.");
      setSaving(false);
    }
  }

  async function handleRemove(template: TemplateGalleryItem) {
    const confirmed = window.confirm(`Remove ${template.name} from the gallery?`);
    if (!confirmed) return;
    setError(null);
    try {
      const response = await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json") ? await response.json() : {};
      if (!response.ok) {
        setError(data.error ?? "Failed to remove template.");
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== template.id));
    } catch {
      setError("Failed to remove template.");
    }
  }

  const templateCards = useMemo(
    () =>
      items.map((template) => {
        const previewHref = `/dashboard/templates/preview?templateUrl=${encodeURIComponent(
          template.url
        )}`;
        return (
          <article
            key={template.id}
            className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-white/5 p-6"
          >
            {template.thumbnailUrl ? (
              <img
                className="aspect-[16/9] w-full rounded-2xl border border-white/10 object-cover"
                src={template.thumbnailUrl}
                alt={`${template.name} preview`}
                loading="lazy"
              />
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(140deg,#1a102f_0%,#0b1220_50%,#10132a_100%)] text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
                No thumbnail
              </div>
            )}
            <div className="grid gap-2">
              <h3 className="font-[var(--font-display)] text-2xl tracking-[0.08em]">
                {template.name}
              </h3>
              <p className="break-all text-xs text-[var(--muted)]">{template.url}</p>
              {template.repoUrl ? (
                <a
                  className="text-xs uppercase tracking-[0.25em] text-[var(--accent)]"
                  href={template.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Repository
                </a>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                className="rounded-full border border-white/25 bg-white/5 px-4 py-2"
                onClick={() => handleCopy(template)}
              >
                {copiedId === template.id ? "Copied" : "Copy URL"}
              </button>
              <a
                className="rounded-full border border-white/25 bg-white/5 px-4 py-2"
                href={previewHref}
                target="_blank"
                rel="noreferrer"
              >
                Preview
              </a>
              <button
                type="button"
                className="rounded-full border border-white/25 bg-white/5 px-4 py-2"
                onClick={() => openForEdit(template)}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-full border border-white/25 bg-white/5 px-4 py-2"
                onClick={() => handleRemove(template)}
              >
                Remove
              </button>
            </div>
          </article>
        );
      }),
    [items, copiedId]
  );

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-white/15 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-[var(--font-display)] text-2xl tracking-[0.1em]">
              Manage templates
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Templates are stored per account.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm"
              onClick={openForCreate}
            >
              Add template
            </button>
          </div>
        </div>

        {formOpen ? (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Template name
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Template URL
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.url}
                onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
                placeholder="/templates/your-template.html"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Thumbnail URL
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.thumbnailUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
                }
                placeholder="/templates/thumbs/your-template.svg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Repository URL
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.repoUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, repoUrl: event.target.value }))}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black"
                disabled={saving}
              >
                {saving ? "Saving..." : editingId ? "Save changes" : "Add template"}
              </button>
              <button
                type="button"
                className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm"
                onClick={() => {
                  resetForm();
                  setFormOpen(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
        {error ? <p className="mt-4 text-sm text-[var(--muted)]">{error}</p> : null}
      </section>

      <div className="grid gap-6 md:grid-cols-2">{templateCards}</div>
    </div>
  );
}
