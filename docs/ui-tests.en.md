# UI Test Scenarios - Streamer

10 BDD scenarios for testing the Czech Internet Radio Player application.

---

## Scenario 1: Play radio from catalog

```gherkin
Feature: Playing radio from catalog
  As a user
  I want to select a radio from the catalog and play it
  So that I can listen to music

  Scenario: Select and play a radio station
    Given I am on the main page of the application
    When I click the "Browse Radios" button
    And I select "Radio 1" from the list
    And I click the "Add to Playlist" button
    And I click the play button
    Then the audio wave animation is displayed
    And the station name "Radio 1" is shown
    And I hear the audio stream
```

---

## Scenario 2: Filter radios by category

```gherkin
Feature: Filtering radios
  As a user
  I want to filter radios by category
  So that I can quickly find the genre I'm interested in

  Scenario: Filter by Rock category
    Given I am in the radio selection modal
    When I select "Rock" category from the dropdown menu
    Then only radios with Rock category are displayed
    And other radios are hidden
```

---

## Scenario 3: Search radio by name

```gherkin
Feature: Searching radios
  As a user
  I want to search radios by name
  So that I can quickly find a specific station

  Scenario: Search radio using the text field
    Given I am in the radio selection modal
    When I type "Impuls" into the search field
    Then the radio list filters in real-time
    And only radios containing "Impuls" in their name are displayed
```

---

## Scenario 4: Add custom station to playlist

```gherkin
Feature: Adding custom station
  As a user
  I want to add a custom internet radio
  So that I can listen to stations outside the catalog

  Scenario: Manually add a custom station
    Given I am on the main page of the application
    When I click the "Add" button in the "Your Stations" section
    And I fill in the station name "My Radio"
    And I fill in the stream URL "https://example.com/stream.mp3"
    And I click the "Add Station" button
    Then the station "My Radio" appears in the playlist
    And the form closes
```

---

## Scenario 5: Edit existing station in playlist

```gherkin
Feature: Editing station
  As a user
  I want to edit an existing station in the playlist
  So that I can fix the name or URL

  Scenario: Edit station name
    Given I have a station "Old Name" in my playlist
    When I hover over the station in the playlist
    And I click the pencil icon (edit)
    And I change the name to "New Name"
    And I click the "Save Changes" button
    Then the station is renamed to "New Name"
    And the change is saved in cookies
```

---

## Scenario 6: Control player volume

```gherkin
Feature: Volume control
  As a user
  I want to adjust the playback volume
  So that I have control over the sound level

  Scenario: Change volume using the slider
    Given I am playing a radio
    And the volume is set to 80%
    When I move the volume slider to 50%
    Then the value "50%" is displayed
    And the audio stream volume changes to 50%
```

---

## Scenario 7: Export and import playlist

```gherkin
Feature: Export and import playlist
  As a user
  I want to export and import my playlist
  So that I can backup or transfer my stations

  Scenario: Export playlist to JSON file
    Given I have at least one station in my playlist
    When I click the export button (download icon)
    Then a file "playlist.json" is downloaded
    And the file contains all my stations

  Scenario: Import playlist from JSON file
    Given I have an empty playlist
    When I click the import button (upload icon)
    And I select a valid JSON playlist file
    Then the stations from the file are loaded into the playlist
```

---

## Scenario 8: Select stream format and bitrate

```gherkin
Feature: Stream quality selection
  As a user
  I want to select the stream format and bitrate
  So that I have control over playback quality

  Scenario: Select MP3 format with high bitrate
    Given I am in the radio selection modal
    And I have selected a radio with multiple formats
    When I click the "MP3" button
    And I click the "320k" button
    Then the selected format and bitrate are shown in the footer section
    And the buttons are visually marked as active
```

---

## Scenario 9: Switch between stations in playlist

```gherkin
Feature: Switching stations
  As a user
  I want to quickly switch between stations in the playlist
  So that I can easily change what I'm listening to

  Scenario: Switch to another station during playback
    Given I am playing station "Radio 1"
    And I have another station "Radio 2" in my playlist
    When I click on station "Radio 2" in the playlist
    Then playback of "Radio 1" stops
    And "Radio 2" starts playing
    And the activity indicator moves to "Radio 2"
```

---

## Scenario 10: Handle playback error

```gherkin
Feature: Error handling
  As a user
  I want to see a clear error message
  When the stream cannot be played

  Scenario: Display error for unavailable stream
    Given I have a station with an invalid URL in my playlist
    When I click on this station
    And I click the play button
    Then an error message is displayed
    And the error icon is visible
    And the play button remains functional for retry
```

---

## Functionality Coverage

| Area | Scenarios |
|------|-----------|
| Playback | 1, 6, 9 |
| Radio catalog | 1, 2, 3, 8 |
| Playlist management | 4, 5, 7 |
| Error handling | 10 |
| Persistence | 5, 7 |
