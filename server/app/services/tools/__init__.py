from app.services.tools.web_search import web_search

TOOL_REGISTRY = {
    "web_search": {
        "name": web_search.name,
        "description": web_search.description,
        "input_schema": web_search.args_schema.model_json_schema(),
        "tool": web_search,
        "kind": "tool",
    },
    "github_agent": {
        "name": "github_agent",
        "description": (
            "Use the user's connected GitHub account to search repositories, "
            "inspect files and code, retrieve issues and pull requests, "
            "and retrieve other GitHub information."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "task": {
                    "type": "string",
                    "description": "The GitHub task to perform.",
                }
            },
            "required": ["task"],
        },
        "kind": "agent",
    },
}
