import { useEffect, useState } from "react";
import { getAgents, type AgentResponse } from "@/lib/api/user-data";

// Load the agents a user can select in chat
export function useAgents() {
  const [agents, setAgents] = useState<AgentResponse[]>([]);

  useEffect(() => {
    getAgents()
      .then(setAgents)
      .catch(() => setAgents([]));
  }, []);

  return agents;
}
