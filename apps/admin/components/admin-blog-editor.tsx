"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, createApiClient } from "../../shared/api-client";

const api = createApiClient();
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type BlogStatus = "draft" | "scheduled" | "published" | "archived";
type BlogPost = {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  read_time?: string;
  cover_image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  author_name?: string | null;
  tags?: string[];
  gallery?: string[];
  inline_images?: string[];
  featured?: boolean;
  pinned_rank?: number;
  status: BlogStatus;
  scheduled_publish_at?: string | null;
  published_at?: string | null;
  meta_keywords?: string | null;
};

const emptyPost: BlogPost = {
  slug: "",
  title: "",
  excerpt: "",
  body: "# Blog title\n\nWrite the daily WheatRaja story here.",
  category: "Blog",
  read_time: "4 min read",
  cover_image_url: "",
  seo_title: "",
  seo_description: "",
  author_name: "WheatRaja Team",
  tags: [],
  gallery: [],
  inline_images: [],
  featured: false,
  pinned_rank: 100,
  status: "draft",
  scheduled_publish_at: "",
  meta_keywords: "",
};

function csrfToken() {
  if (typeof document === "undefined") return "";
  return decodeURIComponent(document.cookie.split("; ").find((row) => row.startsWith("wr_csrf="))?.split("=")[1] ?? "");
}

function csv(values?: string[]) {
  return values?.join(", ") ?? "";
}

function splitCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 140);
}

function bodyFrom(post: BlogPost) {
  return {
    ...post,
    read_time: post.read_time || "4 min read",
    cover_image_url: post.cover_image_url || null,
    seo_title: post.seo_title || null,
    seo_description: post.seo_description || null,
    author_name: post.author_name || "WheatRaja Team",
    tags: post.tags ?? [],
    gallery: post.gallery ?? [],
    inline_images: post.inline_images ?? [],
    featured: Boolean(post.featured),
    pinned_rank: Number(post.pinned_rank ?? 100),
    status: post.status,
    scheduled_publish_at: post.scheduled_publish_at || null,
    content_format: "markdown",
    meta_keywords: post.meta_keywords || null,
  };
}

