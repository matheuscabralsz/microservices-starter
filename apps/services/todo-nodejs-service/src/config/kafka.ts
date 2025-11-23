import { Kafka, Producer, logLevel } from 'kafkajs';

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'todo-nodejs-service';

let producer: Producer | null = null;

export const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS,
  logLevel: logLevel.INFO,
  retry: {
    initialRetryTime: 300,
    retries: 3,
  },
});

export async function initKafkaProducer(): Promise<Producer> {
  if (producer) {
    return producer;
  }

  producer = kafka.producer({
    allowAutoTopicCreation: false,
    idempotent: true,
    maxInFlightRequests: 5,
    retry: {
      retries: 3,
      initialRetryTime: 300,
    },
  });

  await producer.connect();
  console.log('Kafka producer connected successfully');

  return producer;
}

export async function disconnectKafkaProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
    console.log('Kafka producer disconnected');
  }
}

export function getKafkaProducer(): Producer {
  if (!producer) {
    throw new Error('Kafka producer not initialized. Call initKafkaProducer first.');
  }
  return producer;
}
