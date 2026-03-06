/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import SearchController from '#controllers/search_controller'
import VariantsController from '#controllers/variants_controller'

// Rutas del buscador
router.group(() => {
  // Búsqueda
  router.get('/search', [SearchController, 'search'])
  router.get('/search2', [SearchController, 'search2'])
  
  // Gestión de colecciones
  router.post('/collections', [SearchController, 'createCollection'])
  
  // Gestión de documentos
  router.post('/collections/:collection/documents', [SearchController, 'indexDocument'])
  router.patch('/collections/:collection/documents/:id', [SearchController, 'updateDocument'])
  router.delete('/collections/:collection/documents/:id', [SearchController, 'deleteDocument'])
}).prefix('/api/search')

  // Gestión de documentos
  router.get('/api/generate-json', [VariantsController, 'generateJson'])

