import { ChatAction } from "@/features/chat/types/chat-action";
import { UserPrefProps } from "@/types/user-pref";

// Type for user preferences dialog
export type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPref: UserPrefProps;
  setUserPref: (userPref: UserPrefProps) => void;
  dispatch: React.Dispatch<ChatAction>;
};
