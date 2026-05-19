"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle, Play, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import * as syncService from "@/services/syncService";
import type { SyncLog, SyncResultResponse } from "@/types";
import { formatTimeAgo } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; lightColor: string; label: string }> = {
  SUCCESS: { icon: CheckCircle,    color: "text-emerald-400", lightColor: "light:text-emerald-600", label: "Success" },
  FAILED:  { icon: XCircle,        color: "text-red-400",     lightColor: "light:text-red-500",     label: "Failed" },
  PARTIAL: { icon: AlertTriangle,  color: "text-amber-400",   lightColor: "light:text-amber-600",   label: "Partial" },
};

export default function AdminSyncPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResultResponse[] | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [syncFreq, setSyncFreq] = useState("6");

  // ── Fetch sync logs ─────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await syncService.getSyncLogs(0, 30);
      setLogs(data.content);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load sync logs";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Trigger full sync ───────────────────────────────────────────
  const handleFullSync = async () => {
    setIsSyncing(true);
    setSyncResults(null);
    try {
      const results = await syncService.triggerFullSync();
      setSyncResults(results);
      await fetchLogs();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Derived stats ───────────────────────────────────────────────
  const successCount = logs.filter((l) => l.status === "SUCCESS").length;
  const failedCount = logs.filter((l) => l.status === "FAILED").length;
  const totalAdded = logs.reduce((sum, l) => sum + l.videosAdded, 0);
  const lastSync = logs.length > 0 ? logs[0] : null;
  const lastSyncTime = lastSync?.syncedAt ? formatTimeAgo(lastSync.syncedAt) : "Never";
  const lastSyncDate = lastSync?.syncedAt
    ? new Date(lastSync.syncedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
  const avgDuration = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + l.durationMs, 0) / logs.length / 1000)
    : 0;

  const failedLogs = logs.filter((l) => l.status === "FAILED" && l.errorMessage);

  // ── Loading ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="px-6 py-6 min-h-full">
        <div className="h-7 w-48 rounded animate-pulse mb-6 bg-white/[0.04] light:bg-black/[0.04]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map((i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse">
              <div className="h-4 w-20 rounded mb-2 bg-white/[0.06] light:bg-black/[0.06]" />
              <div className="h-7 w-16 rounded bg-white/[0.06] light:bg-black/[0.06]" />
            </div>
          ))}
        </div>
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="h-14 rounded-xl mb-2 animate-pulse bg-white/[0.03] light:bg-black/[0.03]" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-6 py-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold font-display text-[#e8eaf2] light:text-[#0f1523]">Sync Status</h1>
          <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] mt-0.5">Monitor and control video syncing from YouTube</p>
        </div>
        <button
          onClick={handleFullSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50 bg-emerald-500 light:bg-emerald-600 text-white hover:bg-emerald-600 light:hover:bg-emerald-700">
          <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
          {isSyncing ? "Syncing..." : "Trigger Full Sync"}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Clock,       label: "Last Sync",        value: lastSyncTime, sub: lastSyncDate,                 color: "#3b82f6" },
          { icon: CheckCircle, label: "Successful Syncs", value: `${successCount}`, sub: `${failedCount} failed`, color: "#34d399", subWarn: failedCount > 0 },
          { icon: Play,        label: "Videos Added",     value: `+${totalAdded}`,  sub: "From sync logs",        color: "#a78bfa" },
          { icon: RefreshCw,   label: "Avg Duration",     value: `${avgDuration}s`, sub: `${logs.length} total syncs`, color: "#fbbf24" },
        ].map(({ icon: Icon, label, value, sub, color, subWarn }) => (
          <div key={label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <span className="text-xs text-[#8b90a7] light:text-[#3d4a6b]">{label}</span>
            </div>
            <p className="text-xl font-bold text-[#e8eaf2] light:text-[#0f1523] font-display">{value}</p>
            <p className={cn("text-xs mt-1", subWarn ? "text-amber-400 light:text-amber-600" : "text-[#4a4f66] light:text-[#7a86a8]")}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Active Sync Banner */}
      {isSyncing && (
        <div className="rounded-xl p-4 mb-6 flex items-center gap-4 bg-emerald-950/40 light:bg-emerald-50 border border-emerald-800/40 light:border-emerald-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#e8eaf2] light:text-[#0f1523]">Full sync in progress...</p>
            <p className="text-xs text-[#8b90a7] light:text-[#3d4a6b] mt-0.5">Syncing all approved channels. This may take 10-20 seconds.</p>
          </div>
        </div>
      )}

      {/* Sync Results Summary */}
      {syncResults && !isSyncing && (
        <div className="rounded-xl p-4 mb-6 bg-emerald-950/30 light:bg-emerald-50 border border-emerald-800/30 light:border-emerald-200">
          <p className="text-sm font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-2">
            ✅ Sync Complete — {syncResults.length} channel{syncResults.length !== 1 ? "s" : ""} processed
          </p>
          <div className="flex gap-4 text-xs">
            <span className="text-emerald-400 light:text-emerald-600">{syncResults.filter((r) => r.status === "SUCCESS").length} Succeeded</span>
            <span className="text-red-400 light:text-red-500">{syncResults.filter((r) => r.status === "FAILED").length} Failed</span>
            <span className="text-[#8b90a7] light:text-[#3d4a6b]">+{syncResults.reduce((s, r) => s + r.videosAdded, 0)} videos added</span>
          </div>
          <button onClick={() => setSyncResults(null)}
            className="mt-2 text-xs text-[#4a4f66] light:text-[#7a86a8] hover:text-[#8b90a7] light:hover:text-[#3d4a6b] transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {/* Sync History Table */}
      <div className="rounded-2xl overflow-hidden mb-6 border border-white/[0.07] light:border-[rgba(200,210,235,0.40)]">
        <div className="px-4 py-3 flex items-center">
          <h2 className="text-sm font-semibold text-[#e8eaf2] light:text-[#0f1523]">Sync History</h2>
        </div>
        <div className="grid px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#4a4f66] light:text-[#7a86a8] bg-[#13131a] light:bg-[#f0f2f8]"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr" }}>
          <span>Channel</span><span>Videos Found</span><span>Videos Added</span>
          <span>Duration</span><span>Status</span><span>Timestamp</span>
        </div>

        {error ? (
          <div className="px-4 py-8 text-center text-sm text-red-400">{error}</div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#8b90a7] light:text-[#3d4a6b]">
            No sync logs yet. Trigger a sync to get started.
          </div>
        ) : (
          logs.map((row, i) => {
            const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.FAILED;
            const Icon = cfg.icon;
            const durationStr = row.durationMs >= 1000 ? `${(row.durationMs / 1000).toFixed(1)}s` : `${row.durationMs}ms`;
            const timeAgo = row.syncedAt ? formatTimeAgo(row.syncedAt) : "—";
            return (
              <div key={row.id}>
                <div
                  className={cn(
                    "grid items-center px-4 py-3 transition-colors border-t border-white/[0.06] light:border-[rgba(200,210,235,0.25)]",
                    "hover:bg-white/[0.03] light:hover:bg-brand-600/[0.04]",
                    i % 2 === 0 ? "bg-[#0e0e12] light:bg-white" : "bg-[#11111a] light:bg-[#f8f9fc]"
                  )}
                  style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr" }}>
                  <span className="text-sm text-[#e8eaf2] light:text-[#0f1523]">{row.channelName}</span>
                  <span className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">{row.videosFound}</span>
                  <span className={cn("text-sm", row.videosAdded > 0 ? "text-emerald-400 light:text-emerald-600" : "text-[#4a4f66] light:text-[#7a86a8]")}>
                    {row.videosAdded > 0 ? `+${row.videosAdded}` : "—"}
                  </span>
                  <span className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">{durationStr}</span>
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className={cn(cfg.color, cfg.lightColor)} />
                    <span className={cn("text-xs font-medium", cfg.color, cfg.lightColor)}>{cfg.label}</span>
                  </div>
                  <span className="text-xs text-[#4a4f66] light:text-[#7a86a8]">{timeAgo}</span>
                </div>
                {row.status === "FAILED" && row.errorMessage && (
                  <div className="px-4 py-2 text-xs flex items-center gap-2 bg-red-950/20 light:bg-red-50 border-t border-red-900/20 light:border-red-200">
                    <span className="text-red-400 light:text-red-500">⚠ {row.errorMessage}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Failed Syncs Alert */}
      {failedLogs.length > 0 && (
        <div className="rounded-xl p-4 mb-6 bg-red-950/20 light:bg-red-50 border border-red-900/30 light:border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-400 light:text-amber-600" />
            <span className="text-sm font-semibold text-[#e8eaf2] light:text-[#0f1523]">{failedLogs.length} channel{failedLogs.length !== 1 ? "s" : ""} need attention</span>
          </div>
          {failedLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center justify-between py-2 border-t border-red-900/30 light:border-red-200">
              <div>
                <span className="text-sm font-medium text-[#e8eaf2] light:text-[#0f1523]">{log.channelName}: </span>
                <span className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">{log.errorMessage}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-Sync Settings */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={16} className="text-[#8b90a7] light:text-[#3d4a6b]" />
          <h2 className="text-sm font-semibold text-[#e8eaf2] light:text-[#0f1523]">Auto-Sync Settings</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#e8eaf2] light:text-[#0f1523]">Enable Auto-Sync</p>
              <p className="text-xs text-[#8b90a7] light:text-[#3d4a6b]">Syncs all active channels on schedule</p>
            </div>
            <button onClick={() => setAutoSync(!autoSync)}
              className={cn("w-11 h-6 rounded-full transition-colors relative",
                autoSync ? "bg-emerald-500" : "bg-[#444] light:bg-[#ccc]"
              )}>
              <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm",
                autoSync ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">Sync Frequency</label>
            <select value={syncFreq} onChange={(e) => setSyncFreq(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-sm bg-[#0e0e12] light:bg-[#f0f2f8] text-[#e8eaf2] light:text-[#0f1523] outline-none border border-white/[0.07] light:border-[rgba(200,210,235,0.40)]">
              <option value="1">Every 1 hour</option>
              <option value="3">Every 3 hours</option>
              <option value="6">Every 6 hours</option>
              <option value="12">Every 12 hours</option>
              <option value="24">Every 24 hours</option>
            </select>
          </div>
          <p className="text-xs text-[#4a4f66] light:text-[#7a86a8]">
            Backend auto-sync runs every {syncFreq} hours. Use &quot;Trigger Full Sync&quot; for immediate sync.
          </p>
          <button className="px-5 py-2 rounded-full text-sm font-semibold w-fit transition-all bg-brand-500 text-white hover:bg-brand-600">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
