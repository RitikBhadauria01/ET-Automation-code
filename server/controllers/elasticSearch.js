import ElasticClient from '../helpers/elasticConnection';
import ResponseObject from '../helpers/responseObjectClass';
import catchAsync from '../helpers/catchAsync';
import ElasticError from '../helpers/AppError';
import BotUser from '../models/BotUser';

const getFramework = catchAsync(async (req, res, next) => {
  let responseElastic = await ElasticClient.get({
    index: 'framework',
    type: '_doc',
    size: 100,
    body: {
      query: {
        match_all: {},
      },
      sort: [{ frameworkId: { order: 'desc' } }],
    },
  });
  console.log('response Elastic  ----- framework ', responseElastic);
  res.send(new ResponseObject(200, 'framework founds', true, responseElastic));
});

const elasticSearch = catchAsync(async (req, res, next) => {
  let botIndex = Number(req.query.botIndex);
  let count = await ElasticClient.count({
    index: 'botindex',
    type: '_doc',
  });
  let searchRsponse = await ElasticClient.search({
    from: botIndex != 0 ? botIndex * 10 : 0,
    size: 10,
    index: 'botindex',
    type: '_doc',
    body: {
      query: {
        match_all: {},
      },
      sort: [{ botID: { order: 'desc' } }],
    },
  });
  res.send(
    new ResponseObject(200, 'Search', true, {
      allBots: searchRsponse.hits.hits,
      totalIndex: count.count,
    })
  );
});

const searchBasedOnQuery = catchAsync(async (req, res, next) => {
  let { botIndex } = req.query;
  // searach based on one query
  let query = req.query;
  if (botIndex == undefined) {
    botIndex = 0;
  }
  console.log('bot index');

  console.log('req query  --', query);
  let array = [];
  let search = {};
  for (const prop in query) {
    if (prop == 'search') {
      // search = { q: query[prop] };
      let obj = {
        query_string: {
          query: query[prop],
        },
      };
      array.push(obj);
    } else if (prop == 'botIndex') {
      botIndex = Number(req.query.botIndex);
    } else {
      let obj = {
        match: {
          [prop]: query[prop],
        },
      };
      array.push(obj);
    }
  }

  // console.log('Filter --', filter);
  //console.log(array, 'arrray');
  let totalBots = await ElasticClient.count({
    index: 'botindex',
    type: '_doc',
    body: {
      query: {
        bool: {
          must: array,
        },
      },
    },
  });
  console.log(totalBots.count);
  let count = 0;

  let searchResult = '';

  console.log('if no keyword  ', req.query);

  let elasticWithoutKeyWordSearch = await ElasticClient.search({
    index: 'botindex',
    from: botIndex != 0 ? botIndex * 10 : 0,
    size: 10,
    type: '_doc',
    body: {
      query: {
        bool: {
          must: array,
        },
      },
      sort: [{ botID: { order: 'desc' } }],
    },
  });
  console.log('easltic result');
  // console.log('without keyword', elasticWithoutKeyWordSearch);
  searchResult = elasticWithoutKeyWordSearch.hits.hits;
  // if (searchResult.length >0) {
  //   console.log('search reslut of elastic ------', searchResult[0]._id);
  // searchResult = searchResult.sort((a, b) => parseInt(b._id) - parseInt(a._id));
  // console.log('search reslut of elastic ------', searchResult);
  // }
  // slice result on basis of bot index
  // searchResult = searchResult.slice(botIndex * 10, botIndex * 10 + 10);
  count = elasticWithoutKeyWordSearch.hits.hits.length;
  console.log('Count', count);

  console.log({ totalIndex: totalBots.count });
  res.send(
    new ResponseObject(200, 'found', true, {
      allBots: searchResult,
      totalIndex: totalBots.count,
    })
  );
});

const elasticIndexing = async (req) => {
  console.log('indexing');
  // index name cannot be camel cased ?
  // console.log('req body  ----', req);
  let indexingResposne = await ElasticClient.index({
    index: 'botindex',
    id: req.botID,
    type: '_doc',
    body: req,
  });
  console.log('indexsing response -----', indexingResposne);
  return true;
  //res.send(new ResponseObject(200, 'Indexed', true, indexingResposne));
};

const elasticPing = catchAsync(async (req, res, next) => {
  console.log('inside ping ');
  let pingResponse = await ElasticClient.cluster.health();
  console.log(pingResponse.status, 'pingResponse from elastic');
  let pingMessage = 'Failed to Connect';
  if (pingResponse.status == 'green' || pingResponse.status == 'yellow') {
    pingMessage = 'Successfully Connected';
  } else {
    next(new ElasticError('Failed to connect ', 404));
    return;
  }
  res.send(new ResponseObject(200, pingMessage, true, pingResponse));
});

