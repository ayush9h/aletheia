AGENT_REGISTRY = {
    "github_agent": {
        "name": "github_agent",
        "description": (
            "Interacts with the user's connected GitHub account. "
            "Can search repositories, inspect repositories, and work "
            "with pull requests."
        ),
    },
    "web_search_agent": {
        "name": "web_search_agent",
        "description": (
            "Searches the public web for current information. "
            "Can use supported search providers such as SerpAPI or Tavily."
            "use SerpAPI when user ask through Google Search or SerpAPI else use Tavily."
            "Call any one of the above search providers to get the latest information for a given query."
            "Do not call both SerpAPI and Tavily at the same time."
        ),
    },
}
