"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

import { CONNECTORS, ConnectorCategory } from "./connector-data";

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

export default function ConnectorsDialog({
  open,
  onOpenChange,
  userId,
}: ConnectorsDialogProps) {
  const [search, setSearch] = useState("");
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedConnectors, setConnectedConnectors] = useState<ConnectedConnector[]>([]);
  const [loadingConnectors, setLoadingConnectors] = useState(false);

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    const loadConnectors = async () => {
      try {
        setLoadingConnectors(true);

        const response = await fetch(`/api/connectors?user_id=${encodeURIComponent(userId)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch connectors");
        }

        const data = await response.json();
        setConnectedConnectors(data.connectors ?? []);
      } catch (error) {
        console.error("Failed to load connectors:", error);
        setConnectedConnectors([]);
      } finally {
        setLoadingConnectors(false);
      }
    };

    loadConnectors();
  }, [open, userId]);

  useEffect(() => {
    const handleConnectorMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== "connector") {
        return;
      }

      const { connector, status } = event.data;

      if (!connector) {
        return;
      }

      if (connector === "github") {
        setConnectingId(null);

        if (status === "connected") {
          setConnectedConnectors((current) => {
            const alreadyConnected = current.some(
              (item) => item.provider === connector && item.status === "connected",
            );

            if (alreadyConnected) {
              return current;
            }

            return [
              ...current,
              {
                provider: connector,
                providerUserId: null,
                providerUsername: null,
                status: "connected",
              },
            ];
          });
        }
      }
    };

    window.addEventListener("message", handleConnectorMessage);

    return () => {
      window.removeEventListener("message", handleConnectorMessage);
    };
  }, []);

  const filteredConnectors = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return CONNECTORS;
    }

    return CONNECTORS.filter(
      (connector) =>
        connector.name.toLowerCase().includes(query) ||
        connector.description.toLowerCase().includes(query) ||
        connector.category.toLowerCase().includes(query),
    );
  }, [search]);

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);

    if (!value) {
      setSearch("");
      setConnectingId(null);
    }
  };

  const handleConnect = (connectorId: string) => {
    if (connectorId !== "github") {
      return;
    }

    setConnectingId(connectorId);

    const width = 600;
    const height = 700;

    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/api/connectors/github",
      "github-oauth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      setConnectingId(null);
      return;
    }

    const checkPopup = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(checkPopup);
        setConnectingId(null);
      }
    }, 500);

    window.setTimeout(() => {
      window.clearInterval(checkPopup);
    }, 10 * 60 * 1000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="font-paragraph max-w-lg gap-0 overflow-hidden border-stone-200 bg-white p-0 text-stone-900 dark:border-stone-700/50 dark:bg-stone-950 dark:text-stone-100">
        <DialogHeader className="border-b border-stone-200 px-5 py-4 dark:border-stone-700/50">
          <DialogTitle className="text-base font-medium text-stone-900 dark:text-stone-100">
            Connectors
          </DialogTitle>

          <DialogDescription className="text-xs text-stone-500 dark:text-stone-400">
            Connect your apps to give your assistant access to your data.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-yellow-200 bg-yellow-50 px-5 py-2.5 dark:border-yellow-900/60 dark:bg-yellow-950/30">
          <p className="text-xs font-medium text-yellow-800 dark:text-yellow-400">
            Work in progress
          </p>
        </div>

        <div className="p-3">
          <div className="mb-3 flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 dark:border-stone-700 dark:bg-stone-900">
            <Search className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search connectors..."
              className="min-w-0 flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
              autoFocus
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="cursor-pointer text-stone-400 transition-colors hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto pr-1.5 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-thumb:hover]:bg-stone-400 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 dark:[&::-webkit-scrollbar-thumb:hover]:bg-stone-600">
            {loadingConnectors ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-4 w-4 animate-spin text-stone-400 dark:text-stone-500" />
              </div>
            ) : (
              <>
                {CATEGORY_ORDER.map((category) => {
                  const connectors = filteredConnectors.filter(
                    (connector) => connector.category === category,
                  );

                  if (connectors.length === 0) {
                    return null;
                  }

                  return (
                    <section key={category} className="mb-4 last:mb-0">
                      <h3 className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                        {category}
                      </h3>

                      <div className="space-y-0.5">
                        {connectors.map((connector) => {
                          const Icon = connector.icon;

                          const isConnecting = connectingId === connector.id;

                          const isConnected = connectedConnectors.some(
                            (connected) =>
                              connected.provider === connector.id &&
                              connected.status === "connected",
                          );

                          return (
                            <div
                              key={connector.id}
                              className="flex items-center gap-3 rounded-lg px-2.5 py-2.5"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                                <Icon className="h-4 w-4 text-stone-600 dark:text-stone-300" />
                              </span>

                              <div className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">
                                  {connector.name}
                                </span>

                                <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                                  {connector.description}
                                </span>
                              </div>

                              <button
                                type="button"
                                disabled={isConnecting || isConnected}
                                onClick={() => handleConnect(connector.id)}
                                className={
                                  isConnected
                                    ? "inline-flex h-8 min-w-[88px] shrink-0 cursor-default items-center justify-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-2.5 text-xs font-medium text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-400"
                                    : "inline-flex h-8 min-w-[76px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                                }
                              >
                                {isConnecting ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Connecting</span>
                                  </>
                                ) : isConnected ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Connected</span>
                                  </>
                                ) : (
                                  "Connect"
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}

                {filteredConnectors.length === 0 && (
                  <div className="px-3 py-10 text-center">
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      No connectors found.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
