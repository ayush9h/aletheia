"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

import {
  CONNECTORS,
  ConnectorCategory,
} from "./connector-data";

type ConnectorsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}: ConnectorsDialogProps) {
  const [search, setSearch] = useState("");
  const [connectingId, setConnectingId] = useState<string | null>(
    null
  );

  /*
   * Listen for the result from the OAuth popup.
   */
  useEffect(() => {
    const handleConnectorMessage = (event: MessageEvent) => {
      // Only accept messages from this application.
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== "connector") {
        return;
      }

      const { connector } = event.data;

      if (!connector) {
        return;
      }

      // OAuth has finished.
      if (connector === "github") {
        setConnectingId(null);
      }
    };

    window.addEventListener("message", handleConnectorMessage);

    return () => {
      window.removeEventListener(
        "message",
        handleConnectorMessage
      );
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
        connector.category.toLowerCase().includes(query)
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

    const left =
      window.screenX +
      (window.outerWidth - width) / 2;

    const top =
      window.screenY +
      (window.outerHeight - height) / 2;

    const popup = window.open(
      "/api/connectors/github",
      "github-oauth",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Browser blocked the popup.
    if (!popup) {
      setConnectingId(null);
      return;
    }

    /*
     * If the user closes the popup without completing OAuth,
     * reset the button back to "Connect".
     */
    const checkPopup = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(checkPopup);
        setConnectingId(null);
      }
    }, 500);

    /*
     * Safety cleanup in case something unexpected happens.
     */
    window.setTimeout(() => {
      window.clearInterval(checkPopup);
    }, 10 * 60 * 1000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="font-paragraph max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="text-base font-medium">
            Connectors
          </DialogTitle>

          <DialogDescription className="text-xs text-stone-500">
            Connect your apps to give your assistant access
            to your data.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-yellow-200 bg-yellow-50 px-5 py-2.5">
          <p className="text-xs font-medium text-yellow-800">
            Work in progress
          </p>
        </div>

        <div className="p-3">
          {/* Search */}
          <div className="mb-3 flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3">
            <Search className="h-4 w-4 shrink-0 text-stone-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search connectors..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
              autoFocus
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="cursor-pointer text-stone-400 transition-colors hover:text-stone-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Connector list */}
          <div
            className="
              max-h-[420px]
              overflow-y-auto
              pr-1.5
              [scrollbar-gutter:stable]
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-stone-300
              [&::-webkit-scrollbar-thumb:hover]:bg-stone-400
            "
          >
            {CATEGORY_ORDER.map((category) => {
              const connectors = filteredConnectors.filter(
                (connector) =>
                  connector.category === category
              );

              if (connectors.length === 0) {
                return null;
              }

              return (
                <section
                  key={category}
                  className="mb-4 last:mb-0"
                >
                  <h3 className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    {category}
                  </h3>

                  <div className="space-y-0.5">
                    {connectors.map((connector) => {
                      const Icon = connector.icon;

                      const isConnecting =
                        connectingId === connector.id;

                      return (
                        <div
                          key={connector.id}
                          className="
                            flex
                            items-center
                            gap-3
                            rounded-lg
                            px-2.5
                            py-2.5
                          "
                        >
                          {/* Icon */}
                          <span
                            className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-stone-200
                              bg-white
                            "
                          >
                            <Icon className="h-4 w-4 text-stone-600" />
                          </span>

                          {/* Connector information */}
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-stone-800">
                              {connector.name}
                            </span>

                            <span className="block truncate text-xs text-stone-500">
                              {connector.description}
                            </span>
                          </div>

                          {/* Connect button */}
                          <button
                            type="button"
                            disabled={isConnecting}
                            onClick={() =>
                              handleConnect(
                                connector.id
                              )
                            }
                            className="
                              inline-flex
                              h-8
                              min-w-[76px]
                              shrink-0
                              cursor-pointer
                              items-center
                              justify-center
                              gap-1.5
                              rounded-md
                              border
                              border-stone-200
                              bg-white
                              px-2.5
                              text-xs
                              font-medium
                              text-stone-700
                              shadow-sm
                              transition-all
                              hover:border-stone-300
                              hover:bg-stone-50
                              hover:text-stone-900
                              active:scale-[0.98]
                              disabled:cursor-not-allowed
                              disabled:opacity-70
                            "
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>
                                  Connecting
                                </span>
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
                <p className="text-sm text-stone-500">
                  No connectors found.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
