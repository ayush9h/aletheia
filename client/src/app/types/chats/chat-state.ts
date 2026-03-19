import { Session, Message } from "../user-message";
import { UserPrefProps } from "../user-pref";

export type ChatState = {
  input: string;
  selectedModel: string;
  sessions: Session[];
  messages: Message[];
  selectedSessionId: number | null;
  userPref: UserPrefProps;
};

{
  /**Initial new state of the application for a new user */
}
export const InitialState: ChatState = {
  /** Initial input state */
  input: "",

  /** default selected model */
  selectedModel: "openai/gpt-oss-120b",
  /** active session id for operations*/
  selectedSessionId: null,

  /** List of sessions for a user id */
  sessions: [],
  /** List of chat messages inside a session */
  messages: [],

  userPref: {
    /** User Nickname */
    nickname: "",
    /** User Occupation */
    occupation: "",
    /** Tone of response */
    baseTone: "efficient",
    /** Custom instructions for model */
    userCustomInstruction: "",
    /** User hobbies for personalization response */
    userHobbies: "",
  },
};
