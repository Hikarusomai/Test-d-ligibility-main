# Integrating Visa Test into MMS Backoffice

MatchMySchool already supports CUSTOM and SPECIAL test types. Here is how to add the VISA type.

## Step 1: Extend Test Types
Update the TestType enum in the MMS backend to include VISA.

## Step 2: Question Management
The MMS backoffice question builder should be adapted to support the weight and scoringRules specific to the Visa logic.

## Step 3: Result Rendering
Create a new result component in the backoffice ResultView that displays the "Country Red Flags" (data retrieved from the scraper) alongside the student's score.
