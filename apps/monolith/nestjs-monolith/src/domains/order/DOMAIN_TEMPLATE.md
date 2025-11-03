# Order Domain Implementation Template

## Domain Overview

The Order domain is responsible for:
- Creating and managing orders
- Order status tracking (PENDING → CONFIRMED → SHIPPED → DELIVERED)
- Order items management
- Order cancellation and modifications

## Key Concepts

### Entities
- **Order**: Main aggregate root with order items
  - Properties: id, customerId, status, items, totalAmount, createdAt, updatedAt
  - Invariants: At least one item, customer must exist, total > 0

- **OrderItem**: Value object (or entity if complex)
  - Properties: productId, quantity, unitPrice, subtotal

### Value Objects
- **OrderStatus**: Enum-like (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
- **OrderNumber**: Auto-generated order reference (ORD-2024-001)
- **Quantity**: Validated positive integer
- **Money**: Amount and currency

### Ports
- `IOrderRepository`: Find, save, update, delete orders
- `IProductService`: Check product availability (inter-domain)
- `IPaymentService`: Verify payment status (inter-domain)

### Use Cases
- CreateOrder
- ConfirmOrder
- ShipOrder
- CancelOrder
- GetOrder
- ListOrders

## Implementation Steps

1. **Create domain layer** with Order entity and value objects
2. **Define ports** for repository and external services
3. **Implement use cases** for each operation
4. **Create repository adapter** (in-memory, then PostgreSQL)
5. **Implement HTTP controller**
6. **Create NestJS module**
7. **Register in app.module.ts**
8. **Write tests** (unit, integration, E2E)

## Example Endpoints

```
POST   /api/v1/orders              # Create order
GET    /api/v1/orders/:id          # Get order
GET    /api/v1/orders              # List orders (with pagination)
PUT    /api/v1/orders/:id/confirm  # Confirm order
PUT    /api/v1/orders/:id/ship     # Mark as shipped
PUT    /api/v1/orders/:id/cancel   # Cancel order
```

## References
- See `user/` for complete implementation example
- See `payment/DOMAIN_TEMPLATE.md` for detailed implementation guide
