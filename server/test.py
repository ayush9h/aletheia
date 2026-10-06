import tiktoken

encoding = tiktoken.get_encoding("o200k_base")
encoding = tiktoken.encoding_for_model("gpt-4o-mini")

encoding.encode("tiktoken is great!")


def num_tokens_from_string(string: str, encoding_name: str) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.get_encoding(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens


ans = num_tokens_from_string("tiktoken is great!", "o200k_base")
print(ans)
