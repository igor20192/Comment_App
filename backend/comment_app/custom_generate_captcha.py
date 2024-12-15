import random
import string


def generate_captcha(exclude_chars="il1o0"):
    """Generates a captcha of the given length, excluding the specified characters.

    Args:
    length: Captcha length.
    exclude_chars: String with characters to exclude.

    Returns:
    The generated captcha.
    """
    characters = string.ascii_letters + string.digits
    characters = characters.translate(str.maketrans("", "", exclude_chars))
    captcha_string = "".join(random.choice(characters) for _ in range(6))
    return captcha_string.upper(), captcha_string.upper()
