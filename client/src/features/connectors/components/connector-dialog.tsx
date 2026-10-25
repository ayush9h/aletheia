"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, PlugIcon, RefreshCw, Search, ShieldCheck, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CONNECTORS,
  type Connector,
  type ConnectorCategory,
} from "@/features/connectors/constants/connector-data";

type ConnectedConnector = {
  provider: string;
  providerUserId: string | null;
  providerUsername: string | null;
  status: string;
};

type ConnectorsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
};

const CATEGORY_ORDER: ConnectorCategory[] = [
  "Email",
  "Files",
  "Calendar",
  "Communication",
  "Knowledge",
  "Development",
  "Productivity",
];

// Only categories that actually have connectors appear as filter tabs
const CATEGORIES = ["All", ...CATEGORY_ORDER.filter((c) => CONNECTORS.some((x) => x.category === c))];

const BUTTON_BASE =
  "inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed";

export default function ConnectorsDialog({ open, onOpenChange, userId }: ConnectorsDialogProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connected, setConnected] = useState<ConnectedConnector[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;

    setLoading(true);
    fetch(`/api/connectors?user_id=${encodeURIComponent(userId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to fetch connectors"))))
      .then((data) => setConnected(data.connectors ?? []))
      .catch((error) => {
        console.error("Failed to load connectors:", error);
        setConnected([]);
      })
      .finally(() => setLoading(false));
  }, [open, userId]);

  // OAuth popup reports back via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "connector") return;

      const { connector, status } = event.data;
      if (!connector) return;

      setConnectingId(null);
      if (status !== "connected") return;

      setConnected((current) => [
        ...current.filter((item) => item.provider !== connector),
        { provider: connector, providerUserId: null, providerUsername: null, status: "connected" },
      ]);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return CONNECTORS.filter(
      (c) =>
        (category === "All" || c.category === category) &&
        [c.name, c.description, c.category].some((v) => v.toLowerCase().includes(query)),
    );
  }, [search, category]);

  const connectedCount = connected.filter((c) => c.status === "connected").length;

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      setSearch("");
      setCategory("All");
      setConnectingId(null);
    }
  };

  const handleConnect = (connectorId: string) => {
    setConnectingId(connectorId);

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `/api/connectors/${connectorId}`,
      `${connectorId}-oauth`,
      `width=${width},height=${height},left=${left},top=${top}`,
    );
    if (!popup) return setConnectingId(null);

    // Reset the spinner if the user closes the popup without finishing
    const checkPopup = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(checkPopup);
      setConnectingId(null);
    }, 500);
    window.setTimeout(() => window.clearInterval(checkPopup), 10 * 60 * 1000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="font-paragraph flex h-[85dvh] max-h-[85dvh] w-[calc(100%-1rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-stone-200 bg-white p-0 text-stone-900 shadow-2xl shadow-stone-900/10 dark:border-stone-700/50 dark:shadow-black/50 dark:bg-stone-900 dark:text-stone-100 sm:w-[calc(100%-2rem)]">
        <DialogHeader className="shrink-0 space-y-0 border-b border-stone-200 bg-stone-50 px-5 py-5 pr-14 dark:border-stone-700/50 dark:bg-stone-950 sm:px-6">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200">
              <PlugIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 text-left">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                Connectors
                <span className="rounded-full border border-stone-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500 dark:border-stone-700 dark:text-stone-400">
                  Beta
                </span>
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                Give Aletheia secure access to your apps and data.{" "}
                <span className="text-stone-700 dark:text-stone-300">
                  {connectedCount} of {CONNECTORS.length} connected
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="shrink-0 space-y-3 px-5 pt-4 sm:px-6">
          <label className="flex h-10 items-center gap-2.5 rounded-lg border border-stone-200 bg-stone-50 px-3 transition-colors focus-within:border-stone-300 focus-within:bg-white dark:border-stone-700/50 dark:bg-stone-800/50 dark:focus-within:border-stone-600">
            <Search className="h-4 w-4 shrink-0 text-stone-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search connectors"
              aria-label="Search connectors"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="shrink-0 cursor-pointer text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          <div role="tablist" className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={`h-8 shrink-0 cursor-pointer rounded-full px-3.5 text-[13px] font-medium transition-colors duration-150 ${
                  category === c
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-gutter:stable] sm:px-6">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {CONNECTORS.map((c) => (
                <div key={c.id} className="h-[8.5rem] animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800/50" />
              ))}
            </div>
          ) : filtered.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((connector) => (
                <ConnectorCard
                  key={connector.id}
                  connector={connector}
                  account={connected.find((c) => c.provider === connector.id)}
                  isConnecting={connectingId === connector.id}
                  onConnect={handleConnect}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-14 text-center">
              <Search className="mb-3 h-5 w-5 text-stone-300 dark:text-stone-600" />
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">No connectors found</p>
              <p className="mt-1 text-xs text-stone-500">Try a different name or category.</p>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-stone-200 bg-stone-50 px-5 py-3 text-xs text-stone-500 dark:border-stone-700/50 dark:bg-stone-950 dark:text-stone-400 sm:px-6">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Connections use OAuth. Connectors need to be reconnected after 24 hours.
        </footer>
      </DialogContent>
    </Dialog>
  );
}

type ConnectorCardProps = {
  connector: Connector;
  account?: ConnectedConnector;
  isConnecting: boolean;
  onConnect: (id: string) => void;
};

// Single connector tile with status-aware action
function ConnectorCard({ connector, account, isConnecting, onConnect }: ConnectorCardProps) {
  const Icon = connector.icon;
  const isConnected = account?.status === "connected";
  const needsReconnect = account?.status === "reauth";

  return (
    <article
      className={`flex flex-col rounded-xl border bg-white p-4 transition-all duration-150 dark:bg-stone-800/30 ${
        isConnected
          ? "border-emerald-200 dark:border-emerald-900/50"
          : "border-stone-200 hover:border-stone-300 hover:shadow-sm dark:border-stone-700/50 dark:hover:border-stone-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-800">
          <Icon className="h-5 w-5 text-stone-700 dark:text-stone-200" />
        </span>
        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400">
          {connector.category}
        </span>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-stone-900 dark:text-stone-100">{connector.name}</h3>
      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-stone-500 dark:text-stone-400">
        {connector.description}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
          <span
            className={`size-1.5 shrink-0 rounded-full ${
              isConnected ? "bg-emerald-500" : needsReconnect ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-600"
            }`}
          />
          <span className="truncate">
            {isConnected
              ? account?.providerUsername
                ? `@${account.providerUsername}`
                : "Active"
              : needsReconnect
                ? "Access expired"
                : "Not connected"}
          </span>
        </span>

        {isConnected ? (
          <span className={`${BUTTON_BASE} cursor-default bg-emerald-50 text-emerald-700 active:scale-100 dark:bg-emerald-950/40 dark:text-emerald-400`}>
            <Check className="size-3.5" />
            Connected
          </span>
        ) : (
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => onConnect(connector.id)}
            className={`${BUTTON_BASE} border disabled:opacity-70 ${
              needsReconnect
                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
                : "border-stone-200 bg-white text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            }`}
          >
            {isConnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              needsReconnect && <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isConnecting ? "Connecting" : needsReconnect ? "Reconnect" : "Connect"}
          </button>
        )}
      </div>
    </article>
  );
}
