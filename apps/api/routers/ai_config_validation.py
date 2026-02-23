"""Validation helpers for AI org settings."""

from fastapi import HTTPException

_KNOWN_PROVIDERS = {"openrouter", "openai"}


def validate_ai_org_setting(key: str, value: dict) -> None:
    """Raise 400 if an AI config/prompt value is invalid."""
    if key == "ai_model_config":
        _validate_model_config(value)
    elif key == "ai_system_prompts":
        _validate_system_prompts(value)


def _validate_model_config(value: dict) -> None:
    model = value.get("model")
    if not isinstance(model, str) or not model.strip():
        raise HTTPException(400, "ai_model_config.model must be a non-empty string.")
    provider = value.get("provider", "")
    if provider and provider not in _KNOWN_PROVIDERS:
        raise HTTPException(
            400,
            f"ai_model_config.provider must be one of: "
            f"{', '.join(sorted(_KNOWN_PROVIDERS))}.",
        )
    temp = value.get("temperature")
    if temp is not None:
        if not isinstance(temp, (int, float)) or not (0.0 <= temp <= 2.0):
            raise HTTPException(
                400, "ai_model_config.temperature must be between 0.0 and 2.0.",
            )
    max_tok = value.get("max_tokens")
    if max_tok is not None:
        if not isinstance(max_tok, int) or max_tok < 1:
            raise HTTPException(
                400, "ai_model_config.max_tokens must be a positive integer.",
            )


def _validate_system_prompts(value: dict) -> None:
    for prompt_key, prompt_val in value.items():
        if isinstance(prompt_val, str):
            if not prompt_val.strip():
                raise HTTPException(
                    400,
                    f"ai_system_prompts.{prompt_key} must be a non-empty string "
                    "(remove the key to revert to default).",
                )
        elif isinstance(prompt_val, dict):
            for sub_key, sub_val in prompt_val.items():
                if isinstance(sub_val, str) and not sub_val.strip():
                    raise HTTPException(
                        400,
                        f"ai_system_prompts.{prompt_key}.{sub_key} must be non-empty.",
                    )


async def verify_model(provider: str, model: str) -> dict:
    """Send a minimal completion request to verify the model is reachable."""
    import openai
    from apps.api.config import settings as app_settings

    if not model or not model.strip():
        raise HTTPException(400, "Model ID is required.")

    api_key = app_settings.openrouter_api_key or app_settings.openai_api_key
    if not api_key:
        raise HTTPException(400, "No AI API key configured on server.")

    base_url = (
        "https://openrouter.ai/api/v1" if provider == "openrouter" else None
    )

    try:
        client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Say OK"}],
            max_tokens=3,
        )
        content = response.choices[0].message.content or ""
        return {"valid": True, "response": content.strip()[:50]}
    except openai.NotFoundError:
        raise HTTPException(400, f"Model '{model}' not found on {provider}.")
    except openai.AuthenticationError:
        raise HTTPException(
            400, "API key is invalid or lacks access to this model.",
        )
    except openai.BadRequestError as exc:
        raise HTTPException(400, f"Model rejected: {exc.message[:120]}")
    except Exception as exc:
        raise HTTPException(502, f"Verification failed: {str(exc)[:120]}")
