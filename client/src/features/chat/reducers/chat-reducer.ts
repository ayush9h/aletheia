import { ChatState } from "@/features/chat/types/chat-state";
import { ChatAction } from "@/features/chat/types/chat-action";

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

    // Updates the title of the specific session
    case "UPDATE_SESSION_TITLE":
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.session_id === action.payload.sessionId
            ? { ...session, session_title: action.payload.title }
            : session
        ),
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
          memoryEnabled: action.payload?.memoryEnabled ?? false,
        },
      };

    // Selected Tools
    case "SET_TOOLS":
      return {
        ...state,
        selectedTools: action.payload,
      };

    // Streamed updates target their own message, so a session switch or a second send can't misroute them
    case "UPDATE_ASSISTANT_MESSAGE": {
      const { id, ...changes } = action.payload;
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === id ? { ...message, ...changes } : message
        ),
      };
    }

    case "SET_CURRENT_PLAN": {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].role === "assistant") {
        messages[lastIndex] = { ...messages[lastIndex], plan: action.payload };
      }
      return { ...state, messages };
    }

    case "UPDATE_ASSISTANT_PLAN_STEP": {
      const { id, step_id, ...changes } = action.payload;
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id !== id || !message.plan
            ? message
            : {
                ...message,
                plan: {
                  ...message.plan,
                  steps: message.plan.steps.map((step) =>
                    step.step_id !== step_id
                      ? step
                      : {
                          ...step,
                          agent_name: changes.agent_name,
                          status: changes.status,
                          evidence: changes.evidence
                            ? { ...step.evidence, content: changes.evidence }
                            : step.evidence,
                        }
                  ),
                },
              }
        ),
      };
    }
    default:
      return state;
  }
};
