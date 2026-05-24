# RESTful Booker API - Keyword-Driven Automation Framework

## Overview

This is a comprehensive Keyword-Driven Automation Testing Framework designed for the RESTful Booker API. The framework follows the RICE-POT methodology and is built using Python with the Requests library for API testing.

## Framework Architecture

### Layers

```
├── Locators Layer (locators.py)
│   └── Centralized API endpoints and element selectors
│
├── Keywords Layer (keywords.py)
│   └── Reusable action functions (send_post_request, create_booking, etc.)
│
├── Test Data Layer (test_data.json)
│   └── Externalised test data in JSON format
│
├── Test Execution Layer (test_runner.py)
│   └── Test cases execution logic
│
└── Reporting Layer (report_generator.py)
    └── HTML report generation
```

## Components

### 1. Locators (`locators.py`)

Contains centralized definitions for:
- API endpoints
- Request headers
- Response field identifiers
- HTTP status codes
- Field mappings

**Usage:**
```python
from locators import BookerAPILocators
url = BookerAPILocators.BOOKING_URL
status = BookerAPILocators.SUCCESS_STATUS
```

### 2. Keywords (`keywords.py`)

Implements reusable keyword actions:
- `send_post_request()` - POST requests
- `send_get_request()` - GET requests
- `send_put_request()` - PUT requests with auth
- `send_delete_request()` - DELETE requests with auth
- `create_booking()` - Create new booking
- `get_booking()` - Retrieve booking by ID
- `update_booking()` - Update booking details
- `delete_booking()` - Delete booking
- `authenticate()` - Generate auth token
- `verify_response_status()` - Validate response codes

**Usage:**
```python
from keywords import APIKeywords

api = APIKeywords()
response = api.create_booking(test_data)
if api.verify_response_status(200):
    print("Success!")
```

### 3. Test Data (`test_data.json`)

Externalised test data containing:
- Valid booking data
- Invalid booking scenarios
- Boundary test cases
- Authentication credentials
- Expected status codes

**Structure:**
```json
{
  "auth_credentials": { ... },
  "bookings": { ... },
  "test_expectations": { ... }
}
```

### 4. Test Runner (`test_runner.py`)

Executes all test cases:
- 10 comprehensive test cases
- Valid and invalid scenarios
- Error handling tests
- Authentication tests
- Results tracking

**Test Cases:**
- TC_001: Create booking with valid data
- TC_002: Create booking with missing fields
- TC_003: Create booking with invalid data type
- TC_004: Retrieve booking by valid ID
- TC_005: Retrieve booking with invalid ID
- TC_006: Update booking with authentication
- TC_007: Update booking without authentication
- TC_008: Delete booking with authentication
- TC_009: Generate auth token (valid credentials)
- TC_010: Generate auth token (invalid credentials)

### 5. Report Generator (`report_generator.py`)

Generates comprehensive HTML test report:
- Test execution summary
- Pass/Fail statistics
- Test duration tracking
- Error messages
- Visual metrics and charts

## Installation

### Prerequisites
- Python 3.7+
- pip (Python package manager)

### Setup

1. Install dependencies:
```bash
pip install requests
```

2. Navigate to automation directory:
```bash
cd automation
```

## Usage

### Run All Tests

Execute the main test runner with automatic report generation:

```bash
python run_tests.py
```

This will:
1. Load test data from `test_data.json`
2. Execute all 10 test cases
3. Generate HTML report in `../reports/report.html`
4. Print results to console

### Run Specific Test Module

```bash
# Run only the test runner
python test_runner.py

# Generate report only
python report_generator.py
```

### Import and Use Framework Programmatically

```python
from keywords import APIKeywords
from test_runner import TestRunner
from report_generator import HTMLReportGenerator

# Initialize framework
api = APIKeywords()

# Create booking
response = api.create_booking({
    "firstname": "John",
    "lastname": "Doe",
    "totalprice": 111,
    "depositpaid": True,
    "checkin": "2026-01-01",
    "checkout": "2026-01-10"
})

# Verify response
if api.verify_response_status(200):
    print("Booking created successfully")
    booking_data = api.get_response_json()
```

## Test Data Structure

### Valid Booking
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "totalprice": 111,
  "depositpaid": true,
  "checkin": "2026-01-01",
  "checkout": "2026-01-10",
  "additionalneeds": "Breakfast"
}
```

### Authentication
```json
{
  "username": "admin",
  "password": "password123"
}
```

## Output

### Console Output
```
================================================================================
RESTful Booker API - Test Execution Report
================================================================================

80 Executing tests...
✓ TC_001: Create booking with valid data
✗ TC_002: Create booking with missing fields
...

================================================================================
TEST RESULTS SUMMARY
================================================================================
Total Tests: 10 | Passed: 8 | Failed: 2
```

### HTML Report
Generated at: `../reports/report.html`

Contains:
- Executive summary with statistics
- Pass/Fail status for each test
- Execution duration
- Error messages
- Professional styling with responsive design

## Determinism & Reproducibility

All framework outputs are deterministic:
- Same test data → Same results
- Execution is stateless and repeatable
- External data is versioned
- Results are traceable to requirements

## API Reference

### RESTful Booker API Endpoints

- **Authentication**: `POST /auth` - Generate authentication token
- **Create Booking**: `POST /booking` - Create new booking
- **Get Booking**: `GET /booking/{id}` - Retrieve booking details
- **Update Booking**: `PUT /booking/{id}` - Update existing booking
- **Delete Booking**: `DELETE /booking/{id}` - Delete booking

### Response Status Codes

- 200: Success (GET, POST)
- 201: Created (DELETE)
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found

## Best Practices

1. **Test Data Management**
   - Keep test data externalised in JSON
   - Use meaningful data names
   - Include boundary test cases

2. **Keyword Design**
   - Single responsibility per keyword
   - Reusable across tests
   - Clear naming conventions

3. **Error Handling**
   - Always verify response status
   - Log detailed error messages
   - Use meaningful assertions

4. **Report Generation**
   - Generate reports automatically post-execution
   - Include execution time and summary
   - Maintain history of test runs

## Troubleshooting

### Module Import Errors
```
ModuleNotFoundError: No module named 'requests'
```
**Solution:** Install requests - `pip install requests`

### Connection Errors
```
ConnectionError: Unable to connect to API
```
**Solution:** Verify API endpoint is accessible - `https://restful-booker.herokuapp.com`

### JSON Parsing Errors
```
JSONDecodeError: Expecting value
```
**Solution:** Verify API returns valid JSON response

## Project Structure

```
automation/
├── __init__.py                 # Package initialization
├── locators.py                 # API endpoints and locators
├── keywords.py                 # Reusable actions
├── test_runner.py              # Test execution engine
├── report_generator.py         # HTML report generator
├── run_tests.py                # Main entry point
├── test_data.json              # Externalised test data
└── README.md                   # This file
```

## Acceptance Criteria

All acceptance criteria are defined in Gherkin format:
- `../Acceptance_Criteria/authentication.feature`
- `../Acceptance_Criteria/booking_creation.feature`
- `../Acceptance_Criteria/booking_retrieval.feature`
- `../Acceptance_Criteria/booking_update.feature`
- `../Acceptance_Criteria/booking_deletion.feature`

## License

Internal Use Only - RESTful Booker API Testing

## Support

For issues or questions, refer to the RICE-POT prompt and acceptance criteria documentation.
