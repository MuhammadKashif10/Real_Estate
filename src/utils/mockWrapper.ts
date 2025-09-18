// Single source of truth for mock configuration
export const USE_MOCKS = false;

// Database-only wrapper functions
export async function withDatabaseOnly<T>(apiCall: () => Promise<T>): Promise<T> {
  console.log('🔄 Making database-only API call');
  try {
    const result = await apiCall();
    console.log('✅ Database API call successful');
    return result;
  } catch (error) {
    console.error('❌ Database API call failed:', error);
    throw error;
  }
}

export function withDatabaseOnlySync<T>(apiCall: () => T): T {
  console.log('🔄 Making synchronous database-only call');
  try {
    const result = apiCall();
    console.log('✅ Synchronous database call successful');
    return result;
  } catch (error) {
    console.error('❌ Synchronous database call failed:', error);
    throw error;
  }
}