"use client";
import { BASE_PATH } from "@/lib/site";

import { useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

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

const CATEGORIES = ["All", ...CATEGORY_ORDER.filter((c) => CONNECTORS.some((x) => x.category === c))];

const BUTTON_BASE =
  "inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed";

export default function ConnectorsDialog({ open, onOpenChange, userId }: ConnectorsDialogProps) {
  const [category, setCategory] = useState("All");
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connected, setConnected] = useState<ConnectedConnector[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;

    setLoading(true);
    fetch(`${BASE_PATH}/api/connectors?user_id=${encodeURIComponent(userId)}`, { cache: "no-store" })
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

  const connectedCount = connected.filter((c) => c.status === "connected").length;
  const filtered = CONNECTORS.filter((c) => category === "All" || c.category === category);

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
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
      `${BASE_PATH}/api/connectors/${connectorId}`,
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
      <DialogContent className="font-paragraph flex max-h-[85dvh] w-[calc(100%-1rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-2xl border-stone-200 bg-white p-0 text-stone-900 shadow-2xl shadow-stone-900/10 dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-100 dark:shadow-black/50 sm:w-[calc(100%-2rem)]">
        <DialogHeader className="shrink-0 space-y-0 border-b border-stone-200 bg-stone-50 px-6 py-4 pr-12 text-left dark:border-stone-700/50 dark:bg-stone-950">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            Connectors
            <span className="rounded-full border border-stone-200 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-stone-500 dark:border-stone-700 dark:text-stone-400">
              Beta
            </span>
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Give Aletheia secure access to your apps.{" "}
            {connectedCount} of {CONNECTORS.length} connected
          </DialogDescription>
        </DialogHeader>

        <div role="tablist" className="flex shrink-0 gap-1.5 overflow-x-auto px-6 pt-3 pb-2 [scrollbar-width:none]">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={`h-7 shrink-0 cursor-pointer rounded-full px-3 text-xs font-medium transition-colors duration-150 ${
                category === c
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-stone-200 overflow-y-auto px-2 pb-2 dark:divide-stone-700/50">
          {filtered.map((connector) =>
            loading ? (
              <li key={connector.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="size-10 animate-pulse rounded-lg bg-stone-100 dark:bg-stone-800" />
                <span className="h-3 w-32 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
              </li>
            ) : (
              <ConnectorRow
                key={connector.id}
                connector={connector}
                account={connected.find((c) => c.provider === connector.id)}
                isConnecting={connectingId === connector.id}
                onConnect={handleConnect}
              />
            ),
          )}
        </ul>

        <footer className="flex shrink-0 items-center gap-1.5 border-t border-stone-200 bg-stone-50 px-6 py-2.5 text-xs text-stone-500 dark:border-stone-700/50 dark:bg-stone-950 dark:text-stone-400">
          <ShieldCheck className="size-3.5 shrink-0" />
          Secured with OAuth. Reconnect if access expires.
        </footer>
      </DialogContent>
    </Dialog>
  );
}

type ConnectorRowProps = {
  connector: Connector;
  account?: ConnectedConnector;
  isConnecting: boolean;
  onConnect: (id: string) => void;
};

function ConnectorRow({ connector, account, isConnecting, onConnect }: ConnectorRowProps) {
  const Icon = connector.icon;
  const isConnected = account?.status === "connected";
  const needsReconnect = account?.status === "reauth";
  const username = account?.providerUsername;

  return (
    <li className="flex items-center gap-3.5 px-4 py-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800">
        <Icon className="size-5 text-stone-700 dark:text-stone-200" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
          {connector.name}
          <span className="rounded-md bg-stone-100 px-1.5 py-px text-[10px] font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            {connector.category}
          </span>
        </p>
        <p className="truncate text-xs text-stone-500 dark:text-stone-400">
          {isConnected && username
            ? username.includes("@")
              ? username
              : `@${username}`
            : needsReconnect
              ? "Access expired"
              : connector.description}
        </p>
      </div>

      {isConnected ? (
        <span className="inline-flex h-8 shrink-0 items-center gap-1 px-1 text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="size-3.5" />
          Connected
        </span>
      ) : (
        <button
          type="button"
          disabled={isConnecting}
          onClick={() => onConnect(connector.id)}
          aria-label={`${needsReconnect ? "Reconnect" : "Connect"} ${connector.name}`}
          className={`${BUTTON_BASE} border disabled:opacity-70 ${
            needsReconnect
              ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
              : "border-stone-200 bg-white text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          }`}
        >
          {isConnecting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            needsReconnect && <RefreshCw className="size-3.5" />
          )}
          {isConnecting ? "Connecting" : needsReconnect ? "Reconnect" : "Connect"}
        </button>
      )}
    </li>
  );
}
