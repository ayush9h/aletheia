import { Session } from "@/types/user-message";
/*
   Session Handling

*/

export type SessionItemProps = {
  s: Session;
  open: boolean;
  selectedSessionId: number | null;
  onSelectSession: (id: number) => void;
  handlePinSession: (sessionId: number) => void | Promise<void>;
  handleDeleteSession: (sessionId: number) => void | Promise<void>;
  handleRenameSession: (
    sessionId: number,
    title: string
  ) => void | Promise<void>;
};
