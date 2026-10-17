import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Slack } from "lucide-react";
export type ConnectorCategory =
  | "Email"
  | "Files"
  | "Calendar"
  | "Communication"
  | "Knowledge"
  | "Development"
  | "Productivity";

export type Connector = {
  id: string;
  name: string;
  description: string;
  category: ConnectorCategory;
  icon: React.ElementType;
};

export const CONNECTORS: Connector[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Search repositories and issues",
    category: "Development",
    icon: GitHubLogoIcon,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Search messages and read channels",
    category: "Communication",
    icon: Slack,
  },
];
