"""
Test script to verify all conversion services are working correctly.
Run this after deploying to Cloud Run to verify all endpoints.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Iterable, List, Tuple

import requests

DEFAULT_CLOUD_RUN_URL = "https://pdf-converter-python-607448904463.us-central1.run.app"

TestCase = Tuple[str, Path, str]


def _resolve_file_path(path: Path, sample_dir: Path) -> Path:
    if path.is_absolute():
        return path
    candidate = path
    if candidate.exists():
        return candidate
    return sample_dir / path


def test_endpoint(
    service_url: str,
    endpoint_name: str,
    test_file_path: Path,
    expected_output_format: str,
    timeout: int,
) -> bool:
    """Test a conversion endpoint with a sample file."""
    print(f"\n{'='*60}")
    print(f"Testing: {endpoint_name}")
    print(f"{'='*60}")

    if not test_file_path.exists():
        print(f"⚠️  Test file not found: {test_file_path}")
        print(f"   Skipping {endpoint_name} test")
        return False

    url = f"{service_url}/convert/{endpoint_name}"
    print(f"URL: {url}")

    try:
        with test_file_path.open("rb") as f:
            files = {"file": (test_file_path.name, f)}

            print(f"Uploading: {test_file_path} ({test_file_path.stat().st_size} bytes)")
            response = requests.post(url, files=files, timeout=timeout)

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                output_size = result.get("size", 0)
                output_filename = result.get("filename", "unknown")
                processing_time = result.get("processing_time", "unknown")

                print("✅ SUCCESS")
                print(f"   Output: {output_filename}")
                print(f"   Size: {output_size:,} bytes")
                print(f"   Time: {processing_time}")

                if output_filename.endswith(expected_output_format):
                    print(f"   Format: ✅ Correct ({expected_output_format})")
                else:
                    print(
                        f"   Format: ⚠️  Expected {expected_output_format},"
                        f" got {Path(output_filename).suffix}"
                    )

                return True

            print(f"❌ FAILED: {result.get('error', 'Unknown error')}")
            return False

        error_text = response.text[:500]
        print(f"❌ FAILED: HTTP {response.status_code}")
        print(f"   Error: {error_text}")
        return False

    except requests.exceptions.Timeout:
        print(f"❌ FAILED: Request timeout (>{timeout}s)")
        return False
    except requests.exceptions.ConnectionError:
        print(f"❌ FAILED: Cannot connect to {service_url}")
        print("   Check if service is deployed and URL is correct")
        return False
    except Exception as exc:  # noqa: BLE001
        print(f"❌ FAILED: {type(exc).__name__}: {exc}")
        return False


def test_health(service_url: str, timeout: int) -> bool:
    """Test health check endpoint."""
    print(f"\n{'='*60}")
    print("Testing: Health Check")
    print(f"{'='*60}")

    try:
        url = f"{service_url}/health"
        response = requests.get(url, timeout=timeout)

        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
            return True

        print(f"❌ Health check failed: HTTP {response.status_code}")
        return False
    except Exception as exc:  # noqa: BLE001
        print(f"❌ Health check failed: {exc}")
        return False


def load_default_test_cases(sample_dir: Path) -> List[TestCase]:
    """Return the built-in set of test cases using repo sample files."""
    return [
        ("pdf-to-word", sample_dir / "sample.pdf", ".docx"),
        ("pdf-to-excel", sample_dir / "sample.pdf", ".xlsx"),
        ("pdf-to-ppt", sample_dir / "sample.pdf", ".pptx"),
        ("word-to-pdf", sample_dir / "test_pdf_to_word.docx", ".pdf"),
        ("ppt-to-pdf", sample_dir / "sample.pptx", ".pdf"),
        ("excel-to-pdf", sample_dir / "sample.xlsx", ".pdf"),
    ]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Test all Cloud Run conversion endpoints.")
    parser.add_argument(
        "--url",
        default=os.environ.get("PDF_SERVICE_URL", DEFAULT_CLOUD_RUN_URL),
        help="Base URL of the Cloud Run service.",
    )
    parser.add_argument(
        "--sample-dir",
        type=Path,
        default=Path("."),
        help="Directory containing sample input files.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=420,
        help="Request timeout (seconds).",
    )
    parser.add_argument(
        "--json-report",
        type=Path,
        help="Optional path to store a JSON summary of the test run.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    service_url = args.url.rstrip("/")
    sample_dir = args.sample_dir.resolve()

    print("\n" + "=" * 60)
    print("PDF Master Tool - Service Test Suite")
    print("=" * 60)
    print(f"Testing Cloud Run service: {service_url}")
    print(f"Using sample directory: {sample_dir}")

    if not test_health(service_url, timeout=10):
        print("\n❌ Health check failed. Service may not be running.")
        print("   Please check:")
        print("   1. Service is deployed: gcloud run services list")
        print("   2. Service URL is correct")
        print("   3. Service is accessible")
        return 1

    test_cases = load_default_test_cases(sample_dir)
    results: dict[str, bool] = {}

    for endpoint, file_path, expected_ext in test_cases:
        resolved_path = _resolve_file_path(file_path, sample_dir)
        result = test_endpoint(
            service_url,
            endpoint,
            resolved_path,
            expected_ext,
            timeout=args.timeout,
        )
        results[endpoint] = result

    print(f"\n{'='*60}")
    print("Test Summary")
    print(f"{'='*60}")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for endpoint, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {endpoint}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if args.json_report:
        report_data = {
            "service_url": service_url,
            "sample_dir": str(sample_dir),
            "results": results,
        }
        args.json_report.write_text(json.dumps(report_data, indent=2), encoding="utf-8")
        print(f"\n📄 JSON report saved to: {args.json_report}")

    if passed == total:
        print("\n🎉 All services are working correctly!")
        return 0

    print(f"\n⚠️  {total - passed} service(s) need attention")
    return 1


if __name__ == "__main__":
    sys.exit(main())

