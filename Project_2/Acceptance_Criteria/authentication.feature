Feature: Authentication via RESTful Booker API

  Scenario: Generate authentication token with valid credentials
    Given the user has valid username and password credentials
    When a POST request is sent to the /auth endpoint with valid credentials
    Then the response status code should be 200
    And the response body should contain a valid authentication token

  Scenario: Authentication token generation fails with invalid credentials
    Given the user has invalid username or password
    When a POST request is sent to the /auth endpoint with invalid credentials
    Then the response status code should be 401
    And the response body should indicate unauthorized access

  Scenario: Token is required for subsequent authenticated operations
    Given the user has a valid authentication token
    When performing updates or deletions on bookings
    Then the authorization header must contain the valid token
    And requests without the token should receive a 403 Forbidden response
