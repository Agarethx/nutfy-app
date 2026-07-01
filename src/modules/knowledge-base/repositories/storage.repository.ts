import { BaseRepository, mapResponse, wrapError, ok, err } from '@/shared/networking'
import type { Result } from '@/shared/networking'
import { mapStorageMethod, mapUnit } from '../mappers/ingredient.mapper'
import type { StorageMethod, Unit, UnitConversion } from '../domain/shared.types'

export class StorageRepository extends BaseRepository {
  async listStorageMethods(): Promise<Result<StorageMethod[]>> {
    try {
      const response = await this.db
        .from('storage_methods')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name')
      const rows = mapResponse(response)
      return ok(rows.map(mapStorageMethod))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async listUnits(): Promise<Result<Unit[]>> {
    try {
      const response = await this.db
        .from('units')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name')
      const rows = mapResponse(response)
      return ok(rows.map(mapUnit))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async listUnitConversions(): Promise<Result<UnitConversion[]>> {
    try {
      const response = await this.db.from('unit_conversions').select('*')
      const rows = mapResponse(response)
      return ok(
        rows.map((r) => ({
          id: r.id,
          from_unit: r.from_unit,
          to_unit: r.to_unit,
          factor: r.factor,
        })),
      )
    } catch (e) {
      return err(wrapError(e))
    }
  }
}
