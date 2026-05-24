"""
Test Runner for Keyword-Driven Automation Framework
Executes tests by reading keywords and test data
"""

import json
import sys
import time
from datetime import datetime
from keywords import APIKeywords
from locators import BookerAPILocators, TestDataFields


class TestResult:
    """Container for test result information"""
    
    def __init__(self, test_name):
        self.test_name = test_name
        self.status = "Not Executed"
        self.duration = 0
        self.start_time = None
        self.end_time = None
        self.error_message = ""
        self.actual_result = ""
    
    def start(self):
        """Mark test start time"""
        self.start_time = time.time()
    
    def end(self):
        """Mark test end time and calculate duration"""
        self.end_time = time.time()
        self.duration = round(self.end_time - self.start_time, 2)
    
    def to_dict(self):
        """Convert result to dictionary"""
        return {
            "test_name": self.test_name,
            "status": self.status,
            "duration": self.duration,
            "error_message": self.error_message,
            "actual_result": self.actual_result
        }


class TestRunner:
    """Main test runner class"""
    
    def __init__(self, test_data_file):
        """
        Initialize test runner
        Args:
            test_data_file: Path to test data JSON file
        """
        self.test_data = self._load_test_data(test_data_file)
        self.results = []
        self.keywords = APIKeywords()
    
    def _load_test_data(self, test_data_file):
        """Load test data from JSON file"""
        try:
            with open(test_data_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading test data: {e}")
            return {}
    
    def test_create_booking_with_valid_data(self):
        """TC_001: Create booking with valid data"""
        result = TestResult("TC_001: Create booking with valid data")
        result.start()
        
        try:
            test_data = self.test_data.get("bookings", {}).get("valid_booking_1", {})
            response = self.keywords.create_booking(test_data)
            
            result.actual_result = f"Status: {response.status_code}"
            
            if response.status_code == BookerAPILocators.SUCCESS_STATUS:
                result_json = response.json()
                if BookerAPILocators.RESPONSE_BOOKING_ID in result_json:
                    result.status = "Pass"
                    result.actual_result = f"Booking created with ID: {result_json[BookerAPILocators.RESPONSE_BOOKING_ID]}"
                else:
                    result.status = "Fail"
                    result.error_message = "No booking ID in response"
            else:
                result.status = "Fail"
                result.error_message = f"Unexpected status code: {response.status_code}"
        except Exception as e:
            result.status = "Fail"
            result.error_message = str(e)
        
        result.end()
        self.results.append(result)
    
    def test_create_booking_missing_fields(self):
        """TC_002: Create booking with missing required fields"""
        result = TestResult("TC_002: Create booking with missing required fields")
        result.start()
        
        try:
            test_data = self.test_data.get("bookings", {}).get("invalid_booking_missing_firstname", {})
            response = self.keywords.create_booking(test_data)
            
            result.actual_result = f"Status: {response.status_code}"
            
            if response.status_code == BookerAPILocators.BAD_REQUEST_STATUS:
                result.status = "Pass"
            else:
                result.status = "Fail"
                result.error_message = f"Expected 400, got {response.status_code}"
        except Exception as e:
            result.status = "Fail"
            result.error_message = str(e)
        
        result.end()
        self.results.append(result)
    
    def test_create_booking_invalid_type(self):
        """TC_003: Create booking with invalid data type"""
        result = TestResult("TC_003: Create booking with invalid data type")
        result.start()
        
        try:
            test_data = self.test_data.get("bookings", {}).get("invalid_booking_invalid_totalprice_type", {})
            response = self.keywords.create_booking(test_data)
            
            result.actual_result = f"Status: {response.status_code}"
            
            if response.status_code == BookerAPILocators.BAD_REQUEST_STATUS:
                result.status = "Pass"
            else:
                result.status = "Fail"
                result.error_message = f"Expected 400, got {response.status_code}"
        except Exception as e:
            result.status = "Fail"
            result.error_message = str(e)
        
        result.end()
        self.results.append(result)
    
    def test_retrieve_booking_valid_id(self):
        """TC_004: Retrieve booking by valid booking ID"""
        result = TestResult("TC_004: Retrieve booking by valid booking ID")
        result.start()
        
        try:
            # First create a booking
            test_data = self.test_data.get("bookings", {}).get("valid_booking_2", {})
            create_response = self.keywords.create_booking(test_data)
            
            if create_response.status_code == BookerAPILocators.SUCCESS_STATUS:
                booking_id = create_response.json().get(BookerAPILocators.RESPONSE_BOOKING_ID)
                
                # Then retrieve it
                response = self.keywords.get_booking(booking_id)
                result.actual_result = f"Status: {response.status_code}"
                
                if response.status_code == BookerAPILocators.SUCCESS_STATUS:
                    result.status = "Pass"
                else:
                    result.status = "Fail"
                    result.error_message = f"Expected 200, got {response.status_code}"
            else:
                result.status = "Fail"
                result.error_message = "Failed to create booking for retrieval test"
        except Exception as e:
            result.status = "Fail"
            result.error_message = str(e)
        
        result.end()
        self.results.append(result)
    
    def test_retrieve_booking_invalid_id(self):
        """TC_005: Retrieve booking with invalid booking ID"""
        result = TestResult("TC_005: Retrieve booking with invalid booking ID")
        result.start()
        
        try:
            invalid_id = self.test_data.get("invalid_booking_id", 999999)
            response = self.keywords.get_booking(invalid_id)
            
            result.actual_result = f"Status: {response.status_code}"
            
            if response.status_code == BookerAPILocators.NOT_FOUND_STATUS:
                result.status = "Pass"
            else:
                result.status = "Fail"
                result.error_message = f"Expected 404, got {response.status_code}"
        except Exception as e:
            result.status = "Fail"
            result.error_message = str(e)
        
        result.end()
        self.results.append(result)
    
    def test_update_booking_with_auth(self):
        """TC_006: Update booking with valid data and authentication token"""
        result = TestResult("TC_006: Update booking with valid data and authentication token")
        result.start()
        
        try:
            # Authenticate
            auth_data = self.test_data.get("auth_credentials", {}).get("valid", {})
            auth_response = self.keywords.authenticate(auth_data.get("username"), auth_data.get("password"))
            
            if auth_response.status_code == BookerAPILocators.SUCCESS_STATUS:
                # Create booking
                test_data = self.test_data.get("bookings", {}).get("valid_booking_1", {})
                create_response = self.keywords.create_booking(test_data)
                
                if create_response.status_code == BookerAPILocators.SUCCESS_STATUS:
                    booking_id = create_response.json().get(BookerAPILocators.RESPONSE_BOOKING_ID)
                    
                    # Update booking
                    updated_data = self.test_data.get("bookings", {}).get("valid_booking_2", {})
                    response = self.keywords.update_booking(booking_id, updated_data)
                    
                    result.actual_result = f"Status: {response.status_code}"
                    
                    if response.status_code == BookerAPILocators.SUCCESS_STATUS:
                        result.status = "Pass"
                    else:
                        result.status = "Fail"
                        result.error_message = f"Expected 200, got {response.status_code}"
                else:
                    result.status = "Fail"
                    result.error_message = "Failed to create booking for update test"
            else:
                result.status = "Fail"
                result.error_message = "Authentication failed"
        except Exception as e:
            result.status = "Fail"
            result.error_message = str(e)
        
        result.end()
        self.results.append(result)
    
    def test_update_booking_without_auth(self):
        """TC_007: Update booking without authentication token"""
        result = TestResult("TC_007: Update booking without authentication token")
        result.start()
        
        try:
            # Clear auth token
            self.keywords.auth_token = None
            
            # Create booking
            test_data = self.test_data.get("bookings", {}).get("valid_booking_1", {})
            create_response = self.keywords.create_booking(test_data)
            
            if create_response.status_code == BookerAPILocators.SUCCESS_STATUS:
                booking_id = create_response.json().get(BookerAPILocators.RESPONSE_BOOKING_ID)
                
                # Try to update without auth
                updated_data = self.test_data.get("bookings", {}).get("valid_booking_2", {})
                response = self.keywords.update_booking(booking_id, updated_data)
                
                result.actual_result = f"Status: {response.status_code}"
                
                if response.status_code == BookerAPILocators.FORBIDDEN_STATUS:
                    result.status = "Pass"
                else:
                    result.status = "Fail"
                    result.error_message = f"Expected 403, got {response.status_code}"
            else:
                result.status = "Fail"
                result.error_message = "Failed to create booking for test"
        except Exception as e:
            result.status = "Fail"
            result.error_message = str(e)
        
        result.end()
        self.results.append(result)
    
    def test_delete_booking_with_auth(self):
        """TC_008: Delete booking with valid authentication token"""
        result = TestResult("TC_008: Delete booking with valid authentication token")
        result.start()
        
        try:
            # Authenticate
            auth_data = self.test_data.get("auth_credentials", {}).get("valid", {})
            auth_response = self.keywords.authenticate(auth_data.get("username"), auth_data.get("password"))
            
            if auth_response.status_code == BookerAPILocators.SUCCESS_STATUS:
                # Create booking
                test_data = self.test_data.get("bookings", {}).get("valid_booking_1", {})
                create_response = self.keywords.create_booking(test_data)
                
                if create_response.status_code == BookerAPILocators.SUCCESS_STATUS:
                    booking_id = create_response.json().get(BookerAPILocators.RESPONSE_BOOKING_ID)
                    
                    # Delete booking
                    response = self.keywords.delete_booking(booking_id)
                    
                    result.actual_result = f"Status: {response.status_code}"
                    
                    if response.status_code == BookerAPILocators.CREATED_STATUS:
                        result.status = "Pass"
                    else:
                        result.status = "Fail"
                        result.error_message = f"Expected 201, got {response.status_code}"
                else:
                    result.status = "Fail"
                    result.error_message = "Failed to create booking for deletion test"
            else:
                result.status = "Fail"
                result.error_message = "Authentication failed"
        except Exception as e:
            result.status = "Fail"
            result.error_message = str(e)
        
        result.end()
        self.results.append(result)
    
    def test_authenticate_valid_credentials(self):
        """TC_009: Generate authentication token with valid credentials"""
        result = TestResult("TC_009: Generate authentication token with valid credentials")
        result.start()
        
        try:
            auth_data = self.test_data.get("auth_credentials", {}).get("valid", {})
            response = self.keywords.authenticate(auth_data.get("username"), auth_data.get("password"))
            
            result.actual_result = f"Status: {response.status_code}"
            
            if response.status_code == BookerAPILocators.SUCCESS_STATUS:
                response_json = response.json()
                if BookerAPILocators.RESPONSE_TOKEN in response_json:
                    result.status = "Pass"
                else:
                    result.status = "Fail"
                    result.error_message = "No token in response"
            else:
                result.status = "Fail"
                result.error_message = f"Expected 200, got {response.status_code}"
        except Exception as e:
            result.status = "Fail"
            result.error_message = str(e)
        
        result.end()
        self.results.append(result)
    
    def test_authenticate_invalid_credentials(self):
        """TC_010: Generate authentication token with invalid credentials"""
        result = TestResult("TC_010: Generate authentication token with invalid credentials")
        result.start()
        
        try:
            auth_data = self.test_data.get("auth_credentials", {}).get("invalid", {})
            response = self.keywords.authenticate(auth_data.get("username"), auth_data.get("password"))
            
            result.actual_result = f"Status: {response.status_code}"
            
            if response.status_code == BookerAPILocators.UNAUTHORIZED_STATUS:
                result.status = "Pass"
            else:
                result.status = "Fail"
                result.error_message = f"Expected 401, got {response.status_code}"
        except Exception as e:
            result.status = "Fail"
            result.error_message = str(e)
        
        result.end()
        self.results.append(result)
    
    def run_all_tests(self):
        """Execute all test cases"""
        print("Starting test execution...")
        print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        self.test_create_booking_with_valid_data()
        self.test_create_booking_missing_fields()
        self.test_create_booking_invalid_type()
        self.test_retrieve_booking_valid_id()
        self.test_retrieve_booking_invalid_id()
        self.test_update_booking_with_auth()
        self.test_update_booking_without_auth()
        self.test_delete_booking_with_auth()
        self.test_authenticate_valid_credentials()
        self.test_authenticate_invalid_credentials()
        
        print("Test execution completed.\n")
        self.keywords.cleanup()
    
    def get_results(self):
        """Get all test results"""
        return [result.to_dict() for result in self.results]
    
    def print_results(self):
        """Print test results to console"""
        print("=" * 80)
        print("TEST RESULTS SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed = sum(1 for r in self.results if r.status == "Pass")
        failed = sum(1 for r in self.results if r.status == "Fail")
        
        for result in self.results:
            status_symbol = "✓" if result.status == "Pass" else "✗"
            print(f"\n{status_symbol} {result.test_name}")
            print(f"  Status: {result.status}")
            print(f"  Duration: {result.duration}s")
            if result.actual_result:
                print(f"  Result: {result.actual_result}")
            if result.error_message:
                print(f"  Error: {result.error_message}")
        
        print("\n" + "=" * 80)
        print(f"Total Tests: {total_tests} | Passed: {passed} | Failed: {failed}")
        print("=" * 80)


if __name__ == "__main__":
    import os
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    test_data_file = os.path.join(script_dir, "test_data.json")
    
    runner = TestRunner(test_data_file)
    runner.run_all_tests()
    runner.print_results()
