"""Optional e-mail delivery through SendGrid.

If SENDGRID_API_KEY / SENDGRID_FROM_EMAIL are not set the function simply
returns False so the rest of the app keeps working in local development.
"""

import os

import httpx

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL")


def email_enabled() -> bool:
    return bool(SENDGRID_API_KEY and SENDGRID_FROM_EMAIL)


def send_email(to: str, subject: str, body: str) -> bool:
    if not email_enabled():
        return False

    try:
        response = httpx.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {SENDGRID_API_KEY}"},
            json={
                "personalizations": [{"to": [{"email": to}]}],
                "from": {"email": SENDGRID_FROM_EMAIL, "name": "BudgetBuddy"},
                "subject": subject,
                "content": [{"type": "text/plain", "value": body}],
            },
            timeout=10,
        )
        return response.status_code < 300
    except httpx.HTTPError:
        return False
