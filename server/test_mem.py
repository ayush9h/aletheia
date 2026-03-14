import asyncio
from datetime import datetime

from app.memory.manager import MemoryManager
from app.utils.config import settings
from langchain_groq import ChatGroq

mem_sys = MemoryManager(
    llm_client=ChatGroq(api_key=settings.GROQ_API_KEY, model="openai/gpt-oss-20b"),
)


async def add_mem():
    # memory_id1 = await mem_sys.add_note(
    #     "HR has a great place in the company to make you comfortable",
    #     time=datetime.now().strftime("%Y%m%d%H%M"),
    # )
    # print(memory_id1)

    results = mem_sys.search("artificial intelligence data processing", k=3)

    print(f"GOt the result:{results}")


#


asyncio.run(add_mem())