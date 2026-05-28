import { Hono } from 'hono';
import { MLController } from '../controllers/ml/controller';
import { adaptController } from '../honoAdapter';
import { AppEnv } from '../../types/appenv';
import { AuthConfig, setAuthLevel } from '../../middleware/auth/routeAuth';

export function setupMLRoutes(app: Hono<AppEnv>): void {
const mlRouter = new Hono<AppEnv>();

// Public endpoints
mlRouter.get('/capabilities', setAuthLevel(AuthConfig.public), adaptController(MLController, MLController.getCapabilities));
mlRouter.get('/templates', setAuthLevel(AuthConfig.public), adaptController(MLController, MLController.listTemplates));

// Dataset endpoints
mlRouter.get('/datasets', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listDatasets));
mlRouter.post('/datasets', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createDataset));

// Experiment endpoints
mlRouter.get('/experiments', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listExperiments));
mlRouter.post('/experiments', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createExperiment));

// Run endpoints
mlRouter.get('/runs', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listRuns));
mlRouter.post('/runs', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createRun));

// Model endpoints
mlRouter.get('/models', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listModels));
mlRouter.post('/models', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createModel));

// Evaluation endpoints
mlRouter.get('/evaluations', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listEvaluations));
mlRouter.post('/evaluations', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createEvaluation));

// Training job endpoints
mlRouter.get('/jobs', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listTrainingJobs));
mlRouter.post('/jobs', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createTrainingJob));

// Serving deployment endpoints
mlRouter.get('/serving', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listServingDeployments));
mlRouter.post('/serving', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createServingDeployment));

// AutoML study endpoints
mlRouter.get('/automl', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listAutomlStudies));
mlRouter.post('/automl', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createAutomlStudy));

// Archon agent endpoints
mlRouter.get('/agents', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listArchonAgents));
mlRouter.post('/agents', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createArchonAgent));

// Cognitive memory endpoints
mlRouter.get('/memory', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listCognitiveMemoryLinks));
mlRouter.post('/memory', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createCognitiveMemoryLink));

// Autonomy report endpoints
mlRouter.get('/autonomy', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.listAutonomyReports));
mlRouter.post('/autonomy', setAuthLevel(AuthConfig.authenticated), adaptController(MLController, MLController.createAutonomyReport));

app.route('/api/ml', mlRouter);
}
