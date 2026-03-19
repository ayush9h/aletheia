import { Message } from "@/app/types/userMessage";
import { ChatAction } from "@/app/types/chats/chat-action";
import { UserPrefProps } from "@/app/types/userPref";
/**
 * Chat Input Props
 */
export interface inputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
}

/* Chat Window Props */

export interface ChatWindowProps {
  messages: Message[];
  input: string;
  selectedModel: string;
  dispatch: React.Dispatch<ChatAction>;
  userPref: UserPrefProps;
  onSend: () => void;
  userName: string;
}