// search on basis of query
const queryParamSearch = async (parms) => {
  console.log('params  --', parms);
  let searchResponseQuery = await ElasticClient.search({
    index: 'botindex',
    type: '_doc',
    body: {
      query: {
        bool: {
          must: [{ match: parms }],
        },
      },
    },
  });
  console.log('search response query ', searchResponseQuery);
  return searchResponseQuery;
};

const searchQuery = catchAsync(async (req, res, next) => {
  // lead platfrom and cluster
  console.log('Herere');
  console.log(req.user);
  //let { cluster, leadPlatform } = req.user;
  let cluster = req.user.personalCluster;
  let leadPlatform = req.user.personalLeadPlatform;

  if (
    (cluster != null && cluster != undefined) ||
    (leadPlatform != null && leadPlatform != undefined)
  ) {
    console.log('if');
    let searchResponseQuery = '';
    // check both are there and search the result
    if (
      cluster != null &&
      cluster != undefined &&
      cluster != '' &&
      leadPlatform != null &&
      leadPlatform != undefined &&
      leadPlatform != ''
    ) {
      searchResponseQuery = await ElasticClient.search({
        index: 'botindex',
        type: '_doc',
        body: {
          query: {
            bool: {
              must: [
                { match: { cluster: req.user.personalCluster } },
                { match: { leadPlatform: req.user.personalLeadPlatform } },
              ],
            },
          },
        },
      });
      console.log('search ', searchResponseQuery);

      if (searchResponseQuery.took > 0) {
        res.send(
          new ResponseObject(200, 'found', true, { allBots: searchResponseQuery.hits.hits })
        );
        return;
      }
      if (searchResponseQuery.took == 0) {
        // search on basis of cluster
        console.log('cluster  ---');
        searchResponseQuery = await queryParamSearch({ cluster: cluster });
        console.log('cluster reslut  ---', searchResponseQuery);
        if (searchResponseQuery.took == 0) {
          console.log('lead');
          searchResponseQuery = await queryParamSearch({ leadPlatform: leadPlatform });
        }
        if (searchResponseQuery.took == 0) {
          console.log('leaddd');
          searchResponseQuery = await queryParamSearch({ leadPlatform: req.query.leadPlatform });
        }
        console.log('Final Result --', searchResponseQuery);
        res.send(
          new ResponseObject(200, 'found', true, { allBots: searchResponseQuery.hits.hits })
        );
        return;
      }
    } else if (cluster != undefined && cluster != null && cluster != '') {
      console.log('case cluster  ---');
      let searchBasedOnCluster = await queryParamSearch({ cluster: cluster });
      if (searchBasedOnCluster.took == 0) {
        searchBasedOnCluster = await queryParamSearch({ leadPlatform: req.query.leadPlatform });
      }
      res.send(new ResponseObject(200, 'found', true, { allBots: searchBasedOnCluster.hits.hits }));
      return;
    } else if (leadPlatform != undefined && leadPlatform != null && leadPlatform != '') {
      console.log('lead');
      let searchBasedLead = await queryParamSearch({ leadPlatform: leadPlatform });
      if (searchBasedLead.took == 0) {
        searchBasedLead = await queryParamSearch({ leadPlatform: req.query.leadPlatform });
      }
      res.send(new ResponseObject(200, 'found', true, { allBots: searchBasedLead.hits.hits }));
      return;
    }
    else {
      if (Object.keys(req.query).length != 0) {
        let searchResponseQuery = await ElasticClient.search({
          index: 'botindex',
          type: '_doc',
          body: {
            query: {
              bool: {
                must: [{ match: { leadPlatform: req.query.leadPlatform } }],
              },
            },
          },
        });
        res.send(new ResponseObject(200, 'found', true, { allBots: searchResponseQuery.hits.hits }));
      }
    }
  } else {
    if (Object.keys(req.query).length != 0) {
      let searchResponseQuery = await ElasticClient.search({
        index: 'botindex',
        type: '_doc',
        body: {
          query: {
            bool: {
              must: [{ match: { leadPlatform: req.query.leadPlatform } }],
            },
          },
        },
      });
      res.send(new ResponseObject(200, 'found', true, { allBots: searchResponseQuery.hits.hits }));
    }
  }
});

