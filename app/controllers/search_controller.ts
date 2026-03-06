import { HttpContext } from '@adonisjs/core/http'
import TypesenseService from '../services/typesense_service.js'
import axios from 'axios'

export default class SearchController {
  async search_old({ request, response }: HttpContext) {
    try {
      const query = request.input('q', '')
      const collection = request.input('collection', 'products_uf')
      const query_by = request.input('query_by', 'title^3,description,sku,keywords') // Priorizar título con peso 3
      const page = request.input('page', 1)
      const per_page = request.input('per_page', 50)
      const sort_by = request.input('sort_by', '_text_match:desc,discount_price:desc') // Priorizar coincidencia de texto

      const typesenseService = TypesenseService.getInstance()
      const searchParameters = {
        q: query,
        query_by: query_by,
        sort_by: sort_by,
        page: page,
        per_page: per_page,
        prioritize_token_position: true,
        exhaustive_search: true,
        num_typos: 1 // Permitir 1 error tipográfico
        // num_typos: num_typos,
      }

      const result = await typesenseService.search(collection, searchParameters)
      // 1. Extraer los IDs en el orden de relevancia
      const ids = result.hits.map((hit: any) => hit.document.id)
      return result.hits

      if (ids.length === 0) {
        return response.json([])
      }

      // 2. Llamar al microservicio para formatear los productos, usando la URL según el sufijo de la colección
      let baseUrl = 'https://products.bettercommerce.cl';
      if (collection.endsWith('peru')) {
        baseUrl = 'https://pe.products.bettercommerce.cl';
      } else if (collection.endsWith('colombia')) {
        baseUrl = 'https://co.products.bettercommerce.cl';
      }

      const formattedResponse = await axios.post(
        `${baseUrl}/api/variants/formatted-by-ids`,
        { ids }
      )

      let productosFormateados = formattedResponse.data

      // 3. Ordenar los productos según el orden de los IDs devueltos por Typesense y eliminar nulls
      productosFormateados = ids
        .map(id => productosFormateados.find((p: any) => String(p.id) === String(id)))
        .filter(Boolean);

      return response.json(productosFormateados)

      
    } catch (error: any) {
      return response.status(500).json({
        error: 'Error al realizar la búsqueda',
        message: error.message,
      })
    }
  }

  async search({ request, response }: HttpContext) {
    try {
      const query = request.input('q', '')
      const collection = request.input('collection', 'products_uf')
      const query_by = request.input('query_by', 'title^3,description,sku,keywords') // Priorizar título con peso 3
      const page = request.input('page', 1)
      const per_page = request.input('per_page', 50)
      const sort_by = request.input('sort_by', '_text_match:desc,discount_price:desc') // Priorizar coincidencia de texto

      const typesenseService = TypesenseService.getInstance()
      const searchParameters = {
        q: query,
        query_by: query_by,
        sort_by: '_text_match:desc,discount_price:desc',
        page: page,
        per_page: per_page,
        prioritize_token_position: true,
        exhaustive_search: true,
        num_typos: 1, // Permitir 1 error tipográfico
        facet_by: 'filters',
        max_facet_values: 1000
        // num_typos: num_typos,
      }

      const result = await typesenseService.search(collection, searchParameters)
      // 1. Extraer los IDs en el orden de relevancia
      const ids = result.hits.map((hit: any) => hit.document.id)


      if (ids.length === 0) {
        return response.json([])
      }

      // 2. Llamar al microservicio para formatear los productos, usando la URL según el sufijo de la colección
      let baseUrl = 'https://products.bettercommerce.cl';
      if (collection.endsWith('peru')) {
        baseUrl = 'https://pe.products.bettercommerce.cl';
      } else if (collection.endsWith('colombia')) {
        baseUrl = 'https://co.products.bettercommerce.cl';
      }

      const formattedResponse = await axios.post(
        `${baseUrl}/api/variants/formatted-by-ids`,
        { ids }
      )

      let productosFormateados = formattedResponse.data

      // 3. Ordenar los productos según el orden de los IDs devueltos por Typesense y eliminar nulls
      productosFormateados = ids
        .map(id => productosFormateados.find((p: any) => String(p.id) === String(id)))
        .filter(Boolean);

      // 4. Retornar los productos formateados
      return response.json({
        data: productosFormateados,
        counts: result.facet_counts?.[0]?.counts ?? []
      })
      
    } catch (error: any) {
      return response.status(500).json({
        error: 'Error al realizar la búsqueda',
        message: error.message,
      })
    }
  }

  async createCollection({ request, response }: HttpContext) {
    try {
      const schema = request.body()
      const typesenseService = TypesenseService.getInstance()
      const result = await typesenseService.createCollection(schema)
      return response.created(result)
    } catch (error: any) {
      return response.internalServerError({
        error: 'Error al crear la colección',
        details: error.message,
      })
    }
  }

  async indexDocument({ request, response }: HttpContext) {
    try {
      const { collection } = request.params()
      const document = request.body()

      if (!collection) {
        return response.badRequest({
          error: 'Falta el parámetro requerido: collection',
        })
      }

      const typesenseService = TypesenseService.getInstance()
      const result = await typesenseService.indexDocument(collection, document)
      return response.created(result)
    } catch (error: any) {
      return response.internalServerError({
        error: 'Error al indexar el documento',
        details: error.message,
      })
    }
  }

  async updateDocument({ request, response }: HttpContext) {
    try {
      const { collection, id } = request.params()
      const document = request.body()

      if (!collection || !id) {
        return response.badRequest({
          error: 'Faltan parámetros requeridos: collection e id',
        })
      }

      const typesenseService = TypesenseService.getInstance()
      const result = await typesenseService.updateDocument(collection, id, document)
      return response.ok(result)
    } catch (error: any) {
      return response.internalServerError({
        error: 'Error al actualizar el documento',
        details: error.message,
      })
    }
  }

  async deleteDocument({ request, response }: HttpContext) {
    try {
      const { collection, id } = request.params()

      if (!collection || !id) {
        return response.badRequest({
          error: 'Faltan parámetros requeridos: collection e id',
        })
      }

      const typesenseService = TypesenseService.getInstance()
      await typesenseService.deleteDocument(collection, id)
      return response.noContent()
    } catch (error: any) {
      return response.internalServerError({
        error: 'Error al eliminar el documento',
        details: error.message,
      })
    }
  }
} 