Feature: Booking creation via RESTful Booker API

  Scenario: Create booking with valid data
    Given the user has valid booking data including firstname, lastname, totalprice, depositpaid, checkin, and checkout dates
    When a POST request is sent to the /booking endpoint with valid booking data
    Then the response status code should be 200
    And the response body should contain a unique bookingid
    And the booking should be stored correctly in the system

  Scenario: Booking creation fails with missing required fields
    Given the user has incomplete booking data missing the firstname field
    When a POST request is sent to the /booking endpoint with incomplete data
    Then the response status code should be 400
    And the response body should indicate missing required fields

  Scenario: Booking creation fails with invalid data types
    Given the user provides booking data with totalprice as a string instead of a number
    When a POST request is sent to the /booking endpoint
    Then the response status code should be 400
    And the response body should contain a validation error message

  Scenario: Booking creation with boundary value dates
    Given the user provides valid booking data with minimum and maximum date values
    When a POST request is sent to the /booking endpoint
    Then the response status code should be 200
    And the booking should be created with the provided dates
