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
  tags: string;
};

export default function TemplateGalleryClient({ templates }: TemplateGalleryClientProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [items, setItems] = useState<TemplateGalleryItem[]>(templates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addForm, setAddForm] = useState<TemplateFormState>({
    name: "",
    url: "",
    thumbnailUrl: "",
    repoUrl: "",
    tags: "",
  });
  const [editForm, setEditForm] = useState<TemplateFormState>({
    name: "",
    url: "",
    thumbnailUrl: "",
    repoUrl: "",
    tags: "",
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

  function resetEditForm() {
    setEditingId(null);
    setEditForm({ name: "", url: "", thumbnailUrl: "", repoUrl: "", tags: "" });
  }

  function resetAddForm() {
    setAddForm({ name: "", url: "", thumbnailUrl: "", repoUrl: "", tags: "" });
  }

  function openAddForm() {
    resetAddForm();
    setAddFormOpen(true);
  }

  function openForEdit(template: TemplateGalleryItem) {
    setEditingId(template.id);
    setEditForm({
      name: template.name,
      url: template.url,
      thumbnailUrl: template.thumbnailUrl ?? "",
      repoUrl: template.repoUrl ?? "",
      tags: template.tags?.join(", ") ?? "",
    });
  }

  async function handleAddSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!addForm.name.trim() || !addForm.url.trim()) {
      setError("Template name and URL are required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: addForm.name.trim(),
      url: addForm.url.trim(),
      thumbnailUrl: addForm.thumbnailUrl.trim() || null,
      repoUrl: addForm.repoUrl.trim() || null,
      tags: addForm.tags,
    };

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json") ? await response.json() : {};

      if (!response.ok) {
        setError(data.error ?? "Failed to save template.");
        setSaving(false);
        return;
      }

      const saved = data.template as TemplateGalleryItem | undefined;
      if (saved) {
        setItems((prev) => [...prev, saved]);
      }

      resetAddForm();
      setAddFormOpen(false);
      setSaving(false);
    } catch {
      setError("Failed to save template.");
      setSaving(false);
    }
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!editingId) return;
    if (!editForm.name.trim() || !editForm.url.trim()) {
      setError("Template name and URL are required.");
      return;
    }
    const editingTemplate = items.find((item) => item.id === editingId);
    if (editingTemplate && editingTemplate.canEdit === false) {
      setError("You cannot edit templates submitted by others.");
      return;
    }
    setSaving(true);
    const payload = {
      name: editForm.name.trim(),
      url: editForm.url.trim(),
      thumbnailUrl: editForm.thumbnailUrl.trim() || null,
      repoUrl: editForm.repoUrl.trim() || null,
      tags: editForm.tags,
    };

    try {
      const response = await fetch(`/api/templates/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json") ? await response.json() : {};

      if (!response.ok) {
        setError(data.error ?? "Failed to save template.");
        setSaving(false);
        return;
      }

      const saved = data.template as TemplateGalleryItem | undefined;
      if (saved) {
        setItems((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
      }

      resetEditForm();
      setSaving(false);
    } catch {
      setError("Failed to save template.");
      setSaving(false);
    }
  }

  async function handleRemove(template: TemplateGalleryItem) {
    const confirmed = window.confirm(`Remove ${template.name} from the gallery?`);
    if (!confirmed) return;
    if (template.canEdit === false) {
      setError("You cannot delete templates submitted by others.");
      return;
    }
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

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return items;
    return items.filter((template) => {
      const tags = template.tags?.join(" ") ?? "";
      const haystack = `${template.name} ${template.submittedBy ?? ""} ${tags}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [items, query]);

  const templateCards = useMemo(
    () =>
      filteredItems.map((template) => {
        const previewHref = `/dashboard/templates/preview?templateUrl=${encodeURIComponent(
          template.url
        )}`;
        const isEditing = editingId === template.id;
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
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                Submitted by {template.submittedBy ?? "You"}
              </p>
              {template.tags && template.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
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
              {template.canEdit === false ? null : (
                <>
                  <button
                    type="button"
                    className="rounded-full border border-white/25 bg-white/5 px-4 py-2"
                    onClick={() => openForEdit(template)}
                  >
                    {isEditing ? "Editing" : "Edit"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-white/25 bg-white/5 px-4 py-2"
                    onClick={() => handleRemove(template)}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            {isEditing ? (
              <form
                onSubmit={handleEditSubmit}
                className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Template name
                  </label>
                  <input
                    className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Template URL
                  </label>
                  <input
                    className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                    value={editForm.url}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, url: event.target.value }))
                    }
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
                    value={editForm.thumbnailUrl}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
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
                    value={editForm.repoUrl}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, repoUrl: event.target.value }))
                    }
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Tags
                  </label>
                  <input
                    className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                    value={editForm.tags}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, tags: event.target.value }))
                    }
                    placeholder="minimal, botanical, modern"
                  />
                </div>
                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm"
                    onClick={resetEditForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </article>
        );
      }),
    [filteredItems, copiedId, editingId, editForm, saving]
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
            <input
              className="h-11 w-48 rounded-full border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
              placeholder="Search templates"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm"
              onClick={openAddForm}
            >
              Add template
            </button>
          </div>
        </div>
        {error ? <p className="mt-4 text-sm text-[var(--muted)]">{error}</p> : null}
      </section>

      {addFormOpen ? (
        <section className="rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-[var(--font-display)] text-2xl tracking-[0.1em]">
                Add a template
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Provide a URL that points to your HTML template.
              </p>
            </div>
          </div>
          <form onSubmit={handleAddSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Template name
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={addForm.name}
                onChange={(event) =>
                  setAddForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Template URL
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={addForm.url}
                onChange={(event) =>
                  setAddForm((prev) => ({ ...prev, url: event.target.value }))
                }
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
                value={addForm.thumbnailUrl}
                onChange={(event) =>
                  setAddForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
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
                value={addForm.repoUrl}
                onChange={(event) =>
                  setAddForm((prev) => ({ ...prev, repoUrl: event.target.value }))
                }
                placeholder="https://github.com/..."
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Tags
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={addForm.tags}
                onChange={(event) =>
                  setAddForm((prev) => ({ ...prev, tags: event.target.value }))
                }
                placeholder="minimal, botanical, modern"
              />
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black"
                disabled={saving}
              >
                {saving ? "Saving..." : "Add template"}
              </button>
              <button
                type="button"
                className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm"
                onClick={() => {
                  resetAddForm();
                  setAddFormOpen(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="grid items-start gap-6 md:grid-cols-2">{templateCards}</div>
    </div>
  );
}