const searchAny = catchAsync(async (req, res, next) => {
  let query = req.query.search;
  console.log('req query  --', query);

  let searchResponseQuery = await ElasticClient.search({
    index: 'botindex',
    type: '_doc',
    body: {
      query: {
        bool: {
          should: [
            {
              bool: {
                must: [{ match: { leadPlatform: query } }],
                // must: [{ match: { UserEmail: query } }],
              },
            },
            {
              bool: {
                // must: [{ match: { botID: query } }],
                must: [{ match: { UserEmail: query } }],
              },
            },
            {
              bool: {
                // must: [{ match: { botID: query } }],
                must: [{ match: { area: query } }],
              },
            },
            {
              bool: {
                // must: [{ match: { botID: query } }],
                must: [{ match: { subArea: query } }],
              },
            },
            {
              bool: {
                // must: [{ match: { botID: query } }],
                must: [{ match: { status: query } }],
              },
            },
            {
              bool: {
                // must: [{ match: { botID: query } }],
                must: [{ match: { processName: query } }],
              },
            },
            {
              bool: {
                // must: [{ match: { botID: query } }],
                must: [{ match: { processDescription: query } }],
              },
            },
            {
              bool: {
                // must: [{ match: { botID: query } }],
                must: [{ match: { technology: query } }],
              },
            },
            {
              bool: {
                // must: [{ match: { botID: query } }],
                must: [{ match: { cluster: query } }],
              },
            },
          ],
        },
      },
    },
  });
  console.log('search respoosne  ----', searchResponseQuery);
  res.send(new ResponseObject(200, 'found', true, searchResponseQuery.hits.hits));
});

const botSearchSuggestions = catchAsync(async (req, res, next) => {
  let query = req.query.search;
  console.log('req query  --', query);

  let searchResponseQuery = await ElasticClient.search({
    index: 'botindex',
    type: '_doc',
    q: query,
    size: '9999',
    body: {
      query: {
        match_all: {},
      },
    },
  });
  console.log('search respoosne  ----', searchResponseQuery.hits.hits.length);
  res.send(new ResponseObject(200, 'found', true, searchResponseQuery.hits.hits));
});

const indexingViaDrupal = catchAsync(async (req, res, next) => {
  console.log(req.body.data.type);
  if (req.body.data.type == 'cez_page') {
    console.log(
      'req.body.data',
      req.body.data
    );
    req.body.data.field_cez_content_component.map(async (data, it) => {
      console.log(
        'title',
        data.component.content.field_title,
        'body',
        data.component.content.field_message_input
      );
      if (it >= 2) {
        let obj = {
          title: data.component.content.field_title,
          body: data.component.content.field_message_input,
        };
        console.log(
          'data.component.content.field_cez_details_component',
          data.component.content.field_cez_details_component,
          data.component.content.field_cez_details_component.length
        );
        data.component.content.field_cez_details_component.map(async (item, i) => {
          obj.cardTitle = (await item.field_title) ? item.field_title : '';
          obj.cardBody = (await item.field_message_input) ? item.field_message_input : '';
          if (item.field_cez_feature_block) {
            item.field_cez_feature_block.map(async (temp, index) => {
              obj.featureTitle = (await temp.field_title) ? temp.field_title : '';
              obj.featureBody = (await temp.field_details) ? temp.field_details : '';
            });
          }
          if (item.field_video_with_text_component) {
            item.field_video_with_text_component.map(async (temp, index) => {
              obj.videoTitle = (await temp.field_title) ? temp.field_title : '';
              obj.videoBody = (await temp.field_details) ? temp.field_details : '';
            });
          }
          if (item.field_customer_detail_component) {
            item.field_customer_detail_component.map(async (temp, index) => {
              obj.customerTitle = (await temp.field_title) ? temp.field_title : '';
              obj.customerBody = (await temp.field_details) ? temp.field_details : '';
            });
          }
          console.log(i == data.component.content.field_cez_details_component.length);
          if (i == data.component.content.field_cez_details_component.length - 1) {
            console.log(obj);
            let indexingResposne = await ElasticClient.index({
              index: 'cez',
              id: req.body.data.type + it,
              type: '_doc',
              body: obj,
            });
            console.log('indexsing response -----', indexingResposne);
          }
        });
      } else if(it == 0){
        let obj = {
          title: data.component.content.field_hedaing,
          body: data.component.content.field_details,
        };
        let indexingResposne = await ElasticClient.index({
          index: 'cez',
          id: req.body.data.type + it,
          type: '_doc',
          body: obj,
        });
        console.log('indexsing response -----', indexingResposne);
      }
    });
  } else if (req.body.data.type == 'contact_us') {
    req.body.data.field_contact_component.map(async (item, i) => {
      if (i > 0)
        item.component.content.field_contact_persons_component.map(async (obj, j) => {
          let tempObj = {
            name: obj.field_title,
            email: obj.field_person_email_id,
            designation: obj.field_contact_us,
            image: obj.field_background_image[0].file_url,
            keyword: "contact"
          };
          console.log(obj);
          let indexingResposne = await ElasticClient.index({
            index: 'contact_us',
            id: req.body.data.type + j,
            type: '_doc',
            body: tempObj,
          });
          console.log('indexsing response -----', indexingResposne);
        });
    });
  }

  res.send(new ResponseObject(200, 'Data indexed on ES', true, {}));
});

