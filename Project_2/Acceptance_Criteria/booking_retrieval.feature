Feature: Booking retrieval via RESTful Booker API

  Scenario: Retrieve booking by valid booking ID
    Given a booking with a known valid booking ID exists in the system
    When a GET request is sent to the /booking/{bookingid} endpoint
    Then the response status code should be 200
    And the response body should contain the correct booking details

  Scenario: Retrieve booking with non-existent booking ID
    Given an invalid booking ID (e.g., 999999) that does not exist in the system
    When a GET request is sent to the /booking/999999 endpoint
    Then the response status code should be 404
    And the response body should indicate booking not found

  Scenario: Retrieve all bookings
    Given the API is available and bookings exist in the system
    When a GET request is sent to the /booking endpoint
    Then the response status code should be 200
    And the response body should contain a list of booking IDs
