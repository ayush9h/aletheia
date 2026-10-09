from unittest.mock import MagicMock, patch

from app.services.agents.github.agent import create_github_agent


@patch("app.services.agents.github.agent.create_agent")
@patch("app.services.agents.github.agent.create_pull_request_tools")
@patch("app.services.agents.github.agent.create_repository_tools")
def test_create_github_agent(
    mock_create_repository_tools: MagicMock,
    mock_create_pull_request_tools: MagicMock,
    mock_create_agent: MagicMock,
) -> None:
    llm = MagicMock()
    session = MagicMock()
    user_id = "user-123"

    repository_tools = MagicMock()
    pull_request_tools = MagicMock()
    expected_agent = MagicMock()

    mock_create_repository_tools.return_value = repository_tools
    mock_create_pull_request_tools.return_value = pull_request_tools
    mock_create_agent.return_value = expected_agent

    result = create_github_agent(
        llm=llm,
        session=session,
        user_id=user_id,
    )

    assert result is expected_agent

    mock_create_repository_tools.assert_called_once_with(
        session,
        user_id,
    )

    mock_create_pull_request_tools.assert_called_once_with(
        session,
        user_id,
    )

    mock_create_agent.assert_called_once_with(
        model=llm,
        tools=[
            repository_tools,
            pull_request_tools,
        ],
        system_prompt=mock_create_agent.call_args.kwargs["system_prompt"],
    )
