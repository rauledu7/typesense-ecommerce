import { defineConfig } from '@adonisjs/core/ace'
import ImportFromApi from '../commands/import_from_api.js'

export default defineConfig({
  commands: [
    ImportFromApi
  ]
}) 