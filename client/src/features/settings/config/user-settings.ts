import { FaceIcon } from "@radix-ui/react-icons";
import { DatabaseIcon, Settings2 } from "lucide-react";

export const SETTING_SECTIONS = [
  {id:'general', label:'General', icon: Settings2},
  { id: "personalization", label: "Personalization", icon: FaceIcon },
  { id: "data-controls", label: "Data Controls", icon: DatabaseIcon },
];
