/**
 * Proteção contra modificações de propriedades de URL
 * Isso previne o erro "Cannot assign to property 'protocol' which has only a getter"
 * que ocorre quando bibliotecas tentam modificar propriedades somente leitura de URL
 */

if (typeof URL !== 'undefined' && URL.prototype) {
  try {
    // Lista de propriedades que devem ser somente leitura
    const readonlyProperties = ['protocol', 'host', 'hostname', 'port', 'pathname', 'search', 'hash', 'origin'];
    
    readonlyProperties.forEach(prop => {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(URL.prototype, prop);
        if (descriptor && descriptor.set) {
          // Remover setter para tornar a propriedade somente leitura
          Object.defineProperty(URL.prototype, prop, {
            get: descriptor.get,
            enumerable: descriptor.enumerable !== false,
            configurable: true
          });
        }
      } catch (e) {
        // Ignorar erros individuais
      }
    });
  } catch (e) {
    // Ignorar erros durante a proteção
  }
}

