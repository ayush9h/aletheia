// connectors/connector-data.ts

import {
  CalendarDays,
  Cloud,
  FileText,
  Mail,
  MessageSquare,
  NotebookTabs,
  Table2,
} from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
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
    id: "gmail",
    name: "Gmail",
    description: "Search and work with your emails",
    category: "Email",
    icon: Mail,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Search and analyze your files",
    category: "Files",
    icon: Cloud,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "View and manage your schedule",
    category: "Calendar",
    icon: CalendarDays,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Search your conversations",
    category: "Communication",
    icon: MessageSquare,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Search your workspace",
    category: "Knowledge",
    icon: NotebookTabs,
  },
  {
    id: "github",
    name: "GitHub",
    description: "Search repositories and issues",
    category: "Development",
    icon: GitHubLogoIcon,
  },
  {
    id: "google-docs",
    name: "Google Docs",
    description: "Work with your documents",
    category: "Productivity",
    icon: FileText,
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Analyze your spreadsheets",
    category: "Productivity",
    icon: Table2,
  },
];
