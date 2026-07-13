import { EventEnvelope } from '../events/EventEnvelope';

/**
 * Puerto de publicación al broker de eventos. La implementación concreta
 * (Redis Streams hoy, RabbitMQ en el futuro) vive en infrastructure/messaging/.
 * Nombrar streams/colas por dominio ('payments.events'), no por tecnología,
 * para que la migración a RabbitMQ sea de bajo costo (arquitectura, sección 12).
 */
export interface IEventPublisher {
  publish(streamName: string, event: EventEnvelope): Promise<void>;
}
