import base64
import json
from urllib import request as urllib_request
from urllib.error import HTTPError, URLError


class ProviderRequestError(RuntimeError):
    pass


def post_json(url: str, payload: dict, headers: dict[str, str] | None = None, basic_auth: tuple[str, str] | None = None, timeout: int = 15) -> dict:
    request_headers = {"Content-Type": "application/json", **(headers or {})}
    if basic_auth:
        token = base64.b64encode(f"{basic_auth[0]}:{basic_auth[1]}".encode()).decode()
        request_headers["Authorization"] = f"Basic {token}"
    req = urllib_request.Request(url, data=json.dumps(payload).encode(), headers=request_headers, method="POST")
    try:
        with urllib_request.urlopen(req, timeout=timeout) as response:
            body = response.read().decode()
            return json.loads(body) if body else {}
    except HTTPError as exc:
        body = exc.read().decode(errors="replace")
        raise ProviderRequestError(f"Provider HTTP {exc.code}: {body}") from exc
    except URLError as exc:
        raise ProviderRequestError(str(exc)) from exc
