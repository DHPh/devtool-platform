# JSON Table Viewer Test Samples

## 1. Simple Array of Objects (Basic)

```json
[
  { "name": "John Doe", "age": 30, "city": "New York", "salary": 75000 },
  { "name": "Jane Smith", "age": 25, "city": "Los Angeles", "salary": 65000 },
  { "name": "Mike Johnson", "age": 35, "city": "Chicago", "salary": 80000 },
  { "name": "Sarah Wilson", "age": 28, "city": "Houston", "salary": 72000 }
]
```

## 2. Objects with Mixed Data Types

```json
[
  {
    "id": 1,
    "name": "Alice",
    "active": true,
    "score": 95.5,
    "joined": "2023-01-15",
    "tags": ["developer", "senior"]
  },
  {
    "id": 2,
    "name": "Bob",
    "active": false,
    "score": 88.2,
    "joined": "2023-03-22",
    "tags": ["designer", "junior"]
  },
  {
    "id": 3,
    "name": "Charlie",
    "active": true,
    "score": null,
    "joined": "2023-05-10",
    "tags": ["manager"]
  },
  {
    "id": 4,
    "name": "Diana",
    "active": true,
    "score": 92.8,
    "joined": null,
    "tags": []
  }
]
```

## 3. Nested Objects (Will be Flattened)

```json
[
  {
    "name": "John",
    "contact": {
      "email": "john@example.com",
      "phone": "+1-555-0123"
    },
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "zip": "10001"
    },
    "role": "Developer"
  },
  {
    "name": "Jane",
    "contact": {
      "email": "jane@example.com",
      "phone": "+1-555-0456"
    },
    "address": {
      "street": "456 Oak Ave",
      "city": "Los Angeles",
      "zip": "90210"
    },
    "role": "Designer"
  }
]
```

## 4. E-commerce Products

```json
[
  {
    "id": 101,
    "name": "Laptop",
    "category": "Electronics",
    "price": 999.99,
    "inStock": true,
    "rating": 4.5,
    "reviews": 245
  },
  {
    "id": 102,
    "name": "Coffee Mug",
    "category": "Kitchen",
    "price": 12.99,
    "inStock": false,
    "rating": 4.2,
    "reviews": 89
  },
  {
    "id": 103,
    "name": "Wireless Mouse",
    "category": "Electronics",
    "price": 29.99,
    "inStock": true,
    "rating": 4.7,
    "reviews": 156
  },
  {
    "id": 104,
    "name": "Notebook",
    "category": "Office",
    "price": 5.99,
    "inStock": true,
    "rating": 4.0,
    "reviews": 67
  }
]
```

## 5. Employee Data with Complex Structure

```json
[
  {
    "employee_id": "EMP001",
    "personal": {
      "first_name": "Michael",
      "last_name": "Rodriguez",
      "date_of_birth": "1985-06-15"
    },
    "employment": {
      "department": "Engineering",
      "position": "Senior Developer",
      "hire_date": "2020-03-01",
      "salary": 95000
    },
    "skills": ["JavaScript", "Python", "React"],
    "performance": {
      "rating": 4.8,
      "last_review": "2024-01-15"
    }
  },
  {
    "employee_id": "EMP002",
    "personal": {
      "first_name": "Sarah",
      "last_name": "Chen",
      "date_of_birth": "1990-12-03"
    },
    "employment": {
      "department": "Design",
      "position": "UX Designer",
      "hire_date": "2021-07-15",
      "salary": 78000
    },
    "skills": ["Figma", "Adobe XD", "HTML/CSS"],
    "performance": {
      "rating": 4.6,
      "last_review": "2024-01-10"
    }
  }
]
```

## 6. Sales Data

```json
[
  {
    "date": "2024-01-01",
    "product": "Widget A",
    "quantity": 50,
    "unit_price": 25.99,
    "customer_type": "retail",
    "region": "North"
  },
  {
    "date": "2024-01-01",
    "product": "Widget B",
    "quantity": 30,
    "unit_price": 45.5,
    "customer_type": "wholesale",
    "region": "South"
  },
  {
    "date": "2024-01-02",
    "product": "Widget A",
    "quantity": 75,
    "unit_price": 25.99,
    "customer_type": "retail",
    "region": "East"
  },
  {
    "date": "2024-01-02",
    "product": "Widget C",
    "quantity": 20,
    "unit_price": 89.99,
    "customer_type": "wholesale",
    "region": "West"
  }
]
```

## 7. Single Object (Will be converted to single row)

```json
{
  "company": "TechCorp Inc.",
  "founded": 2010,
  "employees": 1250,
  "revenue": 50000000,
  "headquarters": {
    "city": "San Francisco",
    "state": "CA",
    "country": "USA"
  },
  "products": ["Software", "Hardware", "Services"],
  "public": true
}
```

## 8. Survey Responses

```json
[
  {
    "response_id": 1,
    "age_group": "25-34",
    "satisfaction": 4,
    "recommend": true,
    "comments": "Great service!",
    "survey_date": "2024-01-15"
  },
  {
    "response_id": 2,
    "age_group": "35-44",
    "satisfaction": 5,
    "recommend": true,
    "comments": "Excellent experience",
    "survey_date": "2024-01-16"
  },
  {
    "response_id": 3,
    "age_group": "18-24",
    "satisfaction": 3,
    "recommend": false,
    "comments": "Could be better",
    "survey_date": "2024-01-17"
  },
  {
    "response_id": 4,
    "age_group": "45-54",
    "satisfaction": 4,
    "recommend": true,
    "comments": null,
    "survey_date": "2024-01-18"
  }
]
```

## Quick Test Data (Copy & Paste Ready)

### Basic Test:

```
[{"name":"John","age":30,"city":"NYC"},{"name":"Jane","age":25,"city":"LA"}]
```

### With Nulls and Booleans:

```
[{"id":1,"name":"Alice","active":true,"score":95.5},{"id":2,"name":"Bob","active":false,"score":null}]
```

### Nested Objects:

```
[{"name":"John","contact":{"email":"john@test.com","phone":"555-0123"}},{"name":"Jane","contact":{"email":"jane@test.com","phone":"555-0456"}}]
```

## Expected Results

When you paste these JSON samples into the JSON Table Viewer:

1. **Flattening**: Nested objects like `contact.email` will become separate columns
2. **Type Rendering**:
   - Booleans will show as badges (green for true, gray for false)
   - Numbers will be formatted with commas
   - Null values will show as italic "null"
3. **Arrays**: Will be converted to JSON strings
4. **Long Text**: Values over 100 characters will be truncated with "..." and show full text on hover

## Testing Features

Try these actions with the sample data:

- ✅ Sort columns by clicking headers
- ✅ Search globally using the search box
- ✅ Navigate with pagination
- ✅ Export as JSON or CSV
- ✅ View column statistics in hover tooltips
