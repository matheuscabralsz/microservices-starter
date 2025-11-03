# Payment Domain Implementation Template

This file documents the structure and patterns for implementing the Payment domain.

## Domain Overview

The Payment domain is responsible for:
- Processing payments
- Managing payment methods
- Handling refunds
- Payment status tracking

## Step-by-Step Implementation Guide

### 1. Define Domain Entities

Create `domain/entities/payment.entity.ts`:

```typescript
import { BaseEntity } from '../../../../shared/kernel/entities/base.entity';
import { Money } from '../value-objects/money.value-object';
import { BusinessRuleException } from '../../../../shared/kernel/exceptions/domain.exception';

export class Payment extends BaseEntity<string> {
  public static create(
    id: string,
    orderId: string,
    amount: Money,
    paymentMethod: string
  ): Payment {
    // Business rule validation
    if (!orderId || orderId.trim().length === 0) {
      throw new BusinessRuleException('Order ID is required');
    }

    return new Payment(id, orderId, amount, paymentMethod, 'PENDING');
  }

  // ... implementation following User entity pattern
}
```

### 2. Create Value Objects

Create `domain/value-objects/money.value-object.ts`:

```typescript
import { BaseValueObject } from '../../../../shared/kernel/value-objects/base.value-object';

export class Money extends BaseValueObject<{ amount: number; currency: string }> {
  protected validate(value: { amount: number; currency: string }): void {
    if (value.amount <= 0) {
      throw new Error('Amount must be positive');
    }
    // ... more validation
  }

  public equals(other: Money): boolean {
    return this._value.amount === other._value.amount &&
           this._value.currency === other._value.currency;
  }

  public toString(): string {
    return `${this._value.amount} ${this._value.currency}`;
  }
}
```

### 3. Define Repository Port

Create `ports/repositories/payment.repository.port.ts`:

```typescript
import { Payment } from '../../domain/entities/payment.entity';
import { PaginatedResult } from '../../../../shared/kernel/interfaces/result.interface';

export interface IPaymentRepository {
  save(payment: Payment): Promise<void>;
  update(payment: Payment): Promise<void>;
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment[]>;
  findByStatus(status: string, page: number, pageSize: number): Promise<PaginatedResult<Payment>>;
}

export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY';
```

### 4. Create Use Cases

Create `application/usecases/process-payment.usecase.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { IPaymentRepository } from '../../ports/repositories/payment.repository.port';
import { Result } from '../../../../shared/kernel/interfaces/result.interface';
import { Payment } from '../../domain/entities/payment.entity';
import { Money } from '../../domain/value-objects/money.value-object';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProcessPaymentUseCase {
  constructor(private paymentRepository: IPaymentRepository) {}

  async execute(input: ProcessPaymentInput): Promise<Result<ProcessPaymentOutput>> {
    try {
      // Check business rules
      // Create entity
      // Persist
      // Return result
      return Result.ok({ /* output */ });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export interface ProcessPaymentInput {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

export interface ProcessPaymentOutput {
  id: string;
  status: string;
  // ... other fields
}
```

### 5. Implement Repository Adapter

Create `adapters/repositories/in-memory-payment.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentRepository } from '../../ports/repositories/payment.repository.port';
import { PaginatedResult } from '../../../../shared/kernel/interfaces/result.interface';

@Injectable()
export class InMemoryPaymentRepository implements IPaymentRepository {
  private payments: Map<string, Payment> = new Map();
  private orderIdIndex: Map<string, string[]> = new Map(); // orderId -> paymentIds

  async save(payment: Payment): Promise<void> {
    this.payments.set(payment.id, payment);
    // Update index
  }

  async update(payment: Payment): Promise<void> {
    this.payments.set(payment.id, payment);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) || null;
  }

  // ... implement other methods
}
```

### 6. Create HTTP Controller

Create `adapters/controllers/payment.controller.ts`:

```typescript
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ProcessPaymentUseCase } from '../../application/usecases/process-payment.usecase';

@Controller('api/v1/payments')
export class PaymentController {
  constructor(private processPaymentUseCase: ProcessPaymentUseCase) {}

  @Post()
  async process(@Body() dto: ProcessPaymentRequestDto): Promise<any> {
    const result = await this.processPaymentUseCase.execute(dto);

    return result.fold(
      (error) => ({ success: false, error: { message: error.message } }),
      (output) => ({ success: true, data: output })
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<any> {
    // Similar pattern
  }
}

interface ProcessPaymentRequestDto {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}
```

