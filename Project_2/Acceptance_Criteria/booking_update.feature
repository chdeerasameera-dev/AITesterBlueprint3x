Feature: Booking update via RESTful Booker API

  Scenario: Update booking with valid data and authentication
    Given a valid booking ID exists in the system
    And the user has a valid authentication token
    When a PUT request is sent to the /booking/{bookingid} endpoint with valid updated booking data and the authentication token in the header
    Then the response status code should be 200
    And the booking data should be updated correctly in the system

  Scenario: Update booking fails without authentication token
    Given a valid booking ID exists in the system
    When a PUT request is sent to the /booking/{bookingid} endpoint without the authentication token
    Then the response status code should be 403
    And the response body should indicate unauthorized access

  Scenario: Update booking with invalid data types
    Given a valid booking ID exists in the system
    And the user has a valid authentication token
    When a PUT request is sent with booking data containing invalid data types
    Then the response status code should be 400
    And the response body should contain validation error messages
