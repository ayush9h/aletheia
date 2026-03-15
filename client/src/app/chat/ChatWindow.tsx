import Navbar from "../components/navbar";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { Message } from "../types/userMessage";
import { ChatAction } from "../types/userChat";
import { UserPrefProps } from "../types/userPref";
import { AutoScroll } from "../reducers/autoScrollhook";
interface Props {
  messages: Message[];
  input: string;
  selectedModel: string;
  dispatch: React.Dispatch<ChatAction>;
  userPref:UserPrefProps;
  onSend: () => void;
  userName:string
}

export default function ChatWindow({
  messages,
  input,
  selectedModel,
  dispatch,
  userPref,
  onSend,
  userName,
}: Props) {

  const {containerRef, bottomRef} = AutoScroll<HTMLDivElement>([messages.length]);

  return (
    <div className="flex h-screen flex-col shadow-xl">
      <Navbar
        selectedModel={selectedModel}
        dispatch={dispatch}
        setSelectedModel={(m) => dispatch({ type: "SET_MODEL", payload: m })}
        userPref={userPref}
        setUserPref={(v) => dispatch({ type: "SET_USER_PREF", payload: v })}
      />

      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <MessageList messages={messages} userName={userName} />
        <div ref={bottomRef} />
      </div>

      <ChatInput
        value={input}
        onChange={(v) => dispatch({ type: "SET_INPUT", payload: v })}
        onSend={onSend}
      />
    </div>
  );
}
