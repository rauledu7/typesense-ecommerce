import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import type { HttpContext } from '@adonisjs/core/http'

export default class VariantsController {
  public async generateJson({ request, response }: HttpContext) {
    const channel = request.input('channel')
    const filename = request.input('filename') || `variants_${channel}.json`
    if (!channel) {
      return response.badRequest({ error: 'Falta el parámetro channel' })
    }

    const country = request.input('country', 'cl').toLowerCase();
    const baseUrl =
      country === 'co'
        ? 'https://co.products.bettercommerce.cl'
        : country === 'pe'
          ? 'https://pe.products.bettercommerce.cl'
          : 'https://products.bettercommerce.cl';
    const url = `${baseUrl}/api/variants?channel=${channel}&page=1&limit=2000&country=${country}`;
    try {
      const apiResponse = await axios.get(url)
      const data = apiResponse.data?.data || []

      const filePath = path.join(process.cwd(), filename);

      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
      return response.ok({ message: `Archivo ${filename} generado correctamente`, count: data.length, path: filePath })
    } catch (error: any) {
      return response.status(500).json({ error: 'Error al generar el archivo', message: error.message })
    }
  }
} 