import Redis from 'ioredis';
import { IEventPublisher } from '../../domain/services/IEventPublisher';
import { EventEnvelope } from '../../domain/events/EventEnvelope';

/**
 * Implementación concreta de IEventPublisher sobre Redis Streams.
 * Nombrado por dominio ('payments.events'), no por tecnología, para que
 * la futura migración a RabbitMQ no obligue a renombrar nada aguas arriba 
 */
export class RedisStreamsPublisher implements IEventPublisher {
  private readonly redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async publish(streamName: string, event: EventEnvelope): Promise<void> {
    //"*" -> Genera tú automáticamente un ID único para este mensaje basado en la estampa de tiempo actual del servidor
    await this.redis.xadd(streamName, '*', 'event', JSON.stringify(event));
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
