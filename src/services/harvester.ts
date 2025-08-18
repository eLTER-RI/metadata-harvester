import { RepositoryType } from '../store/commonStructure';
import { log } from './serviceLogging';

export const harvestAndPost = async (repositoryType: RepositoryType) => {
  log('info', `Starting harvesting job for repository: ${repositoryType}`);
};
