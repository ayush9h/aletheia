from app.services.tools.web_search import web_search

TOOL_REGISTRY = {
    # Web Search Tool
    "web_search": {
        "name": web_search.name,
        "description": web_search.description,
        "input_schema": web_search.args_schema.model_json_schema(),
        "tool": web_search,
    },
}
