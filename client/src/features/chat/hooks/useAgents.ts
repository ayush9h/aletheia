import { useEffect, useState } from "react";
import { getAgents, type AgentResponse } from "@/lib/api/user-data";

// Shared so every plan panel reuses one request
let agentsRequest: Promise<AgentResponse[]> | null = null;

// Load the agents a user can select in chat
export function useAgents() {
  const [agents, setAgents] = useState<AgentResponse[]>([]);

  useEffect(() => {
    (agentsRequest ??= getAgents())
      .then(setAgents)
      .catch(() => {
        agentsRequest = null;
        setAgents([]);
      });
  }, []);

  return agents;
}
