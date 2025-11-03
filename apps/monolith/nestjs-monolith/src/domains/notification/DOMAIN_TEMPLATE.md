# Notification Domain Implementation Template

## Domain Overview

The Notification domain is responsible for:
- Sending notifications (email, SMS, push)
- Managing notification templates
- Notification delivery tracking
- Retry logic for failed deliveries

## Key Concepts

### Entities
- **Notification**: Aggregate root
  - Properties: id, recipientId, type, status, deliveryAttempts, lastAttemptAt
  - Invariants: Type must be valid, recipient must exist

- **NotificationTemplate**: Template configuration
  - Properties: id, name, type, subject, body, variables

### Value Objects
- **NotificationType**: ENUM (EMAIL, SMS, PUSH_NOTIFICATION)
- **DeliveryStatus**: ENUM (PENDING, SENT, FAILED, DELIVERED)
- **EmailAddress**: Validated email value object
- **PhoneNumber**: Validated phone number value object

### Ports
- `INotificationRepository`: Store and retrieve notifications
- `IEmailSender`: Interface for email delivery (SMTP adapter)
- `ISmsSender`: Interface for SMS delivery (Twilio adapter)
- `IPushNotificationSender`: Interface for push notifications (FCM adapter)

### Use Cases
- SendEmailNotification
- SendSmsNotification
- SendPushNotification
- GetNotificationStatus
- RetryFailedNotifications

## Implementation Steps

1. **Create domain layer** with Notification entity and value objects
2. **Define ports** for senders and repository
3. **Implement use cases** for sending and tracking
4. **Create adapters** for email (SMTP), SMS (Twilio), push (FCM)
5. **Implement repository**
6. **Create HTTP controller** (for notification status queries)
7. **Create event listeners** (listen to order/payment events and send notifications)
8. **Create NestJS module**
9. **Register in app.module.ts**
10. **Write tests**

## Example Architecture

```
Domain Layer
├── Notification Entity
├── NotificationTemplate
├── NotificationType
├── DeliveryStatus
└── Business Rules (max retries, retry backoff, etc)

Ports
├── INotificationRepository
├── IEmailSender
├── ISmsSender
└── IPushNotificationSender

Adapters
├── Controllers (query notification status)
├── Repository (in-memory → MongoDB)
└── External Services
    ├── SMTP (SendGrid/Mailgun)
    ├── Twilio (SMS)
    └── Firebase (Push)
```

## Example Endpoints

```
POST   /api/v1/notifications/email          # Send email
POST   /api/v1/notifications/sms            # Send SMS
POST   /api/v1/notifications/push           # Send push notification
GET    /api/v1/notifications/:id            # Get notification status
GET    /api/v1/notifications               # List notifications
```

## Event-Driven Pattern

Listen to domain events from other domains:

```typescript
// Listen to PaymentProcessedEvent (from Payment domain)
// → Send "Payment Confirmed" notification

// Listen to OrderCreatedEvent (from Order domain)
// → Send "Order Confirmation" notification

// Listen to OrderShippedEvent (from Order domain)
// → Send "Your order is on the way" notification
```

## References
- See `user/` for complete implementation example
- See `payment/DOMAIN_TEMPLATE.md` for detailed implementation guide
