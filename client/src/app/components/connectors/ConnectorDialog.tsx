"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

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
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="font-paragraph max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="text-base font-medium">
            Connectors
          </DialogTitle>

          <DialogDescription className="text-xs text-stone-500">
            Connect your apps to give your assistant access to your data.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-yellow-200 bg-yellow-50 px-5 py-2.5">
          <p className="text-xs font-medium text-yellow-800">
            Work in progress
          </p>
        </div>

        <div className="p-3">
          <div className="mb-3 flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3">
            <Search className="h-4 w-4 shrink-0 text-stone-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search connectors..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
              autoFocus
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-stone-400 hover:text-stone-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {CATEGORY_ORDER.map((category) => {
              const connectors = filteredConnectors.filter(
                (connector) => connector.category === category
              );

              if (connectors.length === 0) {
                return null;
              }

              return (
                <section key={category} className="mb-4 last:mb-0">
                  <h3 className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    {category}
                  </h3>

                  <div className="space-y-0.5">
                    {connectors.map((connector) => {
                      const Icon = connector.icon;

                      return (
                        <button
                          key={connector.id}
                          type="button"
                          onClick={() => {
                            console.log(
                              "Connect:",
                              connector.id
                            );
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-stone-100"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white">
                            <Icon className="h-4 w-4 text-stone-600" />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-stone-800">
                              {connector.name}
                            </span>

                            <span className="block truncate text-xs text-stone-500">
                              {connector.description}
                            </span>
                          </span>

                          <span className="text-xs text-stone-400">
                            Connect
                          </span>
                        </button>
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
