import { Session, Message } from "../userMessage";
import { UserPrefProps } from "../userPref";

{
  /**
    Valid actions performed on the chat page 
    */
}
export type ChatAction =
  /**
   * Updates current input buffer (controlled input state).
   */
  | { type: "SET_INPUT"; payload: string }

  /**
   * Clears input buffer after successful send.
   */
  | { type: "CLEAR_INPUT" }

  /**
   * Switches active LLM model.
   */
  | { type: "SET_MODEL"; payload: string }

  /**
   * Appends a single message to current session timeline.
   */
  | { type: "ADD_MESSAGE"; payload: Message }

  /**
   * Replaces entire message list.
   */
  | { type: "SET_MESSAGES"; payload: Message[] }

  /**
   * Adds a newly created chat session to state.
   */
  | { type: "ADD_SESSION"; payload: Session }

  /**
   * Replaces full session collection.
   */
  | { type: "SET_SESSIONS"; payload: Session[] }

  /**
   * Marks currently active session.
   */
  | { type: "SET_SELECTED_SESSION"; payload: number | null }

  /**
   * Removes session and associated state references
   */
  | { type: "DELETE_SESSION"; payload: number }

  /**
   * Sets or clears personalization preferences.
   */
  | { type: "SET_USER_PREF"; payload?: UserPrefProps };
