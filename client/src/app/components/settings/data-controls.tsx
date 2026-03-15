import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { deleteUserChatsAll } from "@/app/lib/api/userData"
import { ChatAction } from "@/app/types/userChat";
export default function DataControls({userId, dispatch}:{userId:string,   dispatch: React.Dispatch<ChatAction>;}){
    

    const handleDeleteAll = async () => {
        
        try {
        await deleteUserChatsAll(userId);

        dispatch({type: "SET_SESSIONS", payload:[]})
        dispatch({type: "SET_MESSAGES", payload:[]})


        } catch (err) {
            console.error(err);
        } 
  };

    return (
        
        <>
            <DialogHeader>
                <DialogTitle className="text-xl">Data Controls</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center ">
                  {/* Base Style and Tone */}
                  <div>
                    <h3 className="text-sm">Delete all chats</h3>
                  </div>
                  <button className="bg-red-200 border border-red-600 text-red-600 text-xs px-4 py-1.5 rounded-md hover:bg-red-300 ease-in-out" onClick={handleDeleteAll}>Delete all</button>
                </div>
            </div>             

        </>
        
    )
}