const drupalIndexSearch = catchAsync(async (req, res, next) => {
  console.log(req.body);
  // let searchRsponse = await ElasticClient.search({
  //   index: 'drupalindex',
  //   type: 'drupal',
  //   body: {
  //     query: {
  //       match_all: {},
  //     },
  //   },
  // });
  res.send(new ResponseObject(200, 'Get Drupal Data', true, {}));
});

const deleteAllIndices = catchAsync(async (req, res, next) => {
  console.log('here');
  ElasticClient.indices.delete(
    {
      index: 'framework',
    },
    function (err, res) {
      if (err) {
        console.error(err.message);
      } else {
        console.log('Indexes have been deleted!');
      }
    }
  );
  res.send('Bots deleted');
});

const globalSearch = catchAsync(async (req, res, next) => {
  console.log('global search query ---', req.query);
  console.log("logging usertypes",req.user)
  let str = req.query.k.trim().replace(/ /g, '* ');

  let index = await ElasticClient.cat.indices({
    // index: '_all',
    h: ['index'],
  });
  let indicies = index.split('\n');
  console.log('indices global search----', indicies);
  let obj = {};
  indicies.map(async (ind, i) => {
    if (ind != '') {
      let resElastic = await ElasticClient.search({
        index: ind,
        // q: `${str}*`,
        body: {
          query: {
            query_string: {
              query: `${str}*`,
              analyzer: 'stop',
              fields: [
                'processName^5',
                'processDescription^2',
                'title^5',
                'body^2',
                'name^5',
                'designation^2',
                'email^2',
                "docName^5",
                "docCategory^3",
                "docType^2",
                "keyword^2"
              ],
            },
          },
        },
      });
      obj[ind] = resElastic.hits.hits;
      if (Object.keys(obj).length == indicies.length - 1) {
        console.log(obj)
        let restrictedUsers =  ["endUser", "businessUserRegionWise", "businessOwner", "firstGfcf", "gfcf", "firstLevelGPMApprover", "GPMapprover","gCad"]
        if (restrictedUsers.includes(req.user.userType)){
          obj.framework = obj.framework.filter((item) => item._source.docCategory !== "confidential")
        }
        res.send(new ResponseObject(200, 'Search Result Data', true, obj));
      }
    }
  });
});

const getFromIndexUsingId = catchAsync(async (req, res, next) => {
  console.log('req query  ---', req.query);
  // const  body  = await ElasticClient.get({
  //   index: 'botindex',
  //   id: req.query.botID,
  //   type:"bot"
  // });
  // console.log('body ---', body);

  // const deleteBot  =await ElasticClient.delete({
  //   index: "botindex",
  //   type: "bot",
  //   id:req.query.botID
  // });
  // console.log("deletel bots  ---", deleteBot);
  const botUserReponse = await BotUser.Bot.findAll({
    attributes: ['botID'],
  });
  let botsFromSql = [];
  for (let i = 0; i < botUserReponse.length; i++) {
    // console.log("bot user ---", botUserReponse[i].botID);
    botsFromSql.push(botUserReponse[i].botID);
  }
  let response = await ElasticClient.search({
    index: 'botindex',
    type: '_doc',
    size: 100,
    body: {
      sort: [{ botID: { order: 'asc' } }],
      size: 100,
      query: { match_all: {} },
    },
  });

  let botsFromElastic = [];
  //console.log("response  ----", response.hits);
  let responseHits = await response.hits;
  for (let j = 0; j < responseHits.hits.length; j++) {
    console.log('resonse elastic search  ---', response.hits.hits[j]._id);
    botsFromElastic.push(response.hits.hits[j]._id);
  }
  console.log('bots from sql  ---', botsFromSql, 'length ---', botsFromSql.length);

  console.log('Bots from elastic  ----', botsFromElastic, 'length ---', botsFromElastic.length);

  for (let i = 0; i < botsFromElastic.length; i++) {
    let found = false;
    innner: for (let k = 0; k < botsFromSql.length; k++) {
      if (botsFromElastic[i] == botsFromSql[k]) {
        found = true;
        break innner;
      }
    }
    if (found == false) {
      const deleteBot = await ElasticClient.delete({
        index: 'botindex',
        type: '_doc',
        id: botsFromElastic[i],
      });
      console.log('bot deleted', deleteBot);
      console.log('not in sql  ---', botsFromElastic[i]);
    }
  }
  //console.log("botUSerResponse  ----", botUserReponse);
  res.send(new ResponseObject(200, 'datafound', true, response.hits));
});
export default {
  elasticIndexing,
  elasticPing,
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
  getFramework,
};
