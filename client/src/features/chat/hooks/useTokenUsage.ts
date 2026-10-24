import { useCallback, useEffect, useState } from "react";
import { getUserUsage, type UsageResponse } from "@/lib/api/user-data";

// Fetch the user's monthly token usage; call refresh after each message
export function useTokenUsage(userId: string | undefined) {
  const [usage, setUsage] = useState<UsageResponse | null>(null);

  const refresh = useCallback(() => {
    if (!userId) return;

    getUserUsage(userId)
      .then(setUsage)
      .catch(() => setUsage(null));
  }, [userId]);

  useEffect(refresh, [refresh]);

  return { usage, refresh };
}
