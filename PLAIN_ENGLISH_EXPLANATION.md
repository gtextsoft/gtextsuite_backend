# Plain English Explanation - Properties, Bookings & Inquiries

## 🏠 **PROPERTIES** - The Catalog

**What it is:** Properties are like products in a store - they're listings of places/homes/land that you own or manage.

**Types of Properties:**
1. **Rental** 🏠 - Places people can rent (like Airbnb, hotels)
   - Short-term: A few days/weeks (vacation stays)
   - Long-term: Months/years (apartment leases)

2. **Sale** 💰 - Properties you're selling (like real estate listings)
   - People buy these to own them permanently

3. **Investment** 📈 - Investment opportunities (off-plan, pre-construction)
   - People invest money expecting returns
   - Example: "Buy this villa now, it'll be ready in 2026, and you'll get 10% ROI"

4. **Tour** 🎫 - Tour/experience packages (not staying overnight)
   - Guided tours, excursions, experiences

**API Endpoint:** `GET /api/properties` - Get list of all properties
**API Endpoint:** `GET /api/properties/:id` - Get one specific property

---

## 📅 **BOOKINGS** - Date-Based Reservations

**What it is:** When someone wants to rent a property for specific dates (like booking a hotel room).

**Who can book:**
- Only **Rental** properties (short-term or long-term)
- Only **Tour** properties

**What you need:**
- Check-in date
- Check-out date
- Number of guests
- Guest contact info

**Examples:**
- "I want to book this apartment from Dec 1 to Dec 5"
- "I want to book this tour for next Saturday"

**API Endpoint:** `POST /api/bookings` - Create a new booking
**API Endpoint:** `GET /api/bookings/:id` - View an existing booking you made

**NOT for:**
- ❌ Investment properties (use Inquiry instead)
- ❌ Sale properties (use Inquiry instead)

---

## 💬 **INQUIRIES** - No-Date Requests

**What it is:** When someone is interested but doesn't need specific dates (like asking "how much?" or "tell me more").

**Who can inquire:**
- **Sale** properties - "I'm interested in buying this"
- **Investment** properties - "I want to invest in this project"

**What you need:**
- Contact info
- Budget range (for sales)
- Investment amount (for investments)
- Any questions/messages

**Examples:**
- "I'm interested in buying this house, my budget is $500k"
- "I want to invest $250k in this off-plan project"

**API Endpoint:** `POST /api/inquiries` - Create an inquiry
**API Endpoint:** `GET /api/inquiries/:id` - View an inquiry

**NOT for:**
- ❌ Rental properties (use Booking instead)
- ❌ Tour properties (use Booking instead)

---

## 🔄 **THE COMPLETE FLOW**

### Scenario 1: Someone wants to RENT a place

1. **Browse Properties** (`/booking`)
   - User sees list of rental properties
   - API: `GET /api/properties?propertyPurpose=rental`

2. **Click "Book Now"** → Goes to `/booking/property-id`

3. **View Property** (`/booking/property-id`)
   - API: `GET /api/properties/property-id`
   - Shows property details and booking form

4. **Fill Booking Form**
   - Select dates (check-in, check-out)
   - Enter guest info
   - Submit

5. **Create Booking**
   - API: `POST /api/bookings`
   - Creates booking record in database
   - Booking status: "pending" (admin approves later)

---

### Scenario 2: Someone wants to BUY a property

1. **Browse Properties** (`/properties`)
   - User sees list of properties (including sales)
   - API: `GET /api/properties?propertyPurpose=sale`

2. **Click on Sale Property** → Goes to `/properties/property-id`

3. **View Property** (`/properties/property-id`)
   - API: `GET /api/properties/property-id`
   - Shows property details, price, payment plans

4. **Click "Inquire Now"**
   - Opens inquiry modal/form

5. **Submit Inquiry**
   - API: `POST /api/inquiries`
   - Inquiry type: "sale"
   - Includes budget, contact info, questions
   - Inquiry status: "pending" (sales team follows up)

