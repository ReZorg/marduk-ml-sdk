import { Hono } from 'hono';
import { MLController } from '../controllers/ml/controller';
import { adaptController } from '../honoAdapter';
import { AppEnv } from '../../types/appenv';
import { AuthConfig, setAuthLevel } from '../../middleware/auth/routeAuth';

export function setupMLRoutes(app: Hono<AppEnv>): void {
const mlRouter = new Hono<AppEnv>();

mlRouter.get('/capabilities', setAuthLevel(AuthConfig.public), adaptController(MLController, MLController.getCapabilities));
mlRouter.get('/templates', setAuthLevel(AuthConfig.public), adaptController(MLController, MLController.listTemplates));

mlRouter.get('/datasets', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listDatasets));
mlRouter.post('/datasets', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createDataset));

mlRouter.get('/experiments', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listExperiments));
mlRouter.post('/experiments', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createExperiment));

mlRouter.get('/runs', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listRuns));
mlRouter.post('/runs', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createRun));

app.route('/api/ml', mlRouter);
}
