/**
 * Export all services from a single location
 */

export * as contentService from './contentService';
export * as batchService from './batchService';
export * as configService from './configService';
export * as apiService from './apiService';

// Example usage in components:
// import { contentService, batchService, configService } from '../services';
// 
// contentService.fetchHtmlFiles(version);
// batchService.createNewBatch();
// configService.loadConfiguration(version);