---

### Scenario 3: Someone wants to INVEST

1. **Browse Properties** (`/properties`)
   - User sees investment properties
   - API: `GET /api/properties?propertyPurpose=investment`

2. **Click Investment Property** → Goes to `/properties/property-id`

3. **View Property** (`/properties/property-id`)
   - API: `GET /api/properties/property-id`
   - Shows ROI, expected returns, payment milestones

4. **Click "Inquire Now"**
   - Opens inquiry modal/form

5. **Submit Inquiry**
   - API: `POST /api/inquiries`
   - Inquiry type: "investment"
   - Includes investment amount, expected ROI preference
   - Inquiry status: "pending" (investment team follows up)

---

### Scenario 4: Someone wants a TOUR

1. **Browse Properties** (`/booking`)
   - User sees tour properties
   - API: `GET /api/properties?propertyPurpose=tour`

2. **Click "Book Now"** → Goes to `/booking/tour-id`

3. **View Tour** (`/booking/tour-id`)
   - API: `GET /api/properties/tour-id`
   - Shows tour details and booking form

4. **Fill Booking Form**
   - Select tour date
   - Enter guest info
   - Submit

5. **Create Booking**
   - API: `POST /api/bookings`
   - Booking type: "tour"
   - Creates booking record

---

## 📊 **VISUAL SUMMARY**

```
PROPERTIES (Catalog)
│
├── RENTAL → BOOKINGS (need dates)
│   ├── Short-term (few days)
│   └── Long-term (months/years)
│
├── TOUR → BOOKINGS (need dates)
│   └── Experiences/excursions
│
├── SALE → INQUIRIES (no dates)
│   └── "I want to buy this"
│
└── INVESTMENT → INQUIRIES (no dates)
    └── "I want to invest in this"
```

---

## 🔑 **KEY DIFFERENCES**

| | **BOOKINGS** | **INQUIRIES** |
|---|---|---|
| **For what?** | Rental & Tour properties | Sale & Investment properties |
| **Need dates?** | ✅ YES (check-in/check-out) | ❌ NO |
| **What happens?** | Reserve specific dates | Express interest, ask questions |
| **Status flow** | pending → confirmed → completed | pending → contacted → qualified → closed |
| **Like booking:** | Hotel room, Airbnb | Asking about a car for sale |

---

## 🌐 **FRONTEND PAGES**

### `/booking` - Browse Bookable Properties
- Shows: Rental & Tour properties only
- Purpose: Find places to book with dates
- Click "Book Now" → Go to `/booking/property-id`

### `/booking/[id]` - Book a Specific Property
- Shows: Property details + booking form
- Fetches: `GET /api/properties/[id]`
- Purpose: Fill dates and create booking
- Creates: `POST /api/bookings`

### `/properties` - Browse All Properties
- Shows: All property types (sale, rental, investment, tour)
- Purpose: Browse your entire catalog
- Click property → Go to `/properties/[id]`

### `/properties/[id]` - View Property Details
- Shows: Full property details
- Fetches: `GET /api/properties/[id]`
- Purpose: See all info about a property
- Action buttons:
  - Rental/Tour → "Book Now" → `/booking/[id]`
  - Sale/Investment → "Inquire Now" → Opens inquiry modal

---

## 💡 **REAL-WORLD EXAMPLES**

**Booking (with dates):**
- "I want to rent this villa from January 1-7, 2025"
- "Book me for this city tour on Saturday"

**Inquiry (no dates):**
- "I'm interested in buying this house. What's the financing like?"
- "I want to invest $500k in this off-plan project. When will it be ready?"

---

## ✅ **SUMMARY**

- **Properties** = Your catalog (rental, sale, investment, tour)
- **Bookings** = Date-based reservations (rental & tour only)
- **Inquiries** = Interest/questions without dates (sale & investment only)

The system automatically routes people to the right flow based on property type!

