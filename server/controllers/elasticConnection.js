import elasticsearch from 'elasticsearch';
import config from '../../config/env';
const client = new elasticsearch.Client({
  host: config.elasticPvt,
});
async function elastic(req, res) {
  client.cluster.health({}, function (err, resp, status) {
    console.log('-- Client Health --', resp);
    res.send(resp);
  });
}
export default {
  elastic,
};
