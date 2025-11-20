# Related Properties API Documentation

## Overview

The Related Properties API allows you to fetch properties related to a specific property based on relevance scoring. This is more efficient than fetching all properties and filtering client-side.

## Backend API Endpoint

### `GET /api/properties/:id/related`

Get related properties for a specific property.

**Authentication:** Optional (public endpoint)

**Query Parameters:**
- `limit` (optional): Maximum number of related properties to return (default: 3)

**Example Request:**
```
GET /api/properties/691c5570957c3b879f653968/related?limit=3
```

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "_id": "691c5570957c3b879f653969",
        "name": "Related Property Name",
        "location": "Location",
        "description": "Description",
        "price": "1000000",
        "currency": "USD",
        "size": "500",
        "amenities": { ... },
        "images": [ ... ],
        "propertyPurpose": "rental",
        ...
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Property not found"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Something went wrong",
  "error": "Error details"
}
```

## Relevance Scoring Algorithm

Properties are scored based on the following criteria (in priority order):

1. **Same Location** (100 points)
   - Matches if `investmentDetails.location` or `location` is the same

2. **Same Property Type** (50 points)
   - Matches if both properties have `investmentDetails.propertyType` and they're the same

3. **Same Property Purpose** (30 points)
   - Matches if `propertyPurpose` is the same (sale, rental, investment, tour)

4. **Similar Price Range** (25 points)
   - Matches if price difference is within 30% of current property's price

5. **Similar Size** (10 points)
   - Matches if size difference is within 20% of current property's size

Properties are sorted by score (highest first) and the top N properties are returned (where N = limit).

## Frontend Usage

### React Hook

```typescript
import { useRelatedProperties } from "@/hooks/usePublic";

function MyComponent({ propertyId }: { propertyId: string }) {
  const { data: relatedProperties, isLoading, isError } = useRelatedProperties(
    propertyId,
    3 // limit (optional, default: 3)
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading related properties</div>;

  return (
    <div>
      {relatedProperties?.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
```

### Direct API Call

```typescript
import { getRelatedProperties } from "@/lib/api/public";

async function fetchRelated(id: string) {
  const response = await getRelatedProperties(id, 3);
  
  if (response.success && response.data) {
    const properties = response.data.properties;
    // Use properties...
  }
}
```

### RelatedProperties Component

```typescript
import RelatedProperties from "@/components/shared/RelatedProperties";

// Recommended: Use backend API (just pass propertyId)
<RelatedProperties propertyId={propertyId} maxItems={3} />

// Legacy: Client-side filtering (pass all properties)
<RelatedProperties
  currentProperty={property}
  allProperties={allProperties}
  maxItems={3}
/>
```

## Benefits

1. **Performance:** No need to fetch all properties (e.g., 1000+) just to find 3 related ones
2. **Scalability:** Works efficiently even with large property databases
3. **Server-Side:** Relevance scoring happens on the server, reducing client-side computation
4. **Caching:** Can be cached for better performance
5. **Privacy:** Admins can see all properties, regular users only see active/listed properties

## Visibility Rules

- **Regular Users:** Only see `isActive: true` AND `isListed: true` properties
- **Admins (logged in):** See all properties (including inactive/unlisted) when authenticated

## Migration from Client-Side

**Before (inefficient):**
```typescript
// Fetches ALL properties (1000+) just to find 3 related ones
const { data: allProperties } = useAllProperties({ limit: 1000 });
const relatedProperties = findRelatedProperties(
  currentProperty,
  allProperties.properties,
  3
);

<RelatedProperties
  currentProperty={property}
  allProperties={allProperties.properties}
  maxItems={3}
/>
```

**After (efficient):**
```typescript
// Only fetches 3 related properties from backend
<RelatedProperties propertyId={propertyId} maxItems={3} />
```

## Route Priority

The route `/api/properties/:id/related` must be registered **BEFORE** `/api/properties/:id` in the routes file to avoid route conflicts:

```typescript
// ✅ Correct order
router.get("/:id/related", optionalAuthenticate, getRelatedProperties);
router.get("/:id", optionalAuthenticate, getPropertyById);

// ❌ Wrong order - /:id will match first and ":id" will be "related"
router.get("/:id", optionalAuthenticate, getPropertyById);
router.get("/:id/related", optionalAuthenticate, getRelatedProperties);
```


