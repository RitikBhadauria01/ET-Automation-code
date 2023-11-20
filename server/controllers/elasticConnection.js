import elasticsearch from 'elasticsearch';
import config from '../../config/env';
console.log("anshu+v2",config);
const client = new elasticsearch.Client({
  host: "http://10.234.240.62:9200/",
});
console.log("v2",client);
async function elastic(req, res) {
  client.cluster.health({}, function (err, resp, status) {
    console.log('-- Client Health --', resp);
    res.send(resp);
  });
}
export default {
  elastic,
};
