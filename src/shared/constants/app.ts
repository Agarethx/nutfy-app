import Constants from 'expo-constants'

export const APP_NAME = 'Nutrition AI'
export const APP_VERSION = Constants.expoConfig?.version ?? '0.1.0'
export const APP_SCHEME = 'nutrition-ai'

export const QUERY_STALE_TIME = 5 * 60 * 1000
export const QUERY_GC_TIME = 10 * 60 * 1000

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
