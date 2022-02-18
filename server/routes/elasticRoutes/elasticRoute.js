import express from 'express';
const router = express.Router();
import {
  elasticPing,
  elasticIndexing,
  elasticSearch,
  searchBasedOnQuery,
  searchQuery,
  searchAny,
  botSearchSuggestions,
  indexingViaDrupal,
  drupalIndexSearch,
  deleteAllIndices,
  globalSearch,
  getFromIndexUsingId,
  getFramework
} from '../../controllers/elasticSearch';
import { authenticateWebUser } from '../../helpers/msal';

router.post('/indexingViaDrupal', indexingViaDrupal);
router.get('/drupalSearch', drupalIndexSearch);
router.get('/getUsingElasticId', getFromIndexUsingId);

router.get('/getFramwwork', getFramework);

router.use(authenticateWebUser);
router.get('/globalSearch', globalSearch);
//router.get('/deleteAllIndices', deleteAllIndices);
router.get('/ping', elasticPing);
router.get('/index', elasticIndexing);
router.get('/search', elasticSearch);
router.get('/searchQuery', searchBasedOnQuery);
router.get('/searchWildcard', searchQuery);
router.get('/searchAny', searchAny);
router.get('/botSearchSuggestions', botSearchSuggestions);


export default router;
