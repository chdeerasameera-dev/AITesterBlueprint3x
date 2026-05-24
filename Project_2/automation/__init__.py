"""
RESTful Booker API - Keyword-Driven Automation Framework

A comprehensive Python-based automation testing framework for RESTful Booker API
using a Keyword-Driven approach with Playwright and the Requests library.

Modules:
    locators: Centralized API endpoints and locators
    keywords: Reusable keyword actions for API testing
    test_runner: Main test execution engine
    report_generator: HTML report generation
    run_tests: Main entry point for test execution

Author: QA Automation Team
Version: 1.0.0
"""

__version__ = "1.0.0"
__author__ = "QA Automation Team"

from locators import BookerAPILocators, TestDataFields
from keywords import APIKeywords
from test_runner import TestRunner
from report_generator import HTMLReportGenerator

__all__ = [
    "BookerAPILocators",
    "TestDataFields",
    "APIKeywords",
    "TestRunner",
    "HTMLReportGenerator"
]
