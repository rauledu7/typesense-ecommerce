import { BaseCommand } from '@adonisjs/core/ace'
import TypesenseService from '#services/typesense_service'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export default class ImportFromApi extends BaseCommand {
  static commandName = 'import:from-api'
  static description = 'Importa datos desde archivos locales de varias marcas a Typesense, creando una colección por marca.'

  async run() {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    
    const marcas = {
     //1:      { file: 'ufchile.json',   collection: 'products_ufchile' },
      1443267:{ file: 'afchile.json',   collection: 'products_afchile' },
      1457601:{ file: 'tfchile.json',   collection: 'products_tfchile' },
      // 1501686:{ file: 'archile.json',   collection: 'products_archile' },
      // 1461778:{ file: 'tschile.json',   collection: 'products_tschile' },
      // 1573014:{ file: 'sfchile.json',   collection: 'products_sfchile' },
      // 1598942:{ file: 'ucchile.json',   collection: 'products_ucchile' },
      // 1420393:{ file: 'fcchile.json',   collection: 'products_fcchile' },
    }

    for (const [id, { file, collection }] of Object.entries(marcas)) {
      try {
        console.log(`\nProcesando marca ${id}: archivo ${file}, colección ${collection}`)
        const typesenseService = TypesenseService.getInstance()

        // Intentar leer datos del archivo local desde build/, si no existe, desde la raíz
        const filePathBuild = path.join(__dirname, '../', file)
        const filePathRoot = path.join(process.cwd(), file)
        let data: string
        try {
          data = await fs.readFile(filePathBuild, 'utf-8')
          console.log(`Leyendo datos de ${filePathBuild}...`)
        } catch (err) {
          console.log(`No se encontró en build, intentando en la raíz: ${filePathRoot}`)
          data = await fs.readFile(filePathRoot, 'utf-8')
          console.log(`Leyendo datos de ${filePathRoot}...`)
        }
        let productos: any[] = []
        try {
          productos = JSON.parse(data)
          productos = productos.map((product: any) => ({
            id: String(product.id),
            title: String(product.title || ''),
            description: String(product.description || ''),
            sku: String(product.sku || ''),
            normal_price: typeof product.normalPrice === 'number' ? product.normalPrice : 0,
            sort_order: typeof product.sortOrder === 'number' ? product.sortOrder : 0,
            discount_price: typeof product.discountPrice === 'number' ? product.discountPrice : 0,
            keywords: String(product.keywords || ''),
            filters: Array.isArray(product.filters) ? product.filters : []
          }))
          console.log(`Obtenidos ${productos.length} productos del archivo local`)
        } catch (fileError: any) {
          console.error(`Error al parsear el archivo ${file}:`)
          throw fileError
        }

        // Crear la colección si no existe
        if (productos.length === 0) {
          console.error('No se encontraron productos para importar.')
          continue
        }
        const schema = {
          name: collection,
          fields: [
            { name: 'id', type: 'string' },
            { name: 'title', type: 'string', stem: true },
            { name: 'description', type: 'string', stem: true },
            { name: 'sku', type: 'string' },
            { name: 'normal_price', type: 'float' },
            { name: 'sort_order', type: 'int32' },
            { name: 'discount_price', type: 'float' },
            { name: 'keywords', type: 'string' },
            { name: 'filters', type: 'int32[]', facet: true }
          ],
          default_sorting_field: 'discount_price'
        }
        try {
          await typesenseService.createCollection(schema)
          console.log('Colección creada')
        } catch (error: any) {
          if (error.httpStatus === 409) {
            console.log('La colección ya existe, continuando con la importación...')
          } else {
            throw error
          }
        }

        // Importar los datos (siempre, aunque la colección ya exista)
        console.log('Importando documentos a Typesense...')
        try {
          const batchSize = 100
          const batches = []
          for (let i = 0; i < productos.length; i += batchSize) {
            batches.push(productos.slice(i, i + batchSize))
          }

          let totalImported = 0
          for (const [index, batch] of batches.entries()) {
            console.log(`Procesando lote ${index + 1} de ${batches.length}...`)
            try {
              const result = await typesenseService.indexDocuments(collection, batch, { action: 'upsert' })
              totalImported += result.length
              console.log(`Lote ${index + 1} procesado: ${result.length} documentos`)
            } catch (importError: any) {
              console.error(`Error al indexar documentos en el lote ${index + 1}:`)
              if (importError.importResults) {
                importError.importResults.forEach((result: any, idx: number) => {
                  if (!result.success) {
                    console.error(`Documento ${idx + 1}:`, result.error)
                  }
                })
              }
              throw importError
            }
          }

          console.log(`Importación completada: ${totalImported} documentos procesados en ${collection}`)
        } catch (importError: any) {
          console.error('Error durante la importación:')
          throw importError
        }
      } catch (error: any) {
        console.error(`Error al importar datos para la marca ${id}:`)
        console.error('Mensaje:', error.message)
        console.error('Stack:', error.stack)
        if (error.response) {
          console.error('Detalles del error:', error.response.data)
        }
      }
    }
  }
} 