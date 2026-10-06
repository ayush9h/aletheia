import tiktoken


def tokens_from_string(string: str, encoding_name: str = "o200k_base") -> int:
    """
    Returns the number of tokens in a text string

    Args:
        string: str
        encoding_name: str = "o200k_base"

    Returns:
        int: Number of tokens consumed
    """
    encoding = tiktoken.get_encoding(encoding_name=encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens
