import pytest
from app.services.youtube_service import YouTubeService, parse_iso_duration_to_seconds


def test_youtube_video_id_extraction():
    test_urls = [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/shorts/M7lc1UVf-VE", "M7lc1UVf-VE"),
        ("https://www.youtube.com/embed/jNQXAC9IVRw", "jNQXAC9IVRw"),
        ("dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ]

    for url, expected_id in test_urls:
        extracted = YouTubeService.extract_video_id(url)
        assert extracted == expected_id, f"Failed extracting {expected_id} from {url}"


def test_iso_duration_parsing():
    assert parse_iso_duration_to_seconds("PT30S") == 30
    assert parse_iso_duration_to_seconds("PT1M15S") == 75
    assert parse_iso_duration_to_seconds("PT1H2M10S") == 3730
    assert parse_iso_duration_to_seconds("") == 0
