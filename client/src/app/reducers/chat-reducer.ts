import { ChatState } from "../types/chats/chat-state";
import { ChatAction } from "../types/chats/chat-action";

export const ChatReducer = (state: ChatState, action: ChatAction) => {
  switch (action.type) {
    // Set the user input
    case "SET_INPUT":
      return {
        ...state,
        input: action.payload,
      };

    // Clear the user input after sending
    case "CLEAR_INPUT":
      return {
        ...state,
        input: "",
      };

    // Set the model to the current user selection
    case "SET_MODEL":
      return {
        ...state,
        selectedModel: action.payload,
      };

    // Add the current user message to the list
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    // Store the current set of the messages received
    case "SET_MESSAGES":
      return {
        ...state,
        messages: action.payload,
      };

    // Add a new session on clicking new chat option
    case "ADD_SESSION":
      if (state.sessions.includes(action.payload)) return state;
      return { ...state, sessions: [...state.sessions, action.payload] };

    // Store the current set of the sessions received
    case "SET_SESSIONS":
      return {
        ...state,
        sessions: action.payload,
      };

    // Switch to user selected session
    case "SET_SELECTED_SESSION":
      return {
        ...state,
        selectedSessionId: action.payload,
      };

    // Delete a particular session
    case "DELETE_SESSION":
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.session_id !== action.payload),
      };

    // Set user preferences
    case "SET_USER_PREF":
      return {
        ...state,
        userPref: {
          userCustomInstruction: action.payload?.userCustomInstruction ?? "",
          nickname: action.payload?.nickname ?? "",
          baseTone: action.payload?.baseTone ?? "",
          occupation: action.payload?.occupation ?? "",
          userHobbies: action.payload?.userHobbies ?? "",
        },
      };
    default:
      return state;
  }
};
