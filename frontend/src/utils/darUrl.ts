/**
 * Returns the DAR URL based on the current environment.
 */
export const getDarFrontendUrl = (): string => {
  return import.meta.env.PROD ? 'https://dar.elter-ri.eu' : 'https://dar.dev.elter-ri.eu';
};

/**
 * Generates URL to view a record in DAR.
 * @param darId The DAR ID of the record.
 * @returns The full URL to the DAR record.
 */
export const getDarRecordUrl = (darId: string): string => {
  return `${getDarFrontendUrl()}/external-datasets/${darId}`;
};
