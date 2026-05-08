// tests/setup.test.ts
describe('Configuración del sistema de tests', () => {
  test('Jest está funcionando correctamente', () => {
    expect(true).toBe(true);
  });

  test('Puedo hacer operaciones matemáticas', () => {
    expect(1 + 2).toBe(3);
  });

  test('Puedo trabajar con strings', () => {
    const mensaje = 'Hola Mundo';
    expect(mensaje).toContain('Mundo');
  });
});