
from sqlalchemy.orm import Session

from database import engine
from models import IncidentDB
from embedding_service import create_embedding


# Synthetic historical incidents for RAG similarity search.
# Each example contains only a title and description.

SYNTHETIC_INCIDENTS = [
    {
        "title": "Payment API Returning HTTP 500",
        "description": (
            "The payment API error rate increased from 1% to 18% "
            "after a deployment. Transactions are failing with HTTP 500. "
            "The previous application version handled the same traffic normally."
        ),
    },
    {
        "title": "Authentication Service Login Failures",
        "description": (
            "Users receive unauthorized responses when logging in. "
            "Failures began after the authentication signing key was rotated. "
            "The login endpoint is reachable, but token validation fails."
        ),
    },
    {
        "title": "Database Connection Timeouts",
        "description": (
            "Several API endpoints return database timeout errors during "
            "peak traffic. Database CPU is elevated and connection acquisition "
            "times are increasing."
        ),
    },
    {
        "title": "Order API Response Latency Spike",
        "description": (
            "Order API p95 latency increased from 250 ms to 4 seconds. "
            "Request volume is stable, but traces show long waits while "
            "fetching customer and inventory details."
        ),
    },
    {
        "title": "Checkout Regression After Deployment",
        "description": (
            "Checkout fails when customers submit shipping details. "
            "The problem started immediately after a frontend and API release. "
            "Product browsing and cart updates continue to work."
        ),
    },
    {
        "title": "Message Queue Processing Backlog",
        "description": (
            "The notification queue has accumulated thousands of pending "
            "messages. Producers are publishing normally, but consumer "
            "throughput has dropped and message age is increasing."
        ),
    },
    {
        "title": "Application Memory Usage Increasing",
        "description": (
            "Memory usage increases continuously after service startup. "
            "The application becomes unresponsive after several hours and "
            "restarts after exceeding its memory limit."
        ),
    },
    {
        "title": "Cache Service Returning Stale Data",
        "description": (
            "Customers see outdated product prices after catalog updates. "
            "The database contains the new values, but API responses continue "
            "returning older cached values."
        ),
    },
    {
        "title": "Third-Party Payment Provider Timeout",
        "description": (
            "Payment requests remain pending and eventually time out. "
            "Internal API health is normal, while outbound requests to the "
            "payment provider show elevated latency and intermittent failures."
        ),
    },
    {
        "title": "File Upload Service Failures",
        "description": (
            "File uploads fail with storage permission errors. The application "
            "can authenticate users, but the storage operation returns access "
            "denied after a recent credential update."
        ),
    },
    {
        "title": "Email Notifications Not Delivered",
        "description": (
            "Password-reset and order-confirmation emails are not reaching "
            "users. Application requests succeed, but notification delivery "
            "records show provider rejections."
        ),
    },
    {
        "title": "API Rate Limiting Rejecting Valid Requests",
        "description": (
            "Legitimate customers receive HTTP 429 responses even though "
            "their request rates are within expected limits. Failures increased "
            "after a proxy configuration change."
        ),
    },
    {
        "title": "Database Connection Pool Exhaustion",
        "description": (
            "Requests queue while waiting for a database connection. "
            "Connections remain checked out longer than expected, and "
            "the pool reaches its configured maximum."
        ),
    },
    {
        "title": "Background Job Retries Failing",
        "description": (
            "Background jobs repeatedly fail and enter a retry loop. "
            "Logs show the same malformed payload failing on every attempt, "
            "while unrelated jobs continue to complete."
        ),
    },
    {
        "title": "Slow Database Queries Affecting Reports",
        "description": (
            "Reporting requests time out near the end of the business day. "
            "Database metrics show expensive scans on a large transactions "
            "table, while ordinary transactional endpoints remain healthy."
        ),
    },
    {
        "title": "Service-to-Service Communication Errors",
        "description": (
            "The order service intermittently fails when calling the inventory "
            "service. DNS resolution errors appear in logs, while both services "
            "report healthy application processes."
        ),
    },
    {
        "title": "Expired TLS Certificate Warning",
        "description": (
            "Clients fail TLS handshakes when connecting to an internal API. "
            "Certificate monitoring reports that the certificate has expired, "
            "and failures began around the certificate expiry time."
        ),
    },
    {
        "title": "Inventory Stock Synchronization Delayed",
        "description": (
            "Inventory counts differ between the warehouse feed and the "
            "customer-facing catalog. Updates are delayed, and consumer "
            "lag has increased since a scheduled import began."
        ),
    },
    {
        "title": "Search Results Missing Recently Added Items",
        "description": (
            "Newly created products appear in the catalog database but are "
            "missing from search results. Existing products remain searchable, "
            "and indexing metrics show a growing indexing delay."
        ),
    },
    {
        "title": "Scheduled Report Job Not Running",
        "description": (
            "The nightly financial report was not generated. The scheduler "
            "shows the job was triggered, but no output file was produced. "
            "Worker logs indicate that the job failed before processing began."
        ),
    },
]


def seed_incidents():
    with Session(bind=engine) as db:
        existing_titles = {
            title
            for (title,) in (
                db.query(IncidentDB.title)
                .filter(IncidentDB.created_by == "synthetic-seed")
                .all()
            )
        }

        inserted = 0

        try:
            for item in SYNTHETIC_INCIDENTS:
                if item["title"] in existing_titles:
                    continue

                # Generate the embedding using only title and description.
                embedding_text = (
                    f"{item['title']}. {item['description']}"
                )
                embedding = create_embedding(embedding_text)

                # Supply defaults for the other required database columns.
                incident = IncidentDB(
                    session_id=None,
                    team_id=None,
                    created_by="synthetic-seed",
                    title=item["title"],
                    description=item["description"],
                    service="Historical Incident",
                    severity="Medium",
                    category="Historical",
                    summary=item["description"],
                    possible_root_cause=None,
                    recommended_action=None,
                    confidence=None,
                    embedding=embedding,
                    status="Resolved",
                    ai_analysis_status="Completed",
                )

                db.add(incident)
                existing_titles.add(item["title"])
                inserted += 1

            db.commit()

            print(f"Total examples defined: {len(SYNTHETIC_INCIDENTS)}")
            print(f"New incidents inserted: {inserted}")
            print(f"Existing incidents skipped: {len(existing_titles) - inserted}")

        except Exception:
            db.rollback()
            raise


if __name__ == "__main__":
    seed_incidents()
