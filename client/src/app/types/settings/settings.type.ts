import { ChatAction } from "../chats/chat-action";
import { UserPrefProps } from "../userPref";

/** Type for user preferences dialog */
export type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPref: UserPrefProps;
  setUserPref: (userPref: UserPrefProps) => void;
  dispatch: React.Dispatch<ChatAction>;
};
