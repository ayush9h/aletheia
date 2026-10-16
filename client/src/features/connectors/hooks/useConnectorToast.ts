import { useEffect } from "react";
import { toast } from "sonner";

// Shows a toast when the connector OAuth popup posts its result back
export function useConnectorToast() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "connector") return;

      const { connector, status } = event.data;
      if (!connector || !status) return;

      const name = connector.charAt(0).toUpperCase() + connector.slice(1);

      if (status === "connected") {
        toast.success(`${name} connected successfully`, {
          className: "!border-green-200 !bg-green-50 !text-green-800",
        });
      }
      if (status === "error") toast.error(`Unable to connect ${name}`);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
}
