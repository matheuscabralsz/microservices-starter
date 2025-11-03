# Product Domain Implementation Template

## Domain Overview

The Product domain is responsible for:
- Managing product catalog
- Product inventory tracking
- Product pricing and variants
- Product availability and searches

## Key Concepts

### Entities
- **Product**: Aggregate root
  - Properties: id, name, description, price, sku, status, createdAt, updatedAt
  - Invariants: Name required, price > 0, unique SKU, status must be valid

- **Inventory**: Part of Product aggregate
  - Properties: quantityOnHand, reservedQuantity, lowStockThreshold
  - Invariants: quantityOnHand >= reservedQuantity, threshold >= 0

- **ProductVariant**: If products have variants (size, color, etc)
  - Properties: id, productId, variant options, price override, inventory

### Value Objects
- **Sku**: Unique stock keeping unit (validated format)
- **ProductStatus**: ENUM (DRAFT, ACTIVE, INACTIVE, DISCONTINUED)
- **Money**: Price with currency
- **Inventory**: Quantity state with validation
- **Description**: Rich text with length validation

### Ports
- `IProductRepository`: CRUD operations on products
- `IInventoryService`: Check/update inventory
- `ISearchService`: Full-text search (optional)

### Use Cases
- CreateProduct
- UpdateProduct
- GetProduct
- ListProducts (with search/filter)
- UpdateInventory
- ReserveInventory (from Order domain)
- ReleaseInventory (if order cancelled)

## Implementation Steps

1. **Create domain layer** with Product entity, variants, and value objects
2. **Enforce business rules** in entities (SKU uniqueness, inventory constraints)
3. **Define ports** for repository and inventory
4. **Implement use cases** for product operations
5. **Create repository adapter** (in-memory → PostgreSQL)
6. **Implement HTTP controller** with CRUD endpoints
7. **Create NestJS module**
8. **Register in app.module.ts**
9. **Write comprehensive tests**

## Domain-Specific Patterns

### Inventory Management
```typescript
// Domain logic - prevent over-selling
class Product extends BaseEntity {
  public reserveInventory(quantity: number): void {
    if (this.inventory.availableQuantity < quantity) {
      throw new BusinessRuleException('Insufficient inventory');
    }
    this.inventory.reserve(quantity);
  }

  public releaseReservation(quantity: number): void {
    this.inventory.release(quantity);
  }
}
```

### Product Search
Implement a search port for advanced queries:
```typescript
export interface IProductSearch {
  search(query: SearchQuery): Promise<PaginatedResult<Product>>;
}

// Adapters could implement with:
// - Database LIKE queries
// - Elasticsearch
// - Typesense
// - Meilisearch
```

### Pricing Strategy (Optional)
```typescript
export interface IPricingService {
  calculatePrice(product: Product, context: PricingContext): Money;
}

// Support discounts, bulk pricing, seasonal pricing, etc.
```

## Example Endpoints

```
POST   /api/v1/products              # Create product
GET    /api/v1/products/:id          # Get product details
GET    /api/v1/products              # List/search products (with filters)
PUT    /api/v1/products/:id          # Update product
DELETE /api/v1/products/:id          # Delete/archive product
PATCH  /api/v1/products/:id/inventory # Update inventory
```

## Event Integration

Publish events:
```typescript
// After product creation
this.eventBus.publish(new ProductCreatedEvent(product.id, product.name));

// After inventory update
this.eventBus.publish(new InventoryUpdatedEvent(product.id, newQuantity));

// After inventory low
if (inventory.isLowStock()) {
  this.eventBus.publish(new LowStockWarningEvent(product.id));
}
```

Listen to events:
```typescript
// Listen to OrderConfirmedEvent
// → Reserve inventory for each item

// Listen to OrderCancelledEvent
// → Release reserved inventory
```

## References
- See `user/` for complete implementation example
- See `payment/DOMAIN_TEMPLATE.md` for detailed implementation guide
