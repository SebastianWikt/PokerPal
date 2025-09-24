# Requirements Document

## Introduction

This feature implements a web-based poker tracking application using AngularJS that allows players to manage their profiles, log poker session entries, and view leaderboard results. The application tracks player winnings across sessions and provides a simple interface for check-in/check-out functionality with photo documentation of chip counts.

## Requirements

### Requirement 1

**User Story:** As a poker player, I want to log into the application using my computing ID, so that I can access my personal poker tracking data.

#### Acceptance Criteria

1. WHEN a user visits the application THEN the system SHALL display a login page with a computing ID input field
2. WHEN a user enters a valid computing ID THEN the system SHALL query the database for existing player data
3. IF the computing ID exists in the database THEN the system SHALL authenticate the user and redirect to the home page
4. IF the computing ID does not exist THEN the system SHALL redirect the user to the profile creation page
5. WHEN login is successful THEN the system SHALL maintain the user session throughout the application

### Requirement 2

**User Story:** As a new poker player, I want to create my profile with personal information, so that I can start tracking my poker sessions.

#### Acceptance Criteria

1. WHEN a new user accesses the profile creation page THEN the system SHALL display input fields for first name, last name, computing ID, years of experience, level, and major
2. WHEN a user submits the profile form THEN the system SHALL validate all required fields are completed
3. WHEN profile creation is successful THEN the system SHALL save the player data to the database with total winnings initialized to zero
4. WHEN profile creation is complete THEN the system SHALL redirect the user to the home page
5. WHEN displaying total winnings THEN the system SHALL show it as a read-only field that users cannot edit

### Requirement 3

**User Story:** As a logged-in poker player, I want to navigate between different sections of the application, so that I can manage my profile, create entries, and view results.

#### Acceptance Criteria

1. WHEN a user is on the home page THEN the system SHALL display three navigation buttons: "Create/Edit Profile", "Log Session", and "View Results"
2. WHEN a user clicks "Create/Edit Profile" THEN the system SHALL navigate to the profile management page
3. WHEN a user clicks "Create Entry" THEN the system SHALL navigate to the entry creation page
4. WHEN a user clicks "View Results" THEN the system SHALL navigate to the results viewing page
5. WHEN navigating between pages THEN the system SHALL maintain user session and context

### Requirement 4

**User Story:** As a poker player, I want to edit my profile information, so that I can keep my personal details up to date.

#### Acceptance Criteria

1. WHEN a user accesses the profile edit page THEN the system SHALL pre-populate all fields with current player data
2. WHEN a user modifies profile fields THEN the system SHALL allow editing of first name, last name, years of experience, level, and major
3. WHEN a user attempts to edit computing ID or total winnings THEN the system SHALL prevent modification of these fields
4. WHEN a user saves profile changes THEN the system SHALL update the player record in the database
5. WHEN profile update is successful THEN the system SHALL display a confirmation message

### Requirement 5

**User Story:** As a poker player, I want to create session entries with check-in/check-out functionality, so that I can track my poker session performance.

#### Acceptance Criteria

1. WHEN a user accesses the entry creation page THEN the system SHALL display fields for date (auto-filled with current date), check-in/check-out selection, and photo upload
2. WHEN the entry creation page loads THEN the system SHALL automatically populate the date field with the current date
3. WHEN a user selects "checking in" THEN the system SHALL create an entry record with start photo and starting chips data
4. WHEN a user selects "checking out" THEN the system SHALL update the existing entry with end photo and end chips data
5. WHEN a user uploads a photo THEN the system SHALL store the image and associate it with the entry
6. WHEN a start photo is uploaded THEN the system SHALL use computer vision to analyze the image and detect chips by color and count
7. WHEN an end photo is uploaded THEN the system SHALL use computer vision to analyze the image and detect chips by color and count
8. WHEN computer vision analysis is complete THEN the system SHALL calculate total chip value using the count of each color multiplied by admin-configured chip values
9. WHEN computer vision analysis is complete THEN the system SHALL populate the respective chips fields with the calculated total values
9. WHEN an entry has both check-in and check-out data THEN the system SHALL mark it as a completed entry
10. WHEN calculating net winnings THEN the system SHALL only include completed entries (those with both check-in and check-out data)
11. WHEN an entry is completed THEN the system SHALL calculate net winnings and update player total winnings
12. WHEN calculating net winnings THEN the system SHALL compute the difference between end chips and starting chips

### Requirement 6

**User Story:** As a poker player, I want to view a leaderboard of all players' winnings, so that I can see how I rank compared to other players.

#### Acceptance Criteria

1. WHEN a user accesses the results page THEN the system SHALL display a list of all players with their first name, last name, and total winnings
2. WHEN displaying the results THEN the system SHALL sort players by total winnings in descending order (highest winnings first)
3. WHEN the results page loads THEN the system SHALL query the database for current player winnings data
4. WHEN displaying player information THEN the system SHALL only show first name, last name, and total winnings (no other personal details)
5. WHEN the results are updated THEN the system SHALL reflect real-time changes in player winnings

### Requirement 7

**User Story:** As an admin user, I want to override chip counts for any player's session, so that I can correct data entry errors or make manual adjustments.

#### Acceptance Criteria

1. WHEN an admin user accesses the admin panel THEN the system SHALL display options to search for entries by computing ID and date
2. WHEN an admin searches for an entry THEN the system SHALL display the entry details with editable start chips and end chips fields
3. WHEN an admin modifies chip counts THEN the system SHALL update the entry record and recalculate net winnings
4. WHEN admin changes are saved THEN the system SHALL update the player's total winnings based on the new calculations
5. WHEN admin overrides are made THEN the system SHALL log the changes for audit purposes
6. WHEN accessing admin functions THEN the system SHALL verify the user has admin privileges
7. WHEN an admin accesses chip value configuration THEN the system SHALL display editable fields for each chip color and its monetary value
8. WHEN an admin updates chip values THEN the system SHALL save the new values and recalculate all existing entry totals
9. WHEN computer vision detects chips THEN the system SHALL use the current admin-configured values to calculate monetary totals

### Requirement 8

**User Story:** As a system administrator, I want the application to maintain data integrity between Player and Entry tables, so that all poker session data is accurately tracked.

#### Acceptance Criteria

1. WHEN creating an entry THEN the system SHALL use the computing ID as a foreign key to link entries to players
2. WHEN a player is deleted THEN the system SHALL handle cascading effects on related entries appropriately
3. WHEN calculating total winnings THEN the system SHALL aggregate net winnings from all completed entries for each player
4. WHEN storing entry data THEN the system SHALL include entry ID, computing ID, start photo, starting chips, end photo, end chips, net winnings, and total number of chips
5. WHEN storing player data THEN the system SHALL include first name, last name, computing ID, total winnings, years of experience, level, and major