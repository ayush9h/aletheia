import pytest

from app.utils.token_estimator import tokens_from_string


@pytest.mark.parametrize("text", ["Hello", "How are you!", "12345"])
def test_tokens_from_string(text: str):
    result = tokens_from_string(text)
    assert isinstance(result, int)
    assert result >= 0
