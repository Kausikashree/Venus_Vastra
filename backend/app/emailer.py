import os
import html
import resend

from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
MAIL_TO = os.getenv(
    "MAIL_TO",
    "kausikashree25b@gmail.com"
)

resend.api_key = RESEND_API_KEY


def send_enquiry_email(
    name: str,
    email: str,
    phone: str,
    message: str,
):
    if not RESEND_API_KEY:
        raise Exception(
            "RESEND_API_KEY is not configured."
        )

    safe_name = html.escape(name)
    safe_email = html.escape(email)
    safe_phone = html.escape(
        phone or "Not provided"
    )
    safe_message = html.escape(message).replace(
        "\n",
        "<br>"
    )

    params: resend.Emails.SendParams = {
        "from": "Venus Vastra <onboarding@resend.dev>",
        "to": [MAIL_TO],
        "subject": f"New Venus Vastra Enquiry - {safe_name}",
        "html": f"""
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 650px;
            margin: auto;
            background: #fffaf5;
            padding: 30px;
            border-radius: 18px;
          "
        >
          <h1
            style="
              color: #3a2b63;
              margin-bottom: 10px;
            "
          >
            New Venus Vastra Enquiry
          </h1>

          <p
            style="
              color: #777;
              margin-bottom: 25px;
            "
          >
            A customer submitted an enquiry
            through the Venus Vastra website.
          </p>

          <div
            style="
              background: white;
              padding: 22px;
              border-radius: 14px;
            "
          >
            <p>
              <strong>Name:</strong>
              {safe_name}
            </p>

            <p>
              <strong>Email:</strong>
              {safe_email}
            </p>

            <p>
              <strong>Phone:</strong>
              {safe_phone}
            </p>

            <p>
              <strong>Message:</strong>
            </p>

            <p>
              {safe_message}
            </p>
          </div>
        </div>
        """,
        "reply_to": email,
    }

    return resend.Emails.send(params)