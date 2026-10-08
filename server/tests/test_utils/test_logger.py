import logging
import urllib.request
from unittest.mock import MagicMock, patch

from urllib3.connection import HTTPException

from app.utils.logger import (
    PaperTrailHandler,
    setup_logging,
    shutdown_logging,
)


def test_papertrail_handler_emit_sends_formatted_payload():
    handler = PaperTrailHandler()

    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=10,
        msg="test log message",
        args=(),
        exc_info=None,
    )

    handler.setFormatter(logging.Formatter("%(message)s"))

    mock_response = MagicMock()

    with patch(
        "app.utils.logger.urllib.request.urlopen",
        return_value=mock_response,
    ) as mock_urlopen:
        handler.emit(record)

    mock_urlopen.assert_called_once()

    request = mock_urlopen.call_args.args[0]

    assert isinstance(request, urllib.request.Request)
    assert (
        request.full_url == handler._test_url
        if hasattr(handler, "_test_url")
        else request.full_url
    )

    assert request.get_header("Authorization") is not None
    assert request.get_header("Content-type") == "application/octet-stream"

    mock_urlopen.assert_called_once_with(
        request,
        timeout=10,
    )


def test_papertrail_handler_emit_uses_formatted_record():
    handler = PaperTrailHandler()

    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=10,
        msg="hello %s",
        args=("world",),
        exc_info=None,
    )

    handler.setFormatter(logging.Formatter("%(message)s"))

    mock_response = MagicMock()

    with patch(
        "app.utils.logger.urllib.request.urlopen",
        return_value=mock_response,
    ) as mock_urlopen:
        handler.emit(record)

    request = mock_urlopen.call_args.args[0]

    assert request.data == b"hello world"


def test_papertrail_handler_emit_handles_http_exception():
    handler = PaperTrailHandler()

    record = logging.LogRecord(
        name="test",
        level=logging.ERROR,
        pathname=__file__,
        lineno=10,
        msg="failed request",
        args=(),
        exc_info=None,
    )

    handler.setFormatter(logging.Formatter("%(message)s"))

    with (
        patch(
            "app.utils.logger.urllib.request.urlopen",
            side_effect=HTTPException("PaperTrail unavailable"),
        ),
        patch.object(
            handler,
            "handleError",
        ) as mock_handle_error,
    ):
        handler.emit(record)

    mock_handle_error.assert_called_once_with(record)


def test_setup_logging_configures_root_logger():
    with (
        patch("app.utils.logger.QueueListener") as mock_listener_class,
        patch("app.utils.logger.queue.Queue") as mock_queue_class,
        patch("app.utils.logger.logging.getLogger") as mock_get_logger,
        patch("app.utils.logger.structlog.configure") as mock_structlog_configure,
    ):
        mock_queue = MagicMock()
        mock_queue_class.return_value = mock_queue

        mock_listener = MagicMock()
        mock_listener_class.return_value = mock_listener

        root_logger = MagicMock()
        mock_get_logger.return_value = root_logger

        setup_logging()

    mock_queue_class.assert_called_once_with(-1)

    mock_listener_class.assert_called_once_with(mock_queue)

    mock_listener.start.assert_called_once()

    mock_get_logger.assert_called_once_with()

    root_logger.addHandler.assert_called_once()
    root_logger.setLevel.assert_called_once_with(logging.INFO)

    mock_structlog_configure.assert_called_once()

    config_kwargs = mock_structlog_configure.call_args.kwargs

    assert config_kwargs["logger_factory"] is not None
    assert config_kwargs["wrapper_class"] is not None
    assert config_kwargs["cache_logger_on_first_use"] is True

    processors = config_kwargs["processors"]

    assert len(processors) == 4


def test_shutdown_logging_stops_listener():
    with patch("app.utils.logger.queue_listener", MagicMock()) as mock_listener:
        shutdown_logging()

        mock_listener.stop.assert_called_once()


def test_shutdown_logging_does_nothing_when_listener_is_none():
    with patch("app.utils.logger.queue_listener", None):
        shutdown_logging()
