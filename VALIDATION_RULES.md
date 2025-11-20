# Property Validation Rules

Complete validation rules for property creation and updates.

## Required Fields

All of these fields are **required** when creating a property:

- `name` (string, 3-200 characters)
- `location` (string, 2-200 characters)
- `description` (string, 10-500 characters)
- `longDescription` (string, minimum 50 characters)
- `price` (string)
- `size` (string)
- `bedrooms` (number, minimum 0)
- `bathrooms` (number, minimum 0)
- `amenities` (object)
- `images` (array, minimum 1 image)
- `investmentDetails` (object)
- `features` (array, minimum 1 feature)

## Optional Fields

- `priceNumeric` (number)
- `coordinates` (object with `lat` and `lng`)
- `nearbyAttractions` (array)

## Field Validation Rules

### Name
- **Type:** String
- **Min Length:** 3 characters
- **Max Length:** 200 characters
- **Required:** Yes

### Location
- **Type:** String
- **Min Length:** 2 characters
- **Max Length:** 200 characters
- **Required:** Yes

### Description
- **Type:** String
- **Min Length:** 10 characters
- **Max Length:** 500 characters
- **Required:** Yes

### Long Description
- **Type:** String
- **Min Length:** 50 characters
- **Required:** Yes

### Price
- **Type:** String
- **Required:** Yes
- **Example:** "$2,500,000"

### Size
- **Type:** String
- **Required:** Yes
- **Example:** "2,500 sq ft"

### Bedrooms
- **Type:** Number
- **Min Value:** 0
- **Required:** Yes

### Bathrooms
- **Type:** Number
- **Min Value:** 0
- **Required:** Yes

### Amenities
- **Type:** Object
- **Required:** Yes
- **Structure:**
  ```json
  {
    "beds": "string",
    "capacity": "string",
    "ac": "string",
    "bathroom": "string"
  }
  ```

### Images
- **Type:** Array of Strings
- **Min Length:** 1 image
- **Required:** Yes
- **Example:** `["/img/usa.jpg", "/img/usa1.jpg"]`

### Investment Details
- **Type:** Object
- **Required:** Yes
- **Structure:**
  ```json
  {
    "roi": "string",
    "expectedReturn": "string",
    "location": "string",
    "propertyType": "string"
  }
  ```

### Features
- **Type:** Array of Strings
- **Min Length:** 1 feature
- **Required:** Yes
- **Example:** `["Premium Location", "Modern Architecture"]`

### Coordinates (Optional)
- **Type:** Object
- **Required:** No
- **Structure:**
  ```json
  {
    "lat": number,  // Must be between -90 and 90
    "lng": number   // Must be between -180 and 180
  }
  ```
- **Validation:**
  - `lat` must be between -90 and 90 (latitude range)
  - `lng` must be between -180 and 180 (longitude range)

### Nearby Attractions (Optional)
- **Type:** Array of Strings
- **Required:** No
- **Example:** `["Central Park - 0.5 miles", "Times Square - 1.2 miles"]`

## Error Response Format

When validation fails, you'll receive a response like this:

```json
{
  "success": false,
  "message": "Validation failed. Please check your input.",
  "errors": {
    "description": "Path `description` (`hjh`, length 3) is shorter than the minimum allowed length (10).",
    "longDescription": "Path `longDescription` (`jhjh`, length 4) is shorter than the minimum allowed length (50).",
    "coordinates.lat": "Path `coordinates.lat` (9898) is more than maximum allowed value (90).",
    "coordinates.lng": "Path `coordinates.lng` (9898) is more than maximum allowed value (180)."
  },
  "error": "Property validation failed: description: Path `description` (`hjh`, length 3) is shorter than the minimum allowed length (10)...."
}
```

## Example Valid Property

```json
{
  "name": "Heritage Suite",
  "location": "New York, USA",
  "description": "Indulge in world-class hospitality, refined interiors, and personalized service",
  "longDescription": "This exceptional property offers a perfect blend of luxury living and investment potential. Located in the heart of New York, this stunning apartment features modern architecture, smart home technology, and high-end finishes throughout.",
  "price": "$2,500,000",
  "priceNumeric": 2500000,
  "size": "2,500 sq ft",
  "bedrooms": 2,
  "bathrooms": 1,
  "amenities": {
    "beds": "2 King Bed",
    "capacity": "4 Person",
    "ac": "Air Conditioned",
    "bathroom": "1 Spacious Bathroom"
  },
  "images": [
    "/img/usa.jpg",
    "/img/usa1.jpg"
  ],
  "investmentDetails": {
    "roi": "8-12%",
    "expectedReturn": "15-20 years",
    "location": "New York, USA",
    "propertyType": "Luxury Apartment"
  },
  "features": [
    "Premium Location",
    "Modern Architecture"
  ],
  "coordinates": {
    "lat": 40.7589,
    "lng": -73.9851
  },
  "nearbyAttractions": [
    "Central Park - 0.5 miles"
  ]
}
```

## Common Validation Errors

### Description Too Short
- **Error:** "Path `description` (`hjh`, length 3) is shorter than the minimum allowed length (10)."
- **Fix:** Make description at least 10 characters long

### Long Description Too Short
- **Error:** "Path `longDescription` (`jhjh`, length 4) is shorter than the minimum allowed length (50)."
- **Fix:** Make longDescription at least 50 characters long

### Invalid Latitude
- **Error:** "Path `coordinates.lat` (9898) is more than maximum allowed value (90)."
- **Fix:** Latitude must be between -90 and 90

### Invalid Longitude
- **Error:** "Path `coordinates.lng` (9898) is more than maximum allowed value (180)."
- **Fix:** Longitude must be between -180 and 180

### Missing Images
- **Error:** "Path `images` is required."
- **Fix:** Provide at least 1 image in the images array

### Missing Features
- **Error:** "Path `features` is required."
- **Fix:** Provide at least 1 feature in the features array

---

**Last Updated:** January 2024

