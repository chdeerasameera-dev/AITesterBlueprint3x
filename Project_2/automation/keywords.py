"""
Keyword-Driven Layer for RESTful Booker API
Reusable action functions for API testing
"""

import requests
import json
from locators import BookerAPILocators, TestDataFields


class APIKeywords:
    """Keyword actions for API testing"""
    
    def __init__(self):
        """Initialize keyword layer"""
        self.base_url = BookerAPILocators.BASE_URL
        self.last_response = None
        self.last_booking_id = None
        self.auth_token = None
        self.session = requests.Session()
    
    def send_post_request(self, endpoint, payload):
        """
        Send POST request to specified endpoint
        Args:
            endpoint: API endpoint path
            payload: Request body as dictionary
        Returns:
            Response object
        """
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Content-Type": BookerAPILocators.CONTENT_TYPE,
            "Accept": BookerAPILocators.ACCEPT_HEADER
        }
        self.last_response = self.session.post(url, json=payload, headers=headers)
        return self.last_response
    
    def send_get_request(self, endpoint):
        """
        Send GET request to specified endpoint
        Args:
            endpoint: API endpoint path
        Returns:
            Response object
        """
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Accept": BookerAPILocators.ACCEPT_HEADER
        }
        self.last_response = self.session.get(url, headers=headers)
        return self.last_response
    
    def send_put_request(self, endpoint, payload):
        """
        Send PUT request with authentication
        Args:
            endpoint: API endpoint path
            payload: Request body as dictionary
        Returns:
            Response object
        """
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Content-Type": BookerAPILocators.CONTENT_TYPE,
            "Accept": BookerAPILocators.ACCEPT_HEADER
        }
        if self.auth_token:
            headers["Cookie"] = f"token={self.auth_token}"
        
        self.last_response = self.session.put(url, json=payload, headers=headers)
        return self.last_response
    
    def send_delete_request(self, endpoint):
        """
        Send DELETE request with authentication
        Args:
            endpoint: API endpoint path
        Returns:
            Response object
        """
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Content-Type": BookerAPILocators.CONTENT_TYPE
        }
        if self.auth_token:
            headers["Cookie"] = f"token={self.auth_token}"
        
        self.last_response = self.session.delete(url, headers=headers)
        return self.last_response
    
    def create_booking(self, test_data):
        """
        Create a new booking
        Args:
            test_data: Dictionary containing booking details
        Returns:
            Response object
        """
        payload = {
            "firstname": test_data.get(TestDataFields.FIRSTNAME),
            "lastname": test_data.get(TestDataFields.LASTNAME),
            "totalprice": test_data.get(TestDataFields.TOTALPRICE),
            "depositpaid": test_data.get(TestDataFields.DEPOSITPAID),
            "bookingdates": {
                "checkin": test_data.get(TestDataFields.CHECKIN),
                "checkout": test_data.get(TestDataFields.CHECKOUT)
            },
            "additionalneeds": test_data.get(TestDataFields.ADDITIONALNEEDS)
        }
        response = self.send_post_request(BookerAPILocators.BOOKING_ENDPOINT, payload)
        
        if response.status_code == BookerAPILocators.SUCCESS_STATUS:
            try:
                response_data = response.json()
                self.last_booking_id = response_data.get(BookerAPILocators.RESPONSE_BOOKING_ID)
            except:
                pass
        
        return response
    
    def get_booking(self, booking_id):
        """
        Retrieve booking by ID
        Args:
            booking_id: Booking identifier
        Returns:
            Response object
        """
        endpoint = f"{BookerAPILocators.BOOKING_ENDPOINT}/{booking_id}"
        return self.send_get_request(endpoint)
    
    def update_booking(self, booking_id, test_data):
        """
        Update booking with new data
        Args:
            booking_id: Booking identifier
            test_data: Dictionary containing updated booking details
        Returns:
            Response object
        """
        payload = {
            "firstname": test_data.get(TestDataFields.FIRSTNAME),
            "lastname": test_data.get(TestDataFields.LASTNAME),
            "totalprice": test_data.get(TestDataFields.TOTALPRICE),
            "depositpaid": test_data.get(TestDataFields.DEPOSITPAID),
            "bookingdates": {
                "checkin": test_data.get(TestDataFields.CHECKIN),
                "checkout": test_data.get(TestDataFields.CHECKOUT)
            },
            "additionalneeds": test_data.get(TestDataFields.ADDITIONALNEEDS)
        }
        endpoint = f"{BookerAPILocators.BOOKING_ENDPOINT}/{booking_id}"
        return self.send_put_request(endpoint, payload)
    
    def delete_booking(self, booking_id):
        """
        Delete booking by ID
        Args:
            booking_id: Booking identifier
        Returns:
            Response object
        """
        endpoint = f"{BookerAPILocators.BOOKING_ENDPOINT}/{booking_id}"
        return self.send_delete_request(endpoint)
    
    def authenticate(self, username, password):
        """
        Generate authentication token
        Args:
            username: Username for authentication
            password: Password for authentication
        Returns:
            Response object
        """
        payload = {
            "username": username,
            "password": password
        }
        response = self.send_post_request(BookerAPILocators.AUTH_ENDPOINT, payload)
        
        if response.status_code == BookerAPILocators.SUCCESS_STATUS:
            try:
                response_data = response.json()
                self.auth_token = response_data.get(BookerAPILocators.RESPONSE_TOKEN)
            except:
                pass
        
        return response
    
    def verify_response_status(self, expected_status):
        """
        Verify response status code
        Args:
            expected_status: Expected HTTP status code
        Returns:
            True if status matches, False otherwise
        """
        if not self.last_response:
            return False
        return self.last_response.status_code == expected_status
    
    def get_response_json(self):
        """
        Get response body as JSON
        Returns:
            Parsed JSON response or None
        """
        if not self.last_response:
            return None
        try:
            return self.last_response.json()
        except:
            return None
    
    def get_response_status(self):
        """
        Get response status code
        Returns:
            HTTP status code
        """
        if not self.last_response:
            return None
        return self.last_response.status_code
    
    def cleanup(self):
        """Close session"""
        if self.session:
            self.session.close()
