const axios = require('axios');

// Configuración de Typesense
const TYPESENSE_CONFIG = {
  host: process.env.TYPESENSE_HOST || '127.0.0.1',
  port: process.env.TYPESENSE_PORT || '8108',
  protocol: process.env.TYPESENSE_PROTOCOL || 'http',
  apiKey: process.env.TYPESENSE_API_KEY
};

async function diagnosticSearch(productTitle, collection = 'products_uf') {
  console.log('🔍 DIAGNÓSTICO DE BÚSQUEDA');
  console.log('========================');
  console.log(`Producto a buscar: "${productTitle}"`);
  console.log(`Colección: ${collection}`);
  console.log('');

  try {
    // 1. Verificar conexión a Typesense
    console.log('1. Verificando conexión a Typesense...');
    const healthResponse = await axios.get(`${TYPESENSE_CONFIG.protocol}://${TYPESENSE_CONFIG.host}:${TYPESENSE_CONFIG.port}/health`, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_CONFIG.apiKey
      }
    });
    console.log('✅ Conexión exitosa a Typesense');
    console.log('');

    // 2. Verificar que la colección existe
    console.log('2. Verificando existencia de la colección...');
    const collectionResponse = await axios.get(`${TYPESENSE_CONFIG.protocol}://${TYPESENSE_CONFIG.host}:${TYPESENSE_CONFIG.port}/collections/${collection}`, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_CONFIG.apiKey
      }
    });
    console.log('✅ Colección encontrada');
    console.log(`   Campos indexados: ${collectionResponse.data.fields.map(f => f.name).join(', ')}`);
    console.log('');

    // 3. Buscar el producto exacto
    console.log('3. Buscando producto exacto...');
    const exactSearchParams = {
      q: productTitle,
      query_by: 'title,description,sku,keywords',
      per_page: 10,
      prioritize_token_position: true,
      exhaustive_search: true
    };

    const exactSearchResponse = await axios.get(`${TYPESENSE_CONFIG.protocol}://${TYPESENSE_CONFIG.host}:${TYPESENSE_CONFIG.port}/collections/${collection}/documents/search`, {
      params: exactSearchParams,
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_CONFIG.apiKey
      }
    });

    console.log(`   Resultados encontrados: ${exactSearchResponse.data.found}`);
    if (exactSearchResponse.data.hits.length > 0) {
      console.log('   Productos encontrados:');
      exactSearchResponse.data.hits.forEach((hit, index) => {
        console.log(`   ${index + 1}. ID: ${hit.document.id}, Título: "${hit.document.title}"`);
      });
    }
    console.log('');

    // 4. Buscar con palabras individuales
    console.log('4. Buscando con palabras individuales...');
    const words = productTitle.split(' ').filter(word => word.length > 2);
    
    for (const word of words) {
      console.log(`   Buscando palabra: "${word}"`);
      const wordSearchParams = {
        q: word,
        query_by: 'title,description,sku,keywords',
        per_page: 5,
        prioritize_token_position: true
      };

      const wordSearchResponse = await axios.get(`${TYPESENSE_CONFIG.protocol}://${TYPESENSE_CONFIG.host}:${TYPESENSE_CONFIG.port}/collections/${collection}/documents/search`, {
        params: wordSearchParams,
        headers: {
          'X-TYPESENSE-API-KEY': TYPESENSE_CONFIG.apiKey
        }
      });

      console.log(`     Resultados: ${wordSearchResponse.data.found}`);
      if (wordSearchResponse.data.hits.length > 0) {
        console.log(`     Ejemplos: ${wordSearchResponse.data.hits.slice(0, 3).map(hit => `"${hit.document.title}"`).join(', ')}`);
      }
    }
    console.log('');

    // 5. Verificar si el producto existe por ID (si tienes el ID)
    console.log('5. Verificar productos similares...');
    const similarSearchParams = {
      q: productTitle.substring(0, Math.min(10, productTitle.length)),
      query_by: 'title,description,sku,keywords',
      per_page: 20,
      prioritize_token_position: true
    };

    const similarSearchResponse = await axios.get(`${TYPESENSE_CONFIG.protocol}://${TYPESENSE_CONFIG.host}:${TYPESENSE_CONFIG.port}/collections/${collection}/documents/search`, {
      params: similarSearchParams,
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_CONFIG.apiKey
      }
    });

    console.log(`   Productos similares encontrados: ${similarSearchResponse.data.found}`);
    if (similarSearchResponse.data.hits.length > 0) {
      console.log('   Primeros 5 resultados:');
      similarSearchResponse.data.hits.slice(0, 5).forEach((hit, index) => {
        console.log(`   ${index + 1}. "${hit.document.title}" (ID: ${hit.document.id})`);
      });
    }
    console.log('');

    // 6. Verificar estadísticas de la colección
    console.log('6. Estadísticas de la colección...');
    const statsResponse = await axios.get(`${TYPESENSE_CONFIG.protocol}://${TYPESENSE_CONFIG.host}:${TYPESENSE_CONFIG.port}/collections/${collection}`, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_CONFIG.apiKey
      }
    });
    
    console.log(`   Total de documentos: ${statsResponse.data.num_documents}`);
    console.log(`   Documentos activos: ${statsResponse.data.num_documents_active}`);
    console.log('');

    // 7. Recomendaciones
    console.log('7. RECOMENDACIONES:');
    if (exactSearchResponse.data.found === 0) {
      console.log('❌ El producto no se encontró con búsqueda exacta');
      console.log('   Posibles causas:');
      console.log('   - El producto no está indexado en Typesense');
      console.log('   - El título en el JSON no coincide exactamente');
      console.log('   - Problemas de codificación de caracteres');
      console.log('   - El producto fue eliminado o no se importó correctamente');
      console.log('');
      console.log('   Acciones sugeridas:');
      console.log('   1. Verificar que el producto existe en el archivo JSON original');
      console.log('   2. Revisar si el producto se importó correctamente');
      console.log('   3. Verificar la codificación del texto (acentos, caracteres especiales)');
      console.log('   4. Intentar buscar con palabras parciales del título');
    } else {
      console.log('✅ El producto se encontró en la búsqueda');
    }

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
  }
}

// Ejemplo de uso
if (require.main === module) {
  const productTitle = process.argv[2];
  const collection = process.argv[3] || 'products_uf';
  
  if (!productTitle) {
    console.log('Uso: node diagnostic_search.js "Título del producto" [colección]');
    console.log('Ejemplo: node diagnostic_search.js "Silla Plegable Camping" products_uf');
    process.exit(1);
  }
  
  diagnosticSearch(productTitle, collection);
}

module.exports = { diagnosticSearch }; 