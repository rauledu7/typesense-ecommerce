import Typesense from 'typesense'
import { TypesenseConfig, SearchParameters, SearchResponse } from '../types/typesense.js'
import { config } from 'dotenv'

// Cargar variables de entorno
config()

export default class TypesenseService {
  private static instance: TypesenseService
  private client: Typesense.Client

  private constructor() {
    const apiKey = process.env.TYPESENSE_API_KEY
    console.log('API Key length:', apiKey ? apiKey.length : 0)
    
    const config = {
      host: process.env.TYPESENSE_HOST || '127.0.0.1',
      port: parseInt(process.env.TYPESENSE_PORT || '8108'),
      protocol: process.env.TYPESENSE_PROTOCOL || 'http',
      apiKey: apiKey
    }

    console.log('Inicializando TypesenseService con configuración:', {
      ...config,
      apiKey: config.apiKey ? '***' : 'no definida'
    })

    if (!config.apiKey) {
      console.error('Variables de entorno disponibles:', {
        TYPESENSE_HOST: process.env.TYPESENSE_HOST,
        TYPESENSE_PORT: process.env.TYPESENSE_PORT,
        TYPESENSE_PROTOCOL: process.env.TYPESENSE_PROTOCOL,
        TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY ? '***' : 'no definida'
      })
      throw new Error('TYPESENSE_API_KEY no está definida en las variables de entorno')
    }

    this.client = new Typesense.Client({
      nodes: [
        {
          host: config.host,
          port: config.port,
          protocol: config.protocol
        }
      ],
      apiKey: config.apiKey,
      connectionTimeoutSeconds: 5
    })
    console.log('Cliente Typesense inicializado')
  }

  public static getInstance(): TypesenseService {
    if (!TypesenseService.instance) {
      TypesenseService.instance = new TypesenseService()
    }
    return TypesenseService.instance
  }

  async createCollection(schema: any) {
    try {
      console.log('Intentando crear colección con schema:', JSON.stringify(schema, null, 2))
      console.log('Usando API key:', process.env.TYPESENSE_API_KEY ? '***' : 'no definida')
      
      // Verificar la conexión primero
      try {
        console.log('Verificando salud de Typesense...')
        const health = await this.client.health.retrieve()
        console.log('Conexión a Typesense exitosa:', health)
      } catch (error: any) {
        console.error('Error al verificar la salud de Typesense:', error.message)
        if (error.response) {
          console.error('Detalles del error:', error.response.data)
        }
        throw error
      }

      console.log('Creando colección...')
      const result = await this.client.collections().create(schema)
      console.log('Colección creada exitosamente:', result)
      return result
    } catch (error: any) {
      console.error('Error al crear colección:', error.message)
      if (error.response) {
        console.error('Detalles del error:', error.response.data)
      }
      throw error
    }
  }

  async search(collectionName: string, searchParameters: SearchParameters) {
    try {
      return await this.client
        .collections(collectionName)
        .documents()
        .search(searchParameters)
    } catch (error: any) {
      console.error('Error en búsqueda:', error.message)
      throw error
    }
  }

  async indexDocument(collectionName: string, document: object) {
    try {
      return await this.client
        .collections(collectionName)
        .documents()
        .create(document)
    } catch (error) {
      throw error
    }
  }

  async indexDocuments(collectionName: string, documents: object[], options: { action?: 'create' | 'update' | 'upsert' } = {}) {
    try {
      return await this.client
        .collections(collectionName)
        .documents()
        .import(documents, { action: options.action || 'create' })
    } catch (error: any) {
      console.error('Error al indexar documentos:', error.message)
      throw error
    }
  }

  async deleteDocument(collectionName: string, documentId: string) {
    try {
      return await this.client
        .collections(collectionName)
        .documents(documentId)
        .delete()
    } catch (error) {
      throw error
    }
  }

  async getCollection(collectionName: string) {
    try {
      return await this.client.collections(collectionName).retrieve()
    } catch (error: any) {
      console.error(`Error al obtener colección ${collectionName}:`, error.message)
      throw error
    }
  }

  async deleteCollection(collectionName: string) {
    try {
      return await this.client.collections(collectionName).delete()
    } catch (error: any) {
      console.error(`Error al eliminar colección ${collectionName}:`, error.message)
      throw error
    }
  }

  async updateDocument(collectionName: string, documentId: string, document: object) {
    try {
      return await this.client
        .collections(collectionName)
        .documents(documentId)
        .update(document)
    } catch (error) {
      throw error
    }
  }
} 