"""
Locators and Page Object Model for RESTful Booker API
Centralized element selectors and API endpoints
"""

class BookerAPILocators:
    """API endpoints and data identifiers"""
    
    # Base URL
    BASE_URL = "https://restful-booker.herokuapp.com"
    
    # API Endpoints
    BOOKING_ENDPOINT = "/booking"
    AUTH_ENDPOINT = "/auth"
    PING_ENDPOINT = "/ping"
    
    # Full URLs
    AUTH_URL = f"{BASE_URL}{AUTH_ENDPOINT}"
    BOOKING_URL = f"{BASE_URL}{BOOKING_ENDPOINT}"
    
    # Request Headers
    CONTENT_TYPE = "application/json"
    ACCEPT_HEADER = "application/json"
    
    # Authentication
    AUTH_HEADER_KEY = "Cookie"
    
    # Request Body Fields
    BOOKING_FIELDS = {
        "firstname": "firstname",
        "lastname": "lastname",
        "totalprice": "totalprice",
        "depositpaid": "depositpaid",
        "checkin": "bookingdates_checkin",
        "checkout": "bookingdates_checkout",
        "additionalneeds": "additionalneeds"
    }
    
    # Response Fields
    RESPONSE_BOOKING_ID = "bookingid"
    RESPONSE_TOKEN = "token"
    RESPONSE_REASON = "reason"
    
    # HTTP Status Codes Expected
    SUCCESS_STATUS = 200
    CREATED_STATUS = 201
    BAD_REQUEST_STATUS = 400
    UNAUTHORIZED_STATUS = 401
    FORBIDDEN_STATUS = 403
    NOT_FOUND_STATUS = 404
    
    # Error Messages
    ERROR_MISSING_FIELD = "Required field missing"
    ERROR_INVALID_TYPE = "Invalid data type"
    ERROR_UNAUTHORIZED = "Unauthorized"
    ERROR_NOT_FOUND = "Not Found"


class TestDataFields:
    """Test data field identifiers"""
    
    FIRSTNAME = "firstname"
    LASTNAME = "lastname"
    TOTALPRICE = "totalprice"
    DEPOSITPAID = "depositpaid"
    CHECKIN = "checkin"
    CHECKOUT = "checkout"
    ADDITIONALNEEDS = "additionalneeds"
    USERNAME = "username"
    PASSWORD = "password"
    BOOKINGID = "bookingid"
    TOKEN = "token"
