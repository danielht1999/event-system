import client from '@shared/infrastructure/cache/redis.client';

export class CacheService {
  // TTL por defecto: 1 hora (en segundos)
  private readonly DEFAULT_TTL = 3600;

  /**
   * Obtiene un valor de la caché y lo parsea automáticamente al tipo de dato esperado.
   * @param key Llave única de la caché
   * @returns El objeto parseado de tipo T, o null si no existe/falla
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await client.get(key);
      if (!value) return null;

      // Intentar parsear el string a su tipo original (objeto, array, numero, etc.)
      return JSON.parse(value) as T;
    } catch (error) {
      // Logeamos el error, pero no bloqueamos la app (Fail-safe)
      console.error(`[CacheService] Error al obtener la llave "${key}":`, error);
      return null; 
    }
  }

  /**
   * Guarda cualquier tipo de dato en la caché serializándolo a string.
   * @param key Llave única
   * @param value Dato a guardar (objeto, array, string, number, etc.)
   * @param ttlInSeconds Tiempo de vida en segundos (opcional)
   */
  async set(key: string, value: unknown, ttlInSeconds?: number): Promise<boolean> {
    try {
      const stringValue = JSON.stringify(value);
      const ttl = ttlInSeconds ?? this.DEFAULT_TTL;

      // Usamos la opción 'EX' de la librería redis v4 para asignar el TTL directamente
      await client.set(key, stringValue, { EX: ttl });
      return true;
    } catch (error) {
      console.error(`[CacheService] Error al guardar la llave "${key}":`, error);
      return false;
    }
  }

  /**
   * Elimina una o varias llaves de la caché (invalida la caché)
   * @param key Llave o patrón a eliminar
   */
  async delete(key: string): Promise<void> {
    try {
      await client.del(key);
    } catch (error) {
      console.error(`[CacheService] Error al eliminar la llave "${key}":`, error);
    }
  }

  /**
   * Limpia toda la base de datos de caché actual (Usar con precaución)
   */
  async flush(): Promise<void> {
    try {
      await client.flushDb();
    } catch (error) {
      console.error('[CacheService] Error al vaciar la base de datos de caché:', error);
    }
  }
}

// Exportamos una instancia única (Singleton) para toda la aplicación
export const cacheService = new CacheService();