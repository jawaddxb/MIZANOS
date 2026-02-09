"""Shared error handling utilities."""

from fastapi import HTTPException, status


def not_found(resource: str = "Resource") -> HTTPException:
    """Return a 404 HTTPException."""
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} not found",
    )


def forbidden(message: str = "Access denied") -> HTTPException:
    """Return a 403 HTTPException."""
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=message,
    )


def bad_request(message: str) -> HTTPException:
    """Return a 400 HTTPException."""
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=message,
    )