function MarkdownPreview({ body }: { body: string }) {
  return (
    <div className="space-y-3 rounded-[12px] bg-black/25 p-4 text-sm leading-7 text-white/72">
      {body.split(/\n{2,}/).filter(Boolean).map((block, index) => {
        if (block.startsWith("# ")) return <h1 key={index} className="text-2xl font-black text-white">{block.slice(2)}</h1>;
        if (block.startsWith("## ")) return <h2 key={index} className="text-xl font-black text-white">{block.slice(3)}</h2>;
        if (block.startsWith("![")) {
          const match = block.match(/!\[(.*?)\]\((.*?)\)/);
          return match ? <img key={index} src={match[2]} alt={match[1]} className="max-h-72 rounded-[12px] object-cover" /> : null;
        }
        if (block.split("\n").every((line) => line.startsWith("- "))) {
          return <ul key={index} className="list-disc space-y-1 pl-5">{block.split("\n").map((line) => <li key={line}>{line.slice(2)}</li>)}</ul>;
        }
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}

export function AdminBlogEditor() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<BlogPost>(emptyPost);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"edit" | "preview" | "seo">("edit");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (query) params.set("q", query);
    const rows = await api.get<BlogPost[]>(`/blogs/admin/list${params.toString() ? `?${params}` : ""}`, { cache: "no-store" });
    setPosts(rows);
  }

  useEffect(() => {
    load().catch(() => setMessage("Could not load blogs."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const checklist = useMemo(() => [
    { label: "Draft ready", ok: form.title.length > 3 && form.body.length > 40 },
    { label: "Image added", ok: Boolean(form.cover_image_url) },
    { label: "SEO done", ok: Boolean(form.seo_title && form.seo_description && form.meta_keywords) },
    { label: "Scheduled/published", ok: form.status === "published" || Boolean(form.scheduled_publish_at) },
  ], [form]);

  function setField<K extends keyof BlogPost>(key: K, value: BlogPost[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(field: "cover_image_url" | "gallery" | "inline_images", file: File | null) {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`${apiBase}/media/upload`, {
      method: "POST",
      credentials: "include",
      headers: csrfToken() ? { "X-CSRF-Token": csrfToken() } : undefined,
      body,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.detail || "Upload failed");
    if (field === "cover_image_url") setField("cover_image_url", payload.url);
    else setField(field, [...(form[field] ?? []), payload.url]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = bodyFrom(form);
      if (selectedSlug) await api.patch(`/blogs/${selectedSlug}`, payload);
      else await api.post("/blogs", payload);
      setMessage("Blog saved.");
      await load();
      setSelectedSlug(payload.slug);
    } catch (error) {
      const detail = error instanceof ApiError && error.payload && typeof error.payload === "object" && "detail" in error.payload ? String((error.payload as { detail?: unknown }).detail) : "";
      setMessage(detail || "Blog save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function action(kind: "publish" | "archive" | "schedule" | "daily") {
    setMessage("");
    try {
      if (kind === "daily") {
        const draft = await api.post<BlogPost>("/blogs/admin/daily-draft", {});
        setForm(draft);
        setSelectedSlug(draft.slug);
      } else if (kind === "schedule") {
        await api.post(`/blogs/${form.slug}/schedule`, { scheduled_publish_at: form.scheduled_publish_at });
      } else {
        await api.post(`/blogs/${form.slug}/${kind}`, {});
      }
      setMessage(`${kind} action completed.`);
      await load();
    } catch {
      setMessage(`${kind} action failed.`);
    }
  }

  function selectPost(post: BlogPost) {
    setForm({ ...emptyPost, ...post });
    setSelectedSlug(post.slug);
  }

  return (
    <div className="grid gap-5">
      <section>
        <p className="text-xs font-black uppercase tracking-[.2em] text-[#D4960E]">Blogs</p>
        <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Daily blog publishing</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">Draft, preview, schedule and publish WheatRaja content without rebuilding the storefront.</p>
      </section>

      <section className="admin-card rounded-[14px] p-5">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => action("daily")} className="rounded-[10px] bg-[#D4960E] px-4 py-3 text-sm font-black text-[#17120A]">Generate daily draft</button>
          <button onClick={() => { setForm(emptyPost); setSelectedSlug(""); }} className="rounded-[10px] bg-white/10 px-4 py-3 text-sm font-black text-white">New blank draft</button>
          {message ? <p className="self-center text-sm font-bold text-[#D4960E]">{message}</p> : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {checklist.map((item) => <p key={item.label} className={`rounded-[10px] px-3 py-2 text-sm font-bold ${item.ok ? "bg-emerald-500/15 text-emerald-200" : "bg-white/8 text-white/50"}`}>{item.ok ? "Done" : "Todo"}: {item.label}</p>)}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="admin-card h-fit rounded-[14px] p-4">
          <div className="grid gap-3">
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") load(); }} placeholder="Search posts..." className="admin-input rounded-[10px] px-4 py-3 text-sm" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="admin-input rounded-[10px] px-4 py-3 text-sm">
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <button onClick={load} className="rounded-[10px] bg-white/10 px-4 py-3 text-sm font-black text-white">Refresh</button>
          </div>
          <div className="mt-4 grid gap-2">
            {posts.map((post) => (
              <button key={post.slug} onClick={() => selectPost(post)} className={`rounded-[10px] border p-3 text-left ${selectedSlug === post.slug ? "border-[#D4960E] bg-[#D4960E]/12" : "border-white/10 bg-white/[.03]"}`}>
                <p className="font-black text-white">{post.title}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-white/45">{post.status} / {post.category}</p>
              </button>
            ))}
          </div>
        </aside>

        <form onSubmit={submit} className="admin-card rounded-[14px] p-5">
          <div className="flex flex-wrap gap-2">
            {(["edit", "preview", "seo"] as const).map((item) => <button type="button" key={item} onClick={() => setTab(item)} className={`rounded-[10px] px-4 py-2 text-sm font-black ${tab === item ? "bg-[#D4960E] text-[#17120A]" : "bg-white/10 text-white"}`}>{item}</button>)}
          </div>

          {tab === "edit" ? (
            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Title<input value={form.title} onChange={(e) => { setField("title", e.target.value); if (!selectedSlug) setField("slug", slugify(e.target.value)); }} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Slug<input value={form.slug} onChange={(e) => setField("slug", slugify(e.target.value))} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
              </div>
              <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Excerpt<input value={form.excerpt} onChange={(e) => setField("excerpt", e.target.value)} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
              <textarea value={form.body} onChange={(e) => setField("body", e.target.value)} rows={15} className="admin-input rounded-[10px] px-4 py-4 font-mono text-sm" />
              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Category<input value={form.category} onChange={(e) => setField("category", e.target.value)} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Author<input value={form.author_name ?? ""} onChange={(e) => setField("author_name", e.target.value)} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Read time<input value={form.read_time ?? ""} onChange={(e) => setField("read_time", e.target.value)} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Tags<input value={csv(form.tags)} onChange={(e) => setField("tags", splitCsv(e.target.value))} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Status<select value={form.status} onChange={(e) => setField("status", e.target.value as BlogStatus)} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal"><option>draft</option><option>scheduled</option><option>published</option><option>archived</option></select></label>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Cover URL<input value={form.cover_image_url ?? ""} onChange={(e) => setField("cover_image_url", e.target.value)} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadImage("cover_image_url", event.target.files?.[0] ?? null)} /></label>
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Gallery URLs<input value={csv(form.gallery)} onChange={(e) => setField("gallery", splitCsv(e.target.value))} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadImage("gallery", event.target.files?.[0] ?? null)} /></label>
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Inline images<input value={csv(form.inline_images)} onChange={(e) => setField("inline_images", splitCsv(e.target.value))} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadImage("inline_images", event.target.files?.[0] ?? null)} /></label>
              </div>
            </div>
          ) : null}

          {tab === "preview" ? <div className="mt-5"><MarkdownPreview body={form.body} /></div> : null}

          {tab === "seo" ? (
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">SEO title<input value={form.seo_title ?? ""} onChange={(e) => setField("seo_title", e.target.value)} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
              <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">SEO description<input value={form.seo_description ?? ""} onChange={(e) => setField("seo_description", e.target.value)} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
              <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Meta keywords<input value={form.meta_keywords ?? ""} onChange={(e) => setField("meta_keywords", e.target.value)} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex items-center gap-3 text-sm font-bold text-white/70"><input type="checkbox" checked={Boolean(form.featured)} onChange={(e) => setField("featured", e.target.checked)} /> Featured</label>
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Pinned rank<input type="number" value={form.pinned_rank ?? 100} onChange={(e) => setField("pinned_rank", Number(e.target.value || 100))} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
                <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">Schedule ISO<input value={form.scheduled_publish_at ?? ""} onChange={(e) => setField("scheduled_publish_at", e.target.value)} className="admin-input rounded-[10px] px-3 py-3 text-sm normal-case tracking-normal" /></label>
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button disabled={saving} className="rounded-[10px] bg-[#D4960E] px-5 py-3 text-sm font-black text-[#17120A]">{saving ? "Saving..." : "Save blog"}</button>
            <button type="button" disabled={!form.slug} onClick={() => action("publish")} className="rounded-[10px] bg-emerald-500/20 px-5 py-3 text-sm font-black text-emerald-100">Publish now</button>
            <button type="button" disabled={!form.slug || !form.scheduled_publish_at} onClick={() => action("schedule")} className="rounded-[10px] bg-white/10 px-5 py-3 text-sm font-black text-white">Schedule</button>
            <button type="button" disabled={!form.slug} onClick={() => action("archive")} className="rounded-[10px] bg-red-500/15 px-5 py-3 text-sm font-black text-red-100">Archive</button>
            {form.slug ? <a href={`/blogs?preview=${encodeURIComponent(form.slug)}`} className="rounded-[10px] bg-white/10 px-5 py-3 text-sm font-black text-white">Admin preview data</a> : null}
          </div>
        </form>
      </section>
    </div>
  );
}
