"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Ban, Trash2, RotateCcw, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import * as channelService from "@/services/channelService";
import * as syncService from "@/services/syncService";
import type { AdminChannel } from "@/types";

const ALL_DOMAINS = [
  "ENGINEERING", "MEDICAL", "LAW", "COMMERCE",
  "UPSC", "PROGRAMMING", "MATHEMATICS", "SCIENCE",
];

const CATEGORIES = ["All", ...ALL_DOMAINS];

export default function AdminChannelsPage() {
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newYtId, setNewYtId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDomains, setNewDomains] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Per-channel syncing state
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  // ── Fetch channels ──────────────────────────────────────────────
  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await channelService.getAllChannels();
      setChannels(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load channels";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);

  // ── Filter logic ────────────────────────────────────────────────
  const filtered = channels.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.handle ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" ||
      c.domains.some((d) => d.toUpperCase() === activeCategory.toUpperCase());
    return matchSearch && matchCat;
  });

  const activeCount = channels.filter((c) => c.approved).length;

  // ── Add channel ─────────────────────────────────────────────────
  const handleAddChannel = async () => {
    if (!newYtId.trim() || !newName.trim() || newDomains.length === 0) {
      setModalError("All fields required — enter ID, name, and select at least 1 domain.");
      return;
    }
    setSubmitting(true);
    setModalError("");
    try {
      await channelService.addChannel(newYtId.trim(), newName.trim(), newDomains);
      setShowModal(false);
      setNewYtId(""); setNewName(""); setNewDomains([]);
      await fetchChannels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add channel";
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle approve/disable ──────────────────────────────────────
  const handleToggle = async (id: string) => {
    try {
      const updated = await channelService.toggleChannel(id);
      setChannels((prev) => prev.map((c) => c.id === id ? updated : c));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  // ── Delete channel ──────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete channel "${name}"? This cannot be undone.`)) return;
    try {
      await channelService.deleteChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  // ── Sync single channel ────────────────────────────────────────
  const handleSync = async (id: string) => {
    setSyncingIds((prev) => new Set(prev).add(id));
    try {
      await syncService.triggerChannelSync(id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  // ── Domain toggle in modal ────────────────────────────────────
  const toggleDomain = (d: string) => {
    setNewDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  // ── Loading skeleton ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="px-6 py-6 min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-48 rounded animate-pulse bg-white/[0.04] light:bg-black/[0.04]" />
          <div className="h-9 w-32 rounded-full animate-pulse bg-white/[0.04] light:bg-black/[0.04]" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1,2,3].map((i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse">
              <div className="h-4 w-20 rounded mb-2 bg-white/[0.06] light:bg-black/[0.06]" />
              <div className="h-8 w-16 rounded bg-white/[0.06] light:bg-black/[0.06]" />
            </div>
          ))}
        </div>
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-14 rounded-xl mb-2 animate-pulse bg-white/[0.03] light:bg-black/[0.03]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6 flex flex-col items-center justify-center min-h-full">
        <span className="text-4xl mb-3">⚠️</span>
        <p className="text-[#e8eaf2] light:text-[#0f1523] font-semibold mb-1">Failed to load channels</p>
        <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] mb-3">{error}</p>
        <button onClick={fetchChannels} className="px-4 py-2 rounded-full text-sm bg-brand-500 text-white hover:bg-brand-600 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold font-display text-[#e8eaf2] light:text-[#0f1523]">Channel Management</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all bg-brand-500 text-white hover:bg-brand-600">
          <Plus size={16} /> Add Channel
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Channels", value: channels.length, sub: `${activeCount} Active`, subColor: "text-emerald-400 light:text-emerald-600" },
          { label: "Approved", value: activeCount, sub: `${channels.length - activeCount} Disabled`, subColor: "text-[#4a4f66] light:text-[#7a86a8]" },
          { label: "Domains Covered", value: new Set(channels.flatMap((c) => c.domains)).size, sub: `of ${ALL_DOMAINS.length} total`, subColor: "text-[#4a4f66] light:text-[#7a86a8]" },
        ].map(({ label, value, sub, subColor }) => (
          <div key={label} className="glass rounded-xl p-4">
            <p className="text-xs text-[#8b90a7] light:text-[#3d4a6b] mb-1">{label}</p>
            <p className="text-2xl font-bold text-[#e8eaf2] light:text-[#0f1523] font-display">{value}</p>
            <p className={cn("text-xs mt-1", subColor)}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-1 max-w-[280px] bg-[#1a1a24] light:bg-white border border-white/[0.07] light:border-[rgba(200,210,235,0.40)]">
          <Search size={14} className="text-[#4a4f66] light:text-[#7a86a8]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels..."
            className="flex-1 bg-transparent text-sm text-[#e8eaf2] light:text-[#0f1523] outline-none placeholder:text-[#4a4f66] light:placeholder:text-[#7a86a8]" />
        </div>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={cn("chip", activeCategory === cat && "active")}>
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.07] light:border-[rgba(200,210,235,0.40)]">
        {/* Header */}
        <div className="grid px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#4a4f66] light:text-[#7a86a8] bg-[#13131a] light:bg-[#f0f2f8]"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 120px" }}>
          <span>Channel</span><span>Domains</span>
          <span>YouTube ID</span><span>Status</span><span>Actions</span>
        </div>
        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#8b90a7] light:text-[#3d4a6b]">
            No channels found{search ? ` matching "${search}"` : ""}.
          </div>
        ) : (
          filtered.map((ch, i) => {
            const isSyncing = syncingIds.has(ch.id);
            return (
              <div key={ch.id}
                className={cn(
                  "grid items-center px-4 py-3 transition-colors border-t border-white/[0.06] light:border-[rgba(200,210,235,0.25)]",
                  "hover:bg-white/[0.03] light:hover:bg-brand-600/[0.04]",
                  i % 2 === 0 ? "bg-[#0e0e12] light:bg-white" : "bg-[#11111a] light:bg-[#f8f9fc]",
                  !ch.approved && "opacity-60"
                )}
                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 120px" }}>
                {/* Channel */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={ch.thumbnailUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ch.name)}&backgroundColor=3b82f6`}
                      alt={ch.name} className="w-full h-full" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e8eaf2] light:text-[#0f1523] flex items-center gap-1">
                      {ch.name} <CheckCircle size={12} className="text-[#4a4f66] light:text-[#7a86a8]" />
                    </p>
                    <p className="text-xs text-[#4a4f66] light:text-[#7a86a8]">{ch.handle ?? ch.youtubeChannelId}</p>
                  </div>
                </div>
                {/* Domains */}
                <div className="flex gap-1 flex-wrap">
                  {ch.domains.slice(0, 2).map((d) => (
                    <span key={d} className="chip !text-xs !py-0.5 !px-2">
                      {d}
                    </span>
                  ))}
                  {ch.domains.length > 2 && (
                    <span className="chip !text-xs !py-0.5 !px-2">
                      +{ch.domains.length - 2}
                    </span>
                  )}
                </div>
                {/* YouTube ID */}
                <span className="text-xs text-[#4a4f66] light:text-[#7a86a8] font-mono truncate">{ch.youtubeChannelId}</span>
                {/* Status */}
                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit",
                  ch.approved
                    ? "text-emerald-400 light:text-emerald-600 bg-emerald-500/15"
                    : "text-[#8b90a7] light:text-[#7a86a8] bg-white/[0.05] light:bg-black/[0.05]"
                )}>
                  {isSyncing && <span className="mr-1 animate-pulse">●</span>}
                  {isSyncing ? "Syncing..." : ch.approved ? "Active" : "Disabled"}
                </span>
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={() => handleSync(ch.id)} disabled={isSyncing}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] light:hover:bg-black/[0.06] transition-colors disabled:opacity-40" title="Sync Now">
                    <RotateCcw size={14} className={cn("text-amber-400 light:text-amber-600", isSyncing && "animate-spin")} />
                  </button>
                  <button onClick={() => handleToggle(ch.id)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] light:hover:bg-black/[0.06] transition-colors"
                    title={ch.approved ? "Disable" : "Enable"}>
                    <Ban size={14} className={ch.approved ? "text-[#8b90a7] light:text-[#3d4a6b]" : "text-emerald-400 light:text-emerald-600"} />
                  </button>
                  <button onClick={() => handleDelete(ch.id, ch.name)}
                    className="p-1.5 rounded-lg hover:bg-red-900/20 light:hover:bg-red-100 transition-colors" title="Remove">
                    <Trash2 size={14} className="text-red-400 light:text-red-500" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination info */}
      <div className="flex items-center justify-between mt-4 text-sm text-[#8b90a7] light:text-[#3d4a6b]">
        <span>Showing {filtered.length} of {channels.length} channels</span>
      </div>

      {/* Add Channel Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 light:bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#1a1a24] light:bg-white border border-white/[0.07] light:border-[rgba(200,210,235,0.40)] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#e8eaf2] light:text-[#0f1523]">Add New Channel</h2>
              <button onClick={() => { setShowModal(false); setModalError(""); }}
                className="p-1 rounded-lg hover:bg-white/[0.06] light:hover:bg-black/[0.06] transition-colors">
                <X size={16} className="text-[#8b90a7] light:text-[#3d4a6b]" />
              </button>
            </div>

            {modalError && (
              <div className="mb-3 p-2.5 rounded-xl text-xs text-red-400 bg-red-900/15 light:bg-red-50 border border-red-900/30 light:border-red-200">
                {modalError}
              </div>
            )}

            <label className="block text-xs text-[#8b90a7] light:text-[#3d4a6b] mb-1.5">YouTube Channel ID</label>
            <input value={newYtId} onChange={(e) => setNewYtId(e.target.value)}
              placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-3 rounded-xl text-sm bg-[#0e0e12] light:bg-[#f0f2f8] text-[#e8eaf2] light:text-[#0f1523] outline-none mb-3 border border-white/[0.07] light:border-[rgba(200,210,235,0.40)] placeholder:text-[#4a4f66] light:placeholder:text-[#7a86a8]" />

            <label className="block text-xs text-[#8b90a7] light:text-[#3d4a6b] mb-1.5">Channel Name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. PhysicsWallah"
              className="w-full px-4 py-3 rounded-xl text-sm bg-[#0e0e12] light:bg-[#f0f2f8] text-[#e8eaf2] light:text-[#0f1523] outline-none mb-3 border border-white/[0.07] light:border-[rgba(200,210,235,0.40)] placeholder:text-[#4a4f66] light:placeholder:text-[#7a86a8]" />

            <label className="block text-xs text-[#8b90a7] light:text-[#3d4a6b] mb-2">Domains</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {ALL_DOMAINS.map((d) => (
                <label key={d} className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors border",
                  newDomains.includes(d)
                    ? "bg-brand-600/15 light:bg-brand-100 text-[#e8eaf2] light:text-brand-700 border-brand-500/40 light:border-brand-300"
                    : "text-[#8b90a7] light:text-[#3d4a6b] hover:bg-white/[0.04] light:hover:bg-[#f0f2f8] border-white/[0.07] light:border-[rgba(200,210,235,0.40)]"
                )}>
                  <input type="checkbox" checked={newDomains.includes(d)} onChange={() => toggleDomain(d)}
                    className="w-3.5 h-3.5 accent-blue-500" />
                  {d}
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowModal(false); setModalError(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium hover:bg-white/[0.04] light:hover:bg-[#f0f2f8] transition-colors text-[#8b90a7] light:text-[#3d4a6b]">
                Cancel
              </button>
              <button onClick={handleAddChannel} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 bg-brand-500 text-white hover:bg-brand-600">
                {submitting ? "Adding..." : "Add Channel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
