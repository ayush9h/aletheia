'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { PlusIcon, GlobeIcon } from "@radix-ui/react-icons"
import { BookOpenTextIcon } from "lucide-react";


/** Options available to users (tools) */
const options = [
    {
        id:1,
        toolLabel:"Web Search",
        toolIcon: GlobeIcon,
    },
    {
        id:2,
        toolLabel:"URL Extractor",
        toolIcon: BookOpenTextIcon,
    }
]


export default function InputOptions({setOptionList} : {setOptionList: any}){

    const addOptions = (optionLabel:string)=>{
        setOptionList(
            (prev:string[]) => 
                prev.includes(optionLabel) 
                ? prev.filter(i => i!==optionLabel) 
                :[...prev, optionLabel])
        }

    return(
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <PlusIcon className="h-4 w-4 cursor-pointer" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="font-paragraph w-48">
                    
                    <DropdownMenuLabel className="text-xs text-stone-500">Available Tools</DropdownMenuLabel>
                    
                    {/* Rendering the list of tools available from the options */}
                    {options.map((option)=>(
                        <DropdownMenuItem onClick={()=> addOptions(option.toolLabel)} key={option.id} className="flex items-center cursor-pointer">
                            <option.toolIcon className="h-4 w-4"/>
                            <h3 className="p-1">{option.toolLabel}</h3>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>     
        </>
    )
}
