from fastapi import APIRouter

from app.services.agents import AGENT_REGISTRY

agent_router = APIRouter(prefix="/v1")


@agent_router.get(
    "/agents",
    tags=["Agents"],
    description="List the agents a user can select in chat",
)
async def list_agents():
    return {
        "agents": [
            {
                "name": agent.name,
                "label": agent.label,
            }
            for agent in AGENT_REGISTRY.values()
            if agent.selectable
        ]
    }