### 7. Create NestJS Module

Create `payment.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PaymentController } from './adapters/controllers/payment.controller';
import { InMemoryPaymentRepository } from './adapters/repositories/in-memory-payment.repository';
import { ProcessPaymentUseCase } from './application/usecases/process-payment.usecase';
import { PAYMENT_REPOSITORY, IPaymentRepository } from './ports/repositories/payment.repository.port';

@Module({
  providers: [
    {
      provide: PAYMENT_REPOSITORY,
      useClass: InMemoryPaymentRepository
    },
    InMemoryPaymentRepository,
    {
      provide: ProcessPaymentUseCase,
      useFactory: (repository: IPaymentRepository) => new ProcessPaymentUseCase(repository),
      inject: [PAYMENT_REPOSITORY]
    }
  ],
  controllers: [PaymentController],
  exports: [ProcessPaymentUseCase, PAYMENT_REPOSITORY]
})
export class PaymentModule {}
```

### 8. Register in App Module

Update `src/app.module.ts`:

```typescript
import { PaymentModule } from './domains/payment/payment.module';

@Module({
  imports: [
    // ...
    PaymentModule
  ]
})
export class AppModule {}
```

## Domain-Specific Patterns

### Stripe Integration (Outbound Adapter)

Create `adapters/external/stripe-payment-gateway.ts`:

```typescript
export interface IPaymentGateway {
  process(payment: Payment): Promise<GatewayResponse>;
  refund(paymentId: string): Promise<GatewayResponse>;
}

@Injectable()
export class StripePaymentGateway implements IPaymentGateway {
  constructor(private stripeClient: Stripe) {}

  async process(payment: Payment): Promise<GatewayResponse> {
    // Call Stripe API
    // Handle response
    // Return domain response
  }
}
```

### Domain Events (Optional - Cross-Domain Communication)

Create `domain/events/payment-processed.event.ts`:

```typescript
export class PaymentProcessedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly timestamp: Date = new Date()
  ) {}
}
```

Then in use case:

```typescript
// After saving payment
this.eventBus.publish(new PaymentProcessedEvent(payment.id, payment.orderId, payment.amount.getValue().amount));
```

## Testing

### Unit Tests (Domain Layer)

```typescript
describe('Payment Entity', () => {
  it('should create payment with valid data', () => {
    const payment = Payment.create('id', 'order-123', new Money({ amount: 100, currency: 'USD' }), 'CARD');
    expect(payment.status).toBe('PENDING');
  });

  it('should throw on invalid amount', () => {
    expect(() => new Money({ amount: -100, currency: 'USD' })).toThrow();
  });
});
```

### Integration Tests (Application Layer)

```typescript
describe('ProcessPaymentUseCase', () => {
  it('should process payment successfully', async () => {
    const mockRepo = mock<IPaymentRepository>();
    const usecase = new ProcessPaymentUseCase(mockRepo);

    const result = await usecase.execute({
      orderId: 'order-123',
      amount: 100,
      currency: 'USD',
      paymentMethod: 'CARD'
    });

    expect(result.isSuccess).toBe(true);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

## File Checklist

Before marking domain complete:

- [ ] Domain layer implemented (entities, value objects)
- [ ] Business rules enforced in entities
- [ ] Value objects immutable and validated
- [ ] Repository ports defined (interfaces)
- [ ] Use cases implemented (at least CRUD)
- [ ] Repository adapters implemented
- [ ] HTTP controllers implemented
- [ ] NestJS module created and configured
- [ ] Registered in app.module.ts
- [ ] Unit tests written (80% coverage)
- [ ] Integration tests written
- [ ] E2E tests written
- [ ] README documentation added
- [ ] API endpoints documented

## Example Endpoints

Once implemented:

```
POST   /api/v1/payments              # Create/process payment
GET    /api/v1/payments/:id          # Get payment details
GET    /api/v1/payments?status=PAID  # List payments by status
PUT    /api/v1/payments/:id/refund   # Refund payment
```

---

**Reference**: See `user/` domain for fully implemented example.
