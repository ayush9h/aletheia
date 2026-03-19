/**
 * DataControls component responsible for destructive data management actions.
 * @param userId - Authenticated user identifier required for deletion
 * @param dispatch - Chat reducer dispatch reference
 */
import { DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { deleteUserChatsAll } from "@/app/lib/api/userData";
import { ChatAction } from "@/app/types/chats/chat-action";

export default function DataControls({
  userId,
  dispatch,
}: {
  userId: string;
  dispatch: React.Dispatch<ChatAction>;
}) {
  /**
   * Deletes all chats for the user and clears local chat state.
   */
  const handleDeleteAll = async () => {
    try {
      await deleteUserChatsAll(userId);

      dispatch({ type: "SET_SESSIONS", payload: [] });
      dispatch({ type: "SET_MESSAGES", payload: [] });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">Data Controls</DialogTitle>
      </DialogHeader>

      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between ">
          {/* Destructive action: delete all chat history */}
          <div>
            <h3 className="text-sm">Delete all chats</h3>
          </div>
          <button
            className="rounded-md border border-red-600 bg-red-200 px-4 py-1.5 text-xs text-red-600 ease-in-out hover:bg-red-300"
            onClick={handleDeleteAll}
          >
            Delete all
          </button>
        </div>
      </div>
    </>
  );
}
