Feature: Booking deletion via RESTful Booker API

  Scenario: Delete booking with valid authentication token
    Given a valid booking ID exists in the system
    And the user has a valid authentication token
    When a DELETE request is sent to the /booking/{bookingid} endpoint with the authentication token in the header
    Then the response status code should be 201
    And the booking should be removed from the system

  Scenario: Delete booking fails without authentication token
    Given a valid booking ID exists in the system
    When a DELETE request is sent to the /booking/{bookingid} endpoint without the authentication token
    Then the response status code should be 403
    And the response body should indicate unauthorized access

  Scenario: Delete non-existent booking
    Given an invalid booking ID (e.g., 999999) that does not exist in the system
    And the user has a valid authentication token
    When a DELETE request is sent to the /booking/999999 endpoint
    Then the response status code should be 404
    And the response body should indicate booking not found
