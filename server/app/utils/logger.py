import logging
import queue
import urllib.request
from logging.handlers import QueueHandler, QueueListener

import structlog
from urllib3.connection import HTTPException

from app.utils.config import settings


class PaperTrailHandler(logging.Handler):
    def emit(self, record):
        try:
            payload = self.format(record).encode("utf-8")
            req = urllib.request.Request(settings.PAPERTRAIL_ENDPOINT, data=payload)
            req.add_header("Authorization", f"Bearer {settings.PAPERTRAIL_TOKEN}")
            req.add_header("Content-Type", "application/octet-stream")

            with urllib.request.urlopen(req, timeout=10):
                pass
        except HTTPException:
            self.handleError(record)


queue_listener = None


def setup_logging():

    log_queue = queue.Queue(-1)
    queue_handler = QueueHandler(log_queue)
    queue_listener = QueueListener(log_queue, PaperTrailHandler())

    queue_listener.start()
    root_logger = logging.getLogger()
    root_logger.addHandler(queue_handler)
    root_logger.setLevel(logging.INFO)

    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def shutdown_logging():
    global queue_listener
    if queue_listener:
        queue_listener.stop()
