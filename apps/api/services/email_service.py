"""Email service using Resend SDK."""

import logging

from apps.api.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Sends transactional emails via Resend."""

    @staticmethod
    async def send_invitation_email(
        to_email: str,
        full_name: str,
        activation_link: str,
        inviter_name: str,
    ) -> bool:
        """Send an invitation email with an activation link. Returns True on success."""
        if not settings.resend_api_key:
            logger.warning("RESEND_API_KEY not set — skipping invitation email to %s", to_email)
            return False

        import resend

        resend.api_key = settings.resend_api_key

        html = (
            f"<h2>You've been invited to Mizan</h2>"
            f"<p>Hi {full_name},</p>"
            f"<p>{inviter_name} has invited you to join the team on Mizan.</p>"
            f"<p>Click the button below to activate your account. "
            f"This link expires in 7 days.</p>"
            f'<p><a href="{activation_link}" '
            f'style="display:inline-block;padding:12px 24px;'
            f"background:#2563eb;color:#fff;border-radius:6px;"
            f'text-decoration:none;font-weight:600">'
            f"Activate Account</a></p>"
            f"<p>Or copy this link: {activation_link}</p>"
        )

        try:
            resend.Emails.send({
                "from": "Mizan <noreply@updates.mizan.app>",
                "to": [to_email],
                "subject": f"{inviter_name} invited you to Mizan",
                "html": html,
            })
            return True
        except Exception:
            logger.exception("Failed to send invitation email to %s", to_email)
            return False

    @staticmethod
    async def send_password_reset_email(
        to_email: str,
        full_name: str,
        reset_link: str,
    ) -> bool:
        """Send a password reset email. Returns True on success."""
        if not settings.resend_api_key:
            logger.warning("RESEND_API_KEY not set — skipping reset email to %s", to_email)
            return False

        import resend

        resend.api_key = settings.resend_api_key

        html = (
            f"<h2>Reset Your Password</h2>"
            f"<p>Hi {full_name},</p>"
            f"<p>We received a request to reset your Mizan password.</p>"
            f"<p>Click the button below to set a new password. "
            f"This link expires in 1 hour.</p>"
            f'<p><a href="{reset_link}" '
            f'style="display:inline-block;padding:12px 24px;'
            f"background:#2563eb;color:#fff;border-radius:6px;"
            f'text-decoration:none;font-weight:600">'
            f"Reset Password</a></p>"
            f"<p>Or copy this link: {reset_link}</p>"
            f"<p>If you didn't request this, you can safely ignore this email.</p>"
        )

        try:
            resend.Emails.send({
                "from": "Mizan <noreply@updates.mizan.app>",
                "to": [to_email],
                "subject": "Reset your Mizan password",
                "html": html,
            })
            return True
        except Exception:
            logger.exception("Failed to send password reset email to %s", to_email)
            return False
