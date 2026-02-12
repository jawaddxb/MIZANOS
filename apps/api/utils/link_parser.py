"""Deterministic extraction utilities for URLs and links."""

from urllib.parse import urlparse, unquote

# Social platform domain → platform name mapping
SOCIAL_PLATFORMS: dict[str, str] = {
    "twitter.com": "twitter",
    "x.com": "twitter",
    "instagram.com": "instagram",
    "facebook.com": "facebook",
    "fb.com": "facebook",
    "linkedin.com": "linkedin",
    "tiktok.com": "tiktok",
    "youtube.com": "youtube",
    "github.com": "github",
}

# URL path segments that are NOT profile handles
NON_PROFILE_PATHS = frozenset({
    "share", "intent", "hashtag", "search", "explore", "trending",
    "login", "signup", "register", "settings", "help", "about",
    "legal", "privacy", "terms", "policy", "status", "jobs",
    "sharer", "sharer.php", "dialog", "watch", "results",
    "channel", "playlist", "feed", "notifications", "messages",
})


def extract_domain(url: str) -> dict:
    """Parse domain from URL and detect SSL status.

    Returns dict with keys: domain, ssl_status, is_secured.
    """
    parsed = urlparse(url)
    host = parsed.hostname or ""
    host = host.lower().removeprefix("www.")

    is_https = parsed.scheme == "https"
    return {
        "domain": host,
        "ssl_status": "active" if is_https else "inactive",
        "is_secured": is_https,
    }


def extract_social_handles(links: list[str]) -> list[dict]:
    """Match links against known social platform domains.

    Returns list of dicts with keys: platform, handle, url.
    Deduplicates by (platform, handle).
    """
    seen: set[tuple[str, str]] = set()
    results: list[dict] = []

    for link in links:
        parsed = urlparse(link)
        host = (parsed.hostname or "").lower().removeprefix("www.")

        platform = SOCIAL_PLATFORMS.get(host)
        if not platform:
            continue

        path = unquote(parsed.path).strip("/")
        if not path:
            continue

        # Take the first path segment as the handle
        segments = path.split("/")
        handle = segments[0]

        if not handle or handle.lower() in NON_PROFILE_PATHS:
            continue

        # For LinkedIn, handle company/org pages: /company/name or /in/name
        if platform == "linkedin" and handle in ("company", "in", "school"):
            handle = segments[1] if len(segments) > 1 else ""
            if not handle:
                continue

        key = (platform, handle.lower())
        if key in seen:
            continue
        seen.add(key)

        results.append({
            "platform": platform,
            "handle": handle,
            "url": link,
        })

    return results


def extract_contact_emails(links: list[str]) -> list[str]:
    """Extract email addresses from mailto: links.

    Returns deduplicated list of email addresses.
    """
    emails: list[str] = []
    seen: set[str] = set()

    for link in links:
        if not link.lower().startswith("mailto:"):
            continue
        # Strip mailto: prefix and any query params
        email = link[7:].split("?")[0].strip().lower()
        if email and "@" in email and email not in seen:
            seen.add(email)
            emails.append(email)

    return emails
