import sequalize from '../helpers/Sequalize';
import BotUser from '../models/BotUser';
import products from '../models/products';
import { buyNowMail, pinMail, shareMail } from './mailerController';
import catchAsync from '../helpers/catchAsync';
import sequelize, { Op } from 'sequelize';
import ResponseObject from '../helpers/responseObjectClass';
import hitCounts from '../models/hitCount';
import Comments from '../models/comment';
import shares from '../models/share';
import Pin from '../models/pin';
import Notification from '../models/notification';
import Ratings from '../models/rating';
import averRating from '../models/avaragerating';
import BuyNow from '../models/BuyNow';
import newUserUnilever from '../models/newUser';
import path from 'path';
//import  graphApi  from '../helpers/msal';
import axios from 'axios';

const getclusterFunctionData = catchAsync(async (req, res) => {
  try {
    const cluster = await products.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('cluster')), 'name']],
    });
    const functions = await products.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('catalog_products')), 'name']],
    });
    const OKR = await products.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('OKR')), 'name']],
    });
    res.status(200).json({
      cluster,
      function: functions,
      OKR: OKR,
    });
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});

const getAllUsers = catchAsync(async (req, res) => {
  try {
    const searchText = req.query.text;

    // Split the searchText into individual terms
    const searchTerms = searchText.split(' ');

    // Initialize an array to store the where conditions for each search term
    const whereConditions = [];

    searchTerms.forEach((term) => {
      const termCondition = {
        [sequelize.Op.or]: [
          {
            email: {
              [sequelize.Op.like]: `%${term}%`,
            },
          },
          {
            [sequelize.Op.and]: [
              {
                email: {
                  [sequelize.Op.like]: `%@unilever.com`,
                },
              },
              {
                name: {
                  [sequelize.Op.like]: `%${term}%`,
                },
              },
            ],
          },
        ],
      };

      whereConditions.push(termCondition);
    });

    // Use Sequelize's [sequelize.Op.or] to combine the where conditions
    const resultData = await newUserUnilever.findAll({
      where: {
        [sequelize.Op.or]: whereConditions,
      },
      attributes: ['email', 'name'],
    });

    const filteredUsers = resultData.map((result) => ({
      email: result.email,
      name: result.name,
    }));

    // Sort users by the number of exact matches in the name field
    const sortedUsers = filteredUsers.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const exactMatchesA = searchTerms.filter((term) => aName.includes(term.toLowerCase())).length;
      const exactMatchesB = searchTerms.filter((term) => bName.includes(term.toLowerCase())).length;
      return exactMatchesB - exactMatchesA;
    });

    // Remove duplicates by email address
    const uniqueUsers = Array.from(new Set(sortedUsers.map((user) => user.email))).map((email) => {
      return sortedUsers.find((user) => user.email === email);
    });

    // Filter out the current user's email
    const users = uniqueUsers.filter((user) => user.email !== req.user.email);

    res.status(200).json({
      users,
    });
  } catch (err) {
    console.error("Sequelize Error:", err);
    res.status(400).json({
      message: 'Not able to get users.',
    });
  }
});



const getStaticFinanceData = catchAsync(async (req, res) => {
  try {
    const userEmail = req.user.email;
    const resultData = await products.findAll({
      where: {
        catalog_products: 'Finance',
      },
      order: [['createdAt', 'DESC']],
    });

    // Fetch pins for the user
    const userPins = await Pin.findAll({
      where: {
        email: userEmail,
      },
    });
    const pinnedProductIds = new Set(userPins.map((pin) => pin.product_id));
    const catalogData = resultData.map((result) => {
      const product = result.dataValues;
      const isPinned = pinnedProductIds.has(product.product_id) ? 1 : 0;
      return {
        id: product.product_id,
        name: product.product_title,
        description: product.product_description,
        image: product.product_banner,
        isPinned,
        function: product.catalog_products,
        cluster: product.cluster,
        video: product.product_video,
        documentLink: product.document_url,
        product_url: product.product_url,
        product_images: product.product_images,
      };
    });

    res.status(200).json({
      products: catalogData,
    });
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});

const getFunctionData = catchAsync(async (req, res) => {
  const product_status = req.query.product_status;
  const cluster = req.query.cluster ? req.query.cluster.split(',') : [];
  const catalogProducts = req.query.catalog_products ? req.query.catalog_products.split(',') : [];
  const okr = req.query.OKR ? req.query.OKR.split(',') : [];

  try {
    const userEmail = req.user.email;
    const whereClause = {};

    if (cluster.length > 0) {
      whereClause.cluster = {
        [sequelize.Op.in]: cluster,
      };
    }

    if (catalogProducts.length > 0) {
      whereClause.catalog_products = {
        [sequelize.Op.in]: catalogProducts,
      };
    }

    if (okr.length > 0) {
      whereClause.OKR = {
        [sequelize.Op.in]: okr,
      };
    }

    const resultData = await products.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    // const productsWithOKR = okr.length == 0 ? resultData.some((product) => product.OKR === okr) : true;

    // if (!productsWithOKR) {
    //   return res.status(404).json({
    //     message: okr ? `No products with OKR ${okr} found.` : 'No products found.',
    //     products: [], // Return an empty array if no products match the filter.
    //   });
    // }

    const userPins = await Pin.findAll({
      where: {
        email: userEmail,
      },
    });

    const pinnedProductIds = new Set(userPins.map((pin) => pin.product_id));
    
    const catalogData = await Promise.all(resultData.map(async (result) => {
      const product = result.dataValues;
      
      const rating = await averRating.findOne({
        where: {
          product_id: product.product_id,
        },
        attributes: ['roundedAverageRating'],
        order: [['roundedAverageRating', 'DESC']],
      });

      const isPinned = pinnedProductIds.has(product.product_id) ? 1 : 0;
      const productStatus = product.product_status === '1' ? 'Live' : 'Upcoming';

      const filePath = path.resolve(__dirname, '../../../buynowData.json');
      const JSONdata = require(filePath);

      let commonData = [
        {
          "product_name": product ? product.product_title : null,
          "title" : "Pro",
          "price" : 7,
          "priceTextColor": "#00D7C4",
          "oneTime" : 30,
          "oneTimeDiscounted" : 6,
          "yearOnyear" : 10,
          "yearOnYearDiscounted" : 1,
          "list" : [ "Automation product built with 25+ HAP technologies" ]
      },
      {
          "product_name": product ? product.product_title : null,
          "title" : "Legend",
          "price" : 11,
          "priceTextColor": "#7A2D8B",
          "oneTime" : 45,
          "oneTimeDiscounted" : 9,
          "yearOnyear" : 15,
          "yearOnYearDiscounted" : 2,
          "list" : [ "Pro", "GEN-AI topup from HAP" ]
      }
    ]

    let responsePackage = {};

      for (let i in JSONdata) {

        if(product.product_id == JSONdata[i].product_id) {

          if (JSONdata[i].title == "Pro") {
            responsePackage.pro = {
              name: `${JSONdata[i].product_name} Pro`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          } 
          if (JSONdata[i].title == "Legend") {
            responsePackage.legend = {
              name: `${JSONdata[i].product_name} Legend`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          }
          
        }
      }
      if(Object.keys(responsePackage).length === 0) {
          commonData.forEach((data) => {
                   
            if (data.title == "Pro") {
              responsePackage.pro = {
                name: `${data.product_name} Pro`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            } 
            if (data.title == "Legend") {
              responsePackage.legend = {
                name: `${data.product_name} Legend`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            }
          });
        }

      return {
        id: product.product_id,
        name: product.product_title,
        description: product.product_description,
        image: product.product_banner,
        isPinned,
        function: product.catalog_products,
        cluster: product.cluster,
        product_url: product.product_url,
        product_images: product.product_images,
        video: product.product_video,
        documentLink: product.document_url,
        status: productStatus,
        OKR: product.OKR,
        rating: rating ? rating.dataValues.roundedAverageRating : null,
        packages: responsePackage
      };
    }));
    catalogData.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;

      // First, compare by rating in descending order
      const ratingComparison = ratingB - ratingA;

      // If ratings are equal, then compare by product ID
      if (ratingComparison === 0) {
        return a.id - b.id;
      }

      return ratingComparison;
    });
    

    let filteredCatalogData = catalogData;

    if (product_status === '1') {
      filteredCatalogData = catalogData.filter((product) => product.status === 'Live');
    } else if (product_status === '0') {
      filteredCatalogData = catalogData.filter((product) => product.status === 'Upcoming');
    }

    if (filteredCatalogData.length === 0) {
      return res.status(404).json({
        message: product_status === '0' ? 'No upcoming products found.' : 'No live products found.',
        products: [], // Return an empty array if no products match the filter.
      });
    }
    
    res.status(200).json({
      products: filteredCatalogData,
    });
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});

const getStaticSupplyChainData = catchAsync(async (req, res) => {
  try {
    const userEmail = req.user.email;
    const resultData = await products.findAll({
      where: {
        catalog_products: 'Supply Chain',
      },
      order: [['createdAt', 'DESC']],
    });
    const userPins = await Pin.findAll({
      where: {
        email: userEmail,
      },
    });
    const pinnedProductIds = new Set(userPins.map((pin) => pin.product_id));
    const catalogData = resultData.map((result) => {
      const product = result.dataValues;
      const isPinned = pinnedProductIds.has(product.product_id) ? 1 : 0;
      return {
        id: product.product_id,
        name: product.product_title,
        description: product.product_description,
        image: product.product_banner,
        isPinned: isPinned ? 1 : 0,
        function: product.catalog_products,
        cluster: product.cluster,
        video: product.product_video,
        documentLink: product.document_url,
        product_url: product.product_url,
        product_images: product.product_images,
      };
    });

    res.status(200).json({
      products: catalogData,
    });
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});

const getNewProductDateWise = catchAsync(async (req, res) => {
  try {
    const email = req.user.email;
    await averRating.sync();

    let productsQueryOptions = {
      order: [['product_id', 'DESC']],
    };

    if (req.query.catalog_products) {
      // If catalog_products parameter is provided, filter products by the specified cluster
      productsQueryOptions.where = {
        catalog_products: req.query.catalog_products,
      };
    }

    const productsWithRatingAndDate = await products.findAll(productsQueryOptions);

    const userPins = await Pin.findAll({
      where: {
        email: email,
      },
    });

    const pinnedProductIds = new Set(userPins.map((pin) => pin.product_id));

    const mapProduct = async (product) => {
      // Fetch the rating for the product
      const rating = await averRating.findOne({
        where: {
          product_id: product.product_id,
        },
        attributes: ['roundedAverageRating'],
        order: [['roundedAverageRating', 'DESC']],
      });


      const filePath = path.resolve(__dirname, '../../../buynowData.json');
      const JSONdata = require(filePath);

      let commonData = [
        {
          "product_name": product ? product.product_title : null,
          "title" : "Pro",
          "price" : 7,
          "priceTextColor": "#00D7C4",
          "oneTime" : 30,
          "oneTimeDiscounted" : 6,
          "yearOnyear" : 10,
          "yearOnYearDiscounted" : 1,
          "list" : [ "Automation product built with 25+ HAP technologies" ]
      },
      {
          "product_name": product ? product.product_title : null,
          "title" : "Legend",
          "price" : 11,
          "priceTextColor": "#7A2D8B",
          "oneTime" : 45,
          "oneTimeDiscounted" : 9,
          "yearOnyear" : 15,
          "yearOnYearDiscounted" : 2,
          "list" : [ "Pro", "GEN-AI topup from HAP" ]
      }
    ]
    let responsePackage = {};

      for (let i in JSONdata) {

        if(product.product_id == JSONdata[i].product_id) {

          if (JSONdata[i].title == "Pro") {
            responsePackage.pro = {
              name: `${JSONdata[i].product_name} Pro`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          } 
          if (JSONdata[i].title == "Legend") {
            responsePackage.legend = {
              name: `${JSONdata[i].product_name} Legend`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          }
          
        }
      }
      if(Object.keys(responsePackage).length === 0) {
          commonData.forEach((data) => {
                   
            if (data.title == "Pro") {
              responsePackage.pro = {
                name: `${data.product_name} Pro`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            } 
            if (data.title == "Legend") {
              responsePackage.legend = {
                name: `${data.product_name} Legend`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            }
          });
        }


      // Include the product in the response only if it has a rating
      if (rating && rating.dataValues.roundedAverageRating !== null) {
        return {
          id: product.product_id,
          name: product.product_title,
          description: product.product_description,
          image: product.product_banner,
          isPinned: pinnedProductIds.has(product.product_id) ? 1 : 0,
          function: product.catalog_products,
          cluster: product.cluster,
          product_url: product.product_url,
          product_images: product.product_images,
          documentUrl: product.document_url,
          product_url: product.product_url,
          product_images: product.product_images,
          rating: rating.dataValues.roundedAverageRating,
          packages: responsePackage
        };
      }
      return null;
    };

    const response = [];

    if (!req.query.catalog_products) {
      // Sort products by rating if catalog_products is not provided
      const ratedProducts = await Promise.all(productsWithRatingAndDate.map(mapProduct));
    
      // Filter out products that don't have ratings
      const filteredProducts = ratedProducts.filter((product) => product !== null);
    
      filteredProducts.sort((a, b) => {
        return b.rating - a.rating;
      });
    
      response.push({
        heading: 'All Products (Sorted by Rating)',
        products: filteredProducts,
      });
    } else {
      // If catalog_products filter is provided, add the "Top Products" section
    
      // Fetch the ratings for all products in catalog_products
      const topRatedProductsData = await averRating.findAll({
        where: {
          catalog_products: req.query.catalog_products,
        },
        attributes: ['roundedAverageRating'],
        order: [['roundedAverageRating', 'DESC']],
      });
    
      const valRatingData = topRatedProductsData.map((result) => result.dataValues);
    
      // Create a mapping of product_id to rating
      const productRatingsMap = new Map();
      valRatingData.forEach((rating) => {
        productRatingsMap.set(rating.product_id, rating.average_rating);
      });
    
      // Sort productsWithRatingAndDate based on the ratings in descending order
      productsWithRatingAndDate.sort((a, b) => {
        const ratingA = productRatingsMap.get(a.product_id) || 0;
        const ratingB = productRatingsMap.get(b.product_id) || 0;
        return ratingB - ratingA;
      });
    
      const filteredProducts = await Promise.all(productsWithRatingAndDate.map(mapProduct));
    
      // Filter out products that don't have ratings
      const ratedProducts = filteredProducts.filter((product) => product !== null);
    
      response.push({
        heading: `Top Products ${req.query.catalog_products}`,
        products: ratedProducts,
      });
    }
    
    res.status(200).json({ data: response });
   
} catch (e) {
    console.error('Error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
});

async function getAverageRatings(topRatedProducts, productId) {
  const product = topRatedProducts.find((product) => product.product_id === productId);
  return product ? product.roundedAverageRating : 0;
}

const manHoursSaved = catchAsync(async (req, res) => {
  try {
    const { hrs_saved } = req.body;
    const resultData = await products.findAll({
      where: {
        hrs_saved: hrs_saved,
      },
      order: [['createdAt', 'DESC']],
    });
    const valData = resultData.map((result) => result.dataValues);
    const manhoursSavedData = valData.map(
      ({ product_title, product_description, product_banner, hrs_saved, hrs_saved_text }) => ({
        product_title,
        product_description,
        product_banner,
        hrs_saved,
        hrs_saved_text,
      })
    );
    res.status(200).json({
      products: manhoursSavedData,
    });
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});

const buyNowDataAPI = catchAsync(async (req, res) => {
  try {
    await products.sync();
    await BuyNow.sync();

    const { product_id, product_type } = req.body;

    if (!product_id || !product_type) {
      return res.status(400).json({ error: 'Missing required fields in the request body.' });
    }

    const productType = product_type.charAt(0).toUpperCase() + product_type.slice(1);


    const filePath = path.resolve(__dirname, '../../../buynowData.json');
    const JSONdata = require(filePath);


    // Retrieve productDetails from the Product model
    const productDetails = await products.findOne({
      where: {
        product_id: product_id,
      },
    });

    let commonData = [
      {
        "product_name" : productDetails ? productDetails.product_title : null,
        "title" : "Pro",
        "price" : 7,
        "priceTextColor": "#00D7C4",
        "oneTime" : 30,
        "oneTimeDiscounted" : 6,
        "yearOnyear" : 10,
        "yearOnYearDiscounted" : 1,
        "list" : [ "Automation product built with 25+ HAP technologies" ]
    },
    {
        "product_name" : productDetails ? productDetails.product_title : null,      
        "title" : "Legend",
        "price" : 11,
        "priceTextColor": "#7A2D8B",
        "oneTime" : 45,
        "oneTimeDiscounted" : 9,
        "yearOnyear" : 15,
        "yearOnYearDiscounted" : 2,
        "list" : [ "Pro", "GEN-AI topup from HAP" ]
    }
  ]
    let buyNowData = null;

    for (let i in JSONdata) {
      if (product_id == JSONdata[i].product_id && productType == JSONdata[i].title) {
        buyNowData = JSONdata[i];
        break;  // Exit the loop once a match is found
      }
    }
    
    // If no match was found, use commonData
    if (!buyNowData) {
      commonData.forEach((data) => {
        if (data.title == productType) {
          buyNowData = data;
        }
      });
    }
  let responseData = {
      responseMessage: "Thankyou for selecting this product. Your order is being processed"
    };

   // let responseData = {};

    if (buyNowData) {
      if (buyNowData.title == "Pro") {
        responseData.pro = {
          name: `${buyNowData.product_name} Pro`,
          title: buyNowData.title,
          price: buyNowData.price,
          priceTextColor: buyNowData.priceTextColor,
          oneTime: buyNowData.oneTime,
          oneTimeDiscounted: buyNowData.oneTimeDiscounted,
          yearOnYear: buyNowData.yearOnyear,
          yearOnYearDiscounted: buyNowData.yearOnYearDiscounted,
          list: buyNowData.list
        };
      } else if (buyNowData.title == "Legend") {
        responseData.legend = {
          name: `${buyNowData.product_name} Legend`,
          title: buyNowData.title,
          price: buyNowData.price,
          priceTextColor: buyNowData.priceTextColor,
          oneTime: buyNowData.oneTime,
          oneTimeDiscounted: buyNowData.oneTimeDiscounted,
          yearOnYear: buyNowData.yearOnyear,
          yearOnYearDiscounted: buyNowData.yearOnYearDiscounted,
          list: buyNowData.list
        };
      }
    }

    let mailerObject = {
      buyNowData: productDetails,
      user: req.user,
      responseDetails: responseData,
      type: 'buy now mail',
    };   

    await buyNowMail(mailerObject);

    //console.log('444>>>>', mailerObject);
    return res.status(201).json(responseData);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

const commentAPI = catchAsync(async (req, res) => {
  try {
    const { product_id, comments, tags } = req.body;

    await Comments.sync();


    const userComment = await Comments.create({
      product_id: product_id,
      userComments: comments,
      email: req.user.email,
      tags: tags ? JSON.stringify(tags) : null
    });


    // const user = await Comments.findOne({ where : { product_id: product_id } })

    // console.log("tags",JSON.parse(user.dataValues.tags))

    res.send(new ResponseObject(200, 'comment successfully', true, userComment));
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});

const getAllLike = catchAsync(async (req, res) => {
  try {
    await hitCounts.sync();
    const counts1 = await hitCounts.count({ count: counts1 });
    res.status(200).json({
      data: {
        hitcount: counts1,
      },
    });
    //res.send(new ResponseObject(200, 'all counts successfully', true, counts));
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});

const getAllComments = catchAsync(async (req, res) => {
  try {
    let userComments;
    await Comments.sync();
    const UserComment = await Comments.findAll({
      userComments,
    });
    const valData = UserComment.map((result) => result.dataValues);
    const resultCommentData = valData.map(({ userComments }) => ({ userComments }));
    res.status(200).json({
      data: {
        comments: resultCommentData,
      },
    });
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});
/* const shareAPI = catchAsync(async (req, res) => {
  try {
    const { product_id, message,shareTo } = req.body;

    if (!product_id || !Array.isArray(shareTo)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const createdShares = [];
    const users = [];

    if (shareTo) {
      const shareEmails = shareTo.map((shareEntry) => shareEntry.shareEmail); // Extract email addresses

      for (const shareEntry of shareTo) {
        const { shareEmail, id } = shareEntry;
        // console.log('Mailer controller: shareEmail:', shareEmail);
        // console.log('428>>controller', shareEmail);
        // console.log('429>>controller', shareEmails);

        if (!shareEmail) {
          return res.status(400).json({ error: 'Email is missing for one or more users' });
        }
        if (!shareEmail.endsWith('@unilever.com')) {
          return res.status(400).json({ error: 'Invalid email address' });
        }

        const userData = await newUserUnilever.findAll({ where: { email: shareEmail } }); // Use shareEmail directly
        if (!userData) {
          return res.status(404).json({ error: `User not found for email: ${shareEmail}` });
        }

        users.push(userData);

        await shares.sync();

        const shareData = await shares.create({
          product_id: product_id,
          message: message,
          shareEmail: shareEmail,
          id: id || null,
        });
        console.log('448>>>', shareData);

        createdShares.push({
          shareEmail: shareEmail,
          id: shareData.id,
        });
      }
    }

    const addData = await products.findOne({
      where: {
        product_id: product_id,
      },
      raw: true,
    });

    const filePath = path.resolve(__dirname, '../../../buynowData.json');
    const JSONdata = require(filePath);

      let commonData = [
        {
          "product_name" : addData ? addData.product_title : null,
          "title" : "Pro",
          "price" : 7,
          "priceTextColor": "#00D7C4",
          "oneTime" : 60,
          "oneTimeDiscounted" : 35,
          "yearOnyear" : 20,
          "yearOnYearDiscounted" : 7,
          "list" : [ "Automation product built with 25+ HAP technologies" ]
      },
      {
          "product_name" : addData ? addData.product_title : null,      
          "title" : "Legend",
          "price" : 11,
          "priceTextColor": "#7A2D8B",
          "oneTime" : 90,
          "oneTimeDiscounted" : 55,
          "yearOnyear" : 30,
          "yearOnYearDiscounted" : 11,
          "list" : [ "Pro", "GEN-AI topup from HAP" ]
      }
    ]

    let responsePackage = {};

      for (let i in JSONdata) {

        if(addData.product_id == JSONdata[i].product_id) {

          if (JSONdata[i].title == "Pro") {
            responsePackage.pro = {
              name: `${JSONdata[i].product_name} Pro`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          } 
          if (JSONdata[i].title == "Legend") {
            responsePackage.legend = {
              name: `${JSONdata[i].product_name} Legend`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          }
          
        }
      }
      if(Object.keys(responsePackage).length === 0) {
          commonData.forEach((data) => {
                   
            if (data.title == "Pro") {
              responsePackage.pro = {
                name: `${data.product_name} Pro`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            } 
            if (data.title == "Legend") {
              responsePackage.legend = {
                name: `${data.product_name} Legend`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            }
          });
        }

    let mailerObject = {
      shareData: addData,
      user: users,
      sender: req.user,
      shareEmails: createdShares.map((share) => share.shareEmail),
      message: message, 
      type: 'share product mail',
      responsePackage
    };
    await shareMail(mailerObject);

    res.status(201).json({
      product_id: product_id,
      message: message,
      shareTo: createdShares,
    });
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e.message });
  }
}); */

//new shareAPI with CTA message

const shareAPI = catchAsync(async (req, res) => {
  try {
    const { product_id, message,shareTo } = req.body;

    if (!product_id || !Array.isArray(shareTo)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const createdShares = [];
    const users = [];
    let responseMessage = [];


    if (shareTo) {
      const shareEmails = shareTo.map((shareEntry) => shareEntry.shareEmail); // Extract email addresses

      for (const shareEntry of shareTo) {
        const { shareEmail, id } = shareEntry;
        // console.log('Mailer controller: shareEmail:', shareEmail);
        // console.log('428>>controller', shareEmail);
        // console.log('429>>controller', shareEmails);

        if (!shareEmail) {
          return res.status(400).json({ error: 'Email is missing for one or more users' });
        }
        if (!shareEmail.endsWith('@unilever.com')) {
          return res.status(400).json({ error: 'Invalid email address' });
        }

        const userData = await newUserUnilever.findAll({ where: { email: shareEmail } }); // Use shareEmail directly
        if (!userData) {
          return res.status(404).json({ error: `User not found for email: ${shareEmail}` });
        }

        users.push(userData);

        await shares.sync();

        const shareData = await shares.create({
          product_id: product_id,
          message: message,
          shareEmail: shareEmail,
          id: id || null,
        });
        console.log('448>>>', shareData);

        createdShares.push({
          shareEmail: shareEmail,
          id: shareData.id,
        });
  

    const addData = await products.findOne({
      where: {
        product_id: product_id,
      },
      raw: true,
    });

    const filePath = path.resolve(__dirname, '../../../buynowData.json');
    const JSONdata = require(filePath);

      let commonData = [
        {
          "product_name" : addData ? addData.product_title : null,
          "title" : "Pro",
          "price" : 7,
          "priceTextColor": "#00D7C4",
          "oneTime" : 30,
          "oneTimeDiscounted" : 6,
          "yearOnyear" : 10,
          "yearOnYearDiscounted" : 1,
          "list" : [ "Automation product built with 25+ HAP technologies" ]
      },
      {
          "product_name" : addData ? addData.product_title : null,      
          "title" : "Legend",
          "price" : 11,
          "priceTextColor": "#7A2D8B",
          "oneTime" : 45,
          "oneTimeDiscounted" : 9,
          "yearOnyear" : 15,
          "yearOnYearDiscounted" : 2,
          "list" : [ "Pro", "GEN-AI topup from HAP" ]
      }
    ]
    let responsePackage = {};

      for (let i in JSONdata) {

        if(addData.product_id == JSONdata[i].product_id) {

          if (JSONdata[i].title == "Pro") {
            responsePackage.pro = {
              name: `${JSONdata[i].product_name} Pro`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          } 
          if (JSONdata[i].title == "Legend") {
            responsePackage.legend = {
              name: `${JSONdata[i].product_name} Legend`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          }
          
        }
      }
      if(Object.keys(responsePackage).length === 0) {
          commonData.forEach((data) => {
                   
            if (data.title == "Pro") {
              responsePackage.pro = {
                name: `${data.product_name} Pro`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            } 
            if (data.title == "Legend") {
              responsePackage.legend = {
                name: `${data.product_name} Legend`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            }
          });
        }

    let mailerObject = {
      shareData: addData,
      user: users,
      sender: req.user,
      shareEmails: createdShares.map((share) => share.shareEmail),
      message: message, 
      type: 'share product mail',
      responsePackage
    };
    await shareMail(mailerObject);

    responseMessage.push(`Product page is shared privately with ${shareEmail}`)
      
  }
}

    res.status(201).json({
      responseMessage : responseMessage,
      product_id: product_id,
      message: message,
      shareTo: createdShares,
    });
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e.message });
  }
});

//end new shareAPI

/* const pinAPIforOthers = catchAsync(async (req, res) => {
  await Notification.sync();
  await Pin.sync();
  
  try {

    const product_id = req.body.product_id;
    const email = req.user.email;
    const name = req.user.name;
    const targetEmails = req.body.pinTo;
    const message = req.body.message;

    await newUserUnilever.sync();
    const targetEmailStatus = {}; 
    console.log('targetEmailStatus:', targetEmailStatus);
// Initialize the object outside the loop

    for (const value of targetEmails) {
      const targetUser = await newUserUnilever.findOne({
        where: {
          email: value.targetEmails,
        },
      });
      if (!value.targetEmails.endsWith('@unilever.com')) {
        return res.status(403).json({ error: 'Invalid email address' });
      }

      const product = await products.findByPk(product_id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      
      const existingUserPin = await Notification.findOne({
        where: {
          product_id: product_id,
          pinnedByUsername: email,
          targetEmails: {
            [sequelize.Op.like]: `%${value.targetEmails}%`, // Use the % wildcard for "like" search
          },
        },
      });

      if (existingUserPin) {
        // Product is already pinned for this target user
        targetEmailStatus[value.targetEmails] = 'alreadyPinned';
        console.log('1073>>>>>>targetEmailStatus:', targetEmailStatus[value.targetEmails]);
      } else {
        // Check if a pin with the same product_id and targetEmails already exists
        const existingPin = await Notification.findOne({
          where: {
            product_id: product_id,
            pinnedByUsername: { [Op.ne]: email },
            targetEmails: JSON.stringify([value.targetEmails]),
          },
        });

        if (existingPin) {
          // Product is already pinned for this target user by someone else
          targetEmailStatus[value.targetEmails] = 'alreadyPinned';
          console.log('1088>>>>targetEmailStatus:', targetEmailStatus[value.targetEmails]);
        } else {
          // Create a new pin
          const newPin = {
            product_id: product_id,
            pinnedByUsername: email,
            pinnedById: name,
            targetEmails: value.targetEmails,
            targetUsername: '',
            date: new Date(),
            message: message,
          };
          await Notification.create(newPin);
          console.log(`Value: ${value.targetEmails}, existingUserPin: ${!!existingUserPin}, existingPin: ${!!existingPin}`);

          await Pin.sync();
          await Notification.sync();

          let userPins = 0;

          await Promise.all(
            targetEmails.map(async (targetEmail) => {
              const pins = await Pin.findAll({
                where: {
                  email: targetEmail.targetEmails,
                },
                attributes: [[sequelize.fn('COUNT', sequelize.col('email')), 'pinCount']],
              });
              //console.log('950>>>>>>', pins);

              const Noti_pins = await Notification.findAll({
                where: {
                  targetEmails: targetEmail.targetEmails,
                },
                attributes: [[sequelize.fn('COUNT', sequelize.col('targetEmails')), 'Noti_Count']],
              });
              //console.log('960>>>>>>', Noti_pins);

              const combinedCounts = {};

              pins.forEach(({ targetEmails, dataValues }) => {
                combinedCounts[targetEmails] =
                  (combinedCounts[targetEmails] || 0) + dataValues.pinCount;
              });

              Noti_pins.forEach(({ targetEmails, dataValues }) => {
                combinedCounts[targetEmails] =
                  (combinedCounts[targetEmails] || 0) + dataValues.Noti_Count;
              });

              userPins = combinedCounts.undefined;
             // console.log('973>>>>>>', userPins);
            })
          );

          const filePath = path.resolve(__dirname, '../../../buynowData.json');
          const JSONdata = require(filePath);
      
            let commonData = [
              {
                "product_name" : product ? product.product_title : null,
                "title" : "Pro",
                "price" : 7,
                "priceTextColor": "#00D7C4",
                "oneTime" : 60,
                "oneTimeDiscounted" : 35,
                "yearOnyear" : 20,
                "yearOnYearDiscounted" : 7,
                "list" : [ "Automation product built with 25+ HAP technologies" ]
            },
            {
                "product_name" : product ? product.product_title : null,      
                "title" : "Legend",
                "price" : 11,
                "priceTextColor": "#7A2D8B",
                "oneTime" : 90,
                "oneTimeDiscounted" : 55,
                "yearOnyear" : 30,
                "yearOnYearDiscounted" : 11,
                "list" : [ "Pro", "GEN-AI topup from HAP" ]
            }
          ]
      
          let responsePackage = {};
      
            for (let i in JSONdata) {
      
              if(product.product_id == JSONdata[i].product_id) {
      
                if (JSONdata[i].title == "Pro") {
                  responsePackage.pro = {
                    name: `${JSONdata[i].product_name} Pro`,
                    title: JSONdata[i].title,
                    price: JSONdata[i].price,
                    oneTime: JSONdata[i].oneTime,
                    oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
                    yearOnYear: JSONdata[i].yearOnyear,
                    yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
                    list: JSONdata[i].list
                  };
                } 
                if (JSONdata[i].title == "Legend") {
                  responsePackage.legend = {
                    name: `${JSONdata[i].product_name} Legend`,
                    title: JSONdata[i].title,
                    price: JSONdata[i].price,
                    oneTime: JSONdata[i].oneTime,
                    oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
                    yearOnYear: JSONdata[i].yearOnyear,
                    yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
                    list: JSONdata[i].list
                  };
                }
                
              }
            }
            if(Object.keys(responsePackage).length === 0) {
                commonData.forEach((data) => {
                         
                  if (data.title == "Pro") {
                    responsePackage.pro = {
                      name: `${data.product_name} Pro`,
                      title: data.title,
                      price: data.price,
                      oneTime: data.oneTime,
                      oneTimeDiscounted: data.oneTimeDiscounted,
                      yearOnYear: data.yearOnyear,
                      yearOnYearDiscounted: data.yearOnYearDiscounted,
                      list: data.list
                    };
                  } 
                  if (data.title == "Legend") {
                    responsePackage.legend = {
                      name: `${data.product_name} Legend`,
                      title: data.title,
                      price: data.price,
                      oneTime: data.oneTime,
                      oneTimeDiscounted: data.oneTimeDiscounted,
                      yearOnYear: data.yearOnyear,
                      yearOnYearDiscounted: data.yearOnYearDiscounted,
                      list: data.list
                    };
                  }
                });
              }


          let mailerObject = {
            pinData: product,
            user: req.user,
            targetUser: targetUser.dataValues,
            userPins: userPins,
            message:  message,
            type: 'pin now mail',
            responsePackage
          };
          await pinMail(mailerObject);
        }
       // console.log("1220>>>>>",message);
      }
    }


         
    const transDataDecision = {
      targetEmails: targetEmails.map((value) => ({
        email: value.targetEmails,
        status: targetEmailStatus[value.targetEmails] || 'pinned', // Default to 'pinned' if not set
      })),
    };

    // Determine the response message based on the status of each target email
    const responseMessage = Object.values(targetEmailStatus).includes('alreadyPinned')
      ? 'Product pinned for some users'
      : 'Product pinned for all users';

    return res.status(200).json({ message: responseMessage, data: transDataDecision });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}); */

//new changes with CTA message

const pinAPIforOthers = catchAsync(async (req, res) => {
  try {
    await Notification.sync();
    await Pin.sync();
    await newUserUnilever.sync();

    const { product_id, pinTo, message } = req.body;
    const email = req.user.email;
    const name = req.user.name;

    const targetEmailStatus = {};
    let transDataDecision = null;
    let responseMessage = [];

    for (const value of pinTo) {
      const targetUser = await newUserUnilever.findOne({
        where: {
          email: value.targetEmails,
        },
      });

      if (!targetUser) {
        // Handle the case where the target user is not found
        return res.status(404).json({ error: 'Target user not found' });
      }

      if (!value.targetEmails.endsWith('@unilever.com')) {
        return res.status(403).json({ error: 'Invalid email address' });
      }

      const product = await products.findByPk(product_id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const existingUserPin = await Notification.findOne({
        where: {
          product_id: product_id,
          pinnedByUsername: email,
          targetEmails: {
            [sequelize.Op.like]: `%${value.targetEmails}%`,
          },
        },
      });

      if (existingUserPin) {
        // Product is already pinned for this target user
        targetEmailStatus[value.targetEmails] = 'alreadyPinned';
        console.log('Target Email Status:', targetEmailStatus[value.targetEmails]);
      } else {
        const existingPin = await Notification.findOne({
          where: {
            product_id: product_id,
            pinnedByUsername: { [Op.ne]: email },
            targetEmails: JSON.stringify([value.targetEmails]),
          },
        });

        if (existingPin) {
          // Product is already pinned for this target user by someone else
          targetEmailStatus[value.targetEmails] = 'alreadyPinned';
          console.log('Target Email Status:', targetEmailStatus[value.targetEmails]);
        } else {
          // Create a new pin
          const newPin = {
            product_id: product_id,
            pinnedByUsername: email,
            pinnedById: name,
            targetEmails: value.targetEmails,
            targetUsername: '',
            date: new Date(),
            message: message,
          };
          await Notification.create(newPin);

          let userPins = 0;

          await Promise.all(
            pinTo.map(async (targetEmail) => {
              const pins = await Pin.findAll({
                where: {
                  email: targetEmail.targetEmails,
                },
                attributes: [[sequelize.fn('COUNT', sequelize.col('email')), 'pinCount']],
              });

              const Noti_pins = await Notification.findAll({
                where: {
                  targetEmails: targetEmail.targetEmails,
                },
                attributes: [[sequelize.fn('COUNT', sequelize.col('targetEmails')), 'Noti_Count']],
              });

              const combinedCounts = {};

              pins.forEach(({ targetEmails, dataValues }) => {
                combinedCounts[targetEmails] =
                  (combinedCounts[targetEmails] || 0) + dataValues.pinCount;
              });

              Noti_pins.forEach(({ targetEmails, dataValues }) => {
                combinedCounts[targetEmails] =
                  (combinedCounts[targetEmails] || 0) + dataValues.Noti_Count;
              });

              userPins = combinedCounts.undefined;
            })
          );

          const filePath = path.resolve(__dirname, '../../../buynowData.json');
          const JSONdata = require(filePath);

        let commonData = [
            {
              "product_name" : product ? product.product_title : null,
              "title" : "Pro",
              "price" : 7,
              "priceTextColor": "#00D7C4",
              "oneTime" : 30,
              "oneTimeDiscounted" : 6,
              "yearOnyear" : 10,
              "yearOnYearDiscounted" : 1,
              "list" : [ "Automation product built with 25+ HAP technologies" ]
          },
          {
              "product_name": product ? product.product_title : null,
              "title" : "Legend",
              "price" : 11,
              "priceTextColor": "#7A2D8B",
              "oneTime" : 45,
              "oneTimeDiscounted" : 9,
              "yearOnyear" : 15,
              "yearOnYearDiscounted" : 2,
              "list" : [ "Pro", "GEN-AI topup from HAP" ]
          }
        ]
          let responsePackage = {};

          for (let i in JSONdata) {
            if (product.product_id == JSONdata[i].product_id) {
              if (JSONdata[i].title == "Pro") {
                responsePackage.pro = {
                  name: `${JSONdata[i].product_name} Pro`,
                  title: JSONdata[i].title,
                  price: JSONdata[i].price,
                  oneTime: JSONdata[i].oneTime,
                  oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
                  yearOnYear: JSONdata[i].yearOnyear,
                  yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
                  list: JSONdata[i].list
                };
              }
              if (JSONdata[i].title == "Legend") {
                responsePackage.legend = {
                  name: `${JSONdata[i].product_name} Legend`,
                  title: JSONdata[i].title,
                  price: JSONdata[i].price,
                  oneTime: JSONdata[i].oneTime,
                  oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
                  yearOnYear: JSONdata[i].yearOnyear,
                  yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
                  list: JSONdata[i].list
                };
              }
            }
          }

          if (Object.keys(responsePackage).length === 0) {
            commonData.forEach((data) => {
              if (data.title == "Pro") {
                responsePackage.pro = {
                  name: `${data.product_name} Pro`,
                  title: data.title,
                  price: data.price,
                  oneTime: data.oneTime,
                  oneTimeDiscounted: data.oneTimeDiscounted,
                  yearOnYear: data.yearOnyear,
                  yearOnYearDiscounted: data.yearOnYearDiscounted,
                  list: data.list
                };
              }
              if (data.title == "Legend") {
                responsePackage.legend = {
                  name: `${data.product_name} Legend`,
                  title: data.title,
                  price: data.price,
                  oneTime: data.oneTime,
                  oneTimeDiscounted: data.oneTimeDiscounted,
                  yearOnYear: data.yearOnyear,
                  yearOnYearDiscounted: data.yearOnYearDiscounted,
                  list: data.list
                };
              }
            });
          }

          let mailerObject = {
            pinData: product,
            user: req.user,
            targetUser: targetUser.dataValues,
            userPins: userPins,
            message: message,
            type: 'pin now mail',
            responsePackage
          };
          await pinMail(mailerObject);
        }
      }

      transDataDecision = {
        targetEmails: pinTo.map((value) => ({
          email: value.targetEmails,
          status: targetEmailStatus[value.targetEmails] || 'pinned', // Default to 'pinned' if not set
        })),
      };

      const filteredMesages = targetEmailStatus[value.targetEmails] ? `Product was already pinned to ${targetUser.dataValues.name} profile page`
        : `Product pinned to ${targetUser.dataValues.name} profile page. Explore their pinned products there!`;

      responseMessage.push(filteredMesages);
    }

    return res.status(200).json({ message: responseMessage, data: transDataDecision });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

//end new changes
/*   const pinAPIforMyself = catchAsync(async (req, res) => {
  try {
    await Pin.sync();
    const product_id = req.body.product_id;
    const email = req.user.email; // Assuming you have user authentication and get the user email from the request

    // Check if the product exists
    const product = await products.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if the product is already pinned by someone else
    const existingPinByOthers = await Pin.findOne({
      where: {
        product_id: product_id,
        email: {
          [Op.ne]: email, // Exclude the current user's email
        },
      },
    });

    if (existingPinByOthers) {
      return res.status(403).json({ error: 'Product already pinned by someone else' });
    }

    // Try to find an existing pin record for the current user and product
    let pin = await Pin.findOne({
      where: {
        product_id: product_id,
        email: email,
      },
    });

    if (pin) {
      // Check your specific condition here (e.g., a field's value)
      if (pin.someField === 'someValue') {
        // Update the existing pin record
        await pin.update({
          // Define the fields you want to update here
          someField: 'newValue',
          // Add more fields to update as needed
        });

        return res.status(200).json({ message: 'Pin record updated' });
      } else {
        return res.status(200).json({ message: 'No update required' });
      }
    } else {
      // Create a new pin record since it doesn't exist
      pin = await Pin.create({
        product_id: product_id,
        email: email,
        // Set other fields as needed
      });

      return res.status(200).json({ message: 'New pin record created' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}); */

//new pinAPIformyself with CTA message

const pinAPIforMyself = catchAsync(async (req, res) => {
  try {
    await Pin.sync();
    const product_id = req.body.product_id;
    const email = req.user.email; // Assuming you have user authentication and get the user email from the request

    // Check if the product exists
    const product = await products.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if the product is already pinned by someone else
    // const existingPinByOthers = await Pin.findOne({
    //   where: {
    //     product_id: product_id,
    //     email: {
    //       [Op.ne]: email, // Exclude the current user's email
    //     },
    //   },
    // });

    // if (existingPinByOthers) {
    //   return res.status(403).json({ error: 'Product already pinned by someone else' });
    // }

    // Try to find an existing pin record for the current user and product
    let pin = await Pin.findOne({
      where: {
        product_id: product_id,
        email: email,
      },
    });

    if (pin) {
      // Check your specific condition here (e.g., a field's value)
      if (pin.someField === 'someValue') {
        // Update the existing pin record
        await pin.update({
          // Define the fields you want to update here
          someField: 'newValue',
          // Add more fields to update as needed
        });

        return res.status(200).json({ message: 'Pin record updated' });
      } 
      else {
        return res.status(200).json({ message: 'already pinned' });
      }
    } else {
      // Create a new pin record since it doesn't exist
      pin = await Pin.create({
        product_id: product_id,
        email: email,
        // Set other fields as needed
      });
      return res.status(200).json({ message: 'Product successfully pinned to your profile page. Access all your pinned products there!' });

      //return res.status(200).json({ message: 'New pin record created' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

//end new pinAPIformyself

async function getProductById(product_id) {
  try {
    const product = await products.findOne(product_id);
    if (!product) {
      return null; // Handle the case when the product doesn't exist
    }
    return {
      id: product.product_id,
      name: product.product_title,
      description: product.product_description,
      image: product.product_banner,
      function: product.catalog_products,
      cluster: product.cluster,
      productUrl: product.product_banner,
      video: product.product_video,
      documentLink: product.document_url,
      product_url: product.product_url,
      product_images: product.product_images,
      tagline: product.tagline,
    }; // Replace with the actual attribute representing the product name
  } catch (error) {
    throw error;
  }
}
const getNotifications = catchAsync(async (req, res) => {
  try {
    const userEmailOrUsername = req.user.email || req.user.username;
    // console.log("line");
    // console.log("666>>>>>>>", userEmailOrUsername);

    const notifications = await Notification.findAll({
      where: {
        targetEmails: {
          [Op.like]: `%${userEmailOrUsername}%`,
        },
      },
    });

    const notiData = notifications.map((result) => result.dataValues);
    // console.log("line 676==>>>notiDatanotiData",notiData);

    const filteredFinalData = notiData.map(async (notification) => {

      const pinnedProductName = await getProductById({
        id: notification.product_id,
        name: notification.product_title,
        description: notification.product_description,
        image: notification.product_banner,
        function: notification.catalog_products,
        cluster: notification.cluster,
        productUrl: notification.product_banner,
        video: notification.product_video,
        documentLink: notification.document_url,
        product_url: notification.product_url,
        product_images: notification.product_images,
        tagline: notification.tagline,
      });

      const filePath = path.resolve(__dirname, '../../../buynowData.json');
      const JSONdata = require(filePath);

      let commonData = [
        {
          "product_name": pinnedProductName ? pinnedProductName.name : null,
          "title" : "Pro",
          "price" : 7,
          "priceTextColor": "#00D7C4",
          "oneTime" : 30,
          "oneTimeDiscounted" : 6,
          "yearOnyear" : 10,
          "yearOnYearDiscounted" : 1,
          "list" : [ "Automation product built with 25+ HAP technologies" ]
      },
      {
          "product_name": pinnedProductName ? pinnedProductName.name : null,
          "title" : "Legend",
          "price" : 11,
          "priceTextColor": "#7A2D8B",
          "oneTime" : 45,
          "oneTimeDiscounted" : 9,
          "yearOnyear" : 15,
          "yearOnYearDiscounted" : 2,
          "list" : [ "Pro", "GEN-AI topup from HAP" ]
      }
    ]
      let responsePackage = {};

      for (let i in JSONdata) {

        if (pinnedProductName.id == JSONdata[i].product_id) {

          if (JSONdata[i].title == "Pro") {
            responsePackage.pro = {
              name: `${JSONdata[i].product_name} Pro`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          }
          if (JSONdata[i].title == "Legend") {
            responsePackage.legend = {
              name: `${JSONdata[i].product_name} Legend`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          }

        }
      }
      if (Object.keys(responsePackage).length === 0) {
        commonData.forEach((data) => {

          if (data.title == "Pro") {
            responsePackage.pro = {
              name: `${data.product_name} Pro`,
              title: data.title,
              price: data.price,
              oneTime: data.oneTime,
              oneTimeDiscounted: data.oneTimeDiscounted,
              yearOnYear: data.yearOnyear,
              yearOnYearDiscounted: data.yearOnYearDiscounted,
              list: data.list
            };
          }
          if (data.title == "Legend") {
            responsePackage.legend = {
              name: `${data.product_name} Legend`,
              title: data.title,
              price: data.price,
              oneTime: data.oneTime,
              oneTimeDiscounted: data.oneTimeDiscounted,
              yearOnYear: data.yearOnyear,
              yearOnYearDiscounted: data.yearOnYearDiscounted,
              list: data.list
            };
          }
        });
      }

      return {
        id: notification.id,
        pinnedProductName: pinnedProductName,
        packages: responsePackage,
        pinnedBy: {
          username: notification.pinnedByUsername,
          id: notification.pinnedById,
        },
        date: notification.createdAt,
      };
    });

    const response = await Promise.all(filteredFinalData);
    // console.log("680>>>>>>>", response);

    res.status(200).json(response);
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});

const likeUnlikeAPI = catchAsync(async (req, res) => {
  const { product_id } = req.body;
  const email = req.user.email;

  try {
    await products.sync();
    const product = await products.findByPk(product_id); // Assuming you have defined Product model
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    await hitCounts.sync();
    const hitCount = await hitCounts.findOne({ where: { email }, defaults: { email } });
    console.log('357>>>>>', hitCount);
    const existingLike = await hitCounts.findOne({ where: { email }, defaults: { email } });

    if (existingLike) {
      // User already liked the product, so unlike it
      await existingLike.destroy();
      await hitCount.decrement('count');
      res.status(200).json({ message: 'Product unliked successfully.' });
    } else {
      // User has not liked the product, so like it
      const newLike = await hitCounts.create({
        email: email,
      });
      const hitCount = await hitCounts.findOne({ where: { email }, defaults: { email } });
      console.log('357>>>>>', hitCount);
      await hitCount.increment('count');
      res.status(201).json({ message: 'Product liked successfully.' });
      await BotUser.User.sync();
      const findemail = await BotUser.User.findByPk(email);
      if (!findemail) {
        res.send(new ResponseObject(201, 'email doesnot exist', true, findemail));
      }
    }
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});

const ratingAPI = catchAsync(async (req, res) => {
  const email = req.user.email;
  const { product_id, ratings } = req.body;

  try {
    await products.sync();
    await Ratings.sync();
    let existingRating = await Ratings.findOne({
      where: { product_id: product_id, email: email },
    });

    if (!existingRating) {
      await Ratings.create({ ratings: ratings, email: email, product_id: product_id });
      res.status(200).json({
        message: `you rated the product ${product_id} is ${ratings}`,
        data: { ratings: ratings.split(',').map(parseFloat) },
      });
    } else {
      await existingRating.update({ ratings: ratings });
      res.status(200).json({
        message: `rating updated and your new rating is ${ratings}`,
        data: { ratings: ratings.split(',').map(parseFloat) },
      });
    }
    //res.status(200).json({ data: { ratings: ratings.split(',').map(parseFloat) } });
  } catch (e) {
    console.log('Error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const getAverageRating = catchAsync(async (req, res) => {
  const { product_id } = req.query;

  try {
    const product = await products.findOne({ where: { product_id } });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const productRatings = await Ratings.findAll({ where: { product_id } });

    if (productRatings.length === 0) {
      return res.status(200).json({ data: { averageRating: 0 } });
    }

    const totalRating = productRatings.reduce((acc, currentValue) => acc + currentValue.ratings, 0);
    const averageRating = totalRating / productRatings.length;

    const [averRatingInstance, created] = await averRating.findOrCreate({
      where: { product_id },
      defaults: {
        roundedAverageRating: averageRating,
        catalog_products: product.dataValues.catalog_products,
      },
    });

    if (!created) {
      await averRatingInstance.update({ roundedAverageRating: averageRating });
    }

    res.status(200).json({ data: { averageRating: averageRating.toFixed(1) } });
  } catch (e) {
    console.log('Error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const getUserProfile = catchAsync(async (req, res) => {
  try {
    const userEmail = req.query.email;
    const email = req.user.email;
    console.log('line 1007==>>', email);
    if (userEmail && !userEmail.endsWith('@unilever.com')) {
      return res.status(403).json({ error: 'Invalid email address' });
    }

    const finalEmail = userEmail || email;

    // Retrieve the user's profile information
    const user = await newUserUnilever.findOne({ where: { email: finalEmail } });
    const userPins = await Pin.findAll({ where: { email: finalEmail } });
    console.log('line 1014==>>', userPins);

    const notificationPinnedBy = await Notification.findAll({
      where: {
        targetEmails: {
          [Op.like]: `%${finalEmail}%`,
        },
      },
    });

    const emailData = notificationPinnedBy.map((result) => result.dataValues);

    const pinnedProductIds = new Set(userPins.map((pin) => pin.product_id));
    const formattedUserPins = [];
    for (const pin of userPins) {
      const product = await products.findOne({ where: { product_id: pin.product_id } });
      const filePath = path.resolve(__dirname, '../../../buynowData.json');
          const JSONdata = require(filePath);

          let commonData = [
            {
              "product_name": product ? product.product_title : null,
              "title" : "Pro",
              "price" : 7,
              "priceTextColor": "#00D7C4",
              "oneTime" : 30,
              "oneTimeDiscounted" : 6,
              "yearOnyear" : 10,
              "yearOnYearDiscounted" : 1,
              "list" : [ "Automation product built with 25+ HAP technologies" ]
          },
          {
              "product_name": product ? product.product_title : null,
              "title" : "Legend",
              "price" : 11,
              "priceTextColor": "#7A2D8B",
              "oneTime" : 45,
              "oneTimeDiscounted" : 9,
              "yearOnyear" : 15,
              "yearOnYearDiscounted" : 2,
              "list" : [ "Pro", "GEN-AI topup from HAP" ]
          }
        ]
          let responsePackage = {};

          for (let i in JSONdata) {

            if (product.product_id == JSONdata[i].product_id) {

              if (JSONdata[i].title == "Pro") {
                responsePackage.pro = {
                  name: `${JSONdata[i].product_name} Pro`,
                  title: JSONdata[i].title,
                  price: JSONdata[i].price,
                  oneTime: JSONdata[i].oneTime,
                  oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
                  yearOnYear: JSONdata[i].yearOnyear,
                  yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
                  list: JSONdata[i].list
                };
              }
              if (JSONdata[i].title == "Legend") {
                responsePackage.legend = {
                  name: `${JSONdata[i].product_name} Legend`,
                  title: JSONdata[i].title,
                  price: JSONdata[i].price,
                  oneTime: JSONdata[i].oneTime,
                  oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
                  yearOnYear: JSONdata[i].yearOnyear,
                  yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
                  list: JSONdata[i].list
                };
              }

            }
          }
          if (Object.keys(responsePackage).length === 0) {
            commonData.forEach((data) => {

              if (data.title == "Pro") {
                responsePackage.pro = {
                  name: `${data.product_name} Pro`,
                  title: data.title,
                  price: data.price,
                  oneTime: data.oneTime,
                  oneTimeDiscounted: data.oneTimeDiscounted,
                  yearOnYear: data.yearOnyear,
                  yearOnYearDiscounted: data.yearOnYearDiscounted,
                  list: data.list
                };
              }
              if (data.title == "Legend") {
                responsePackage.legend = {
                  name: `${data.product_name} Legend`,
                  title: data.title,
                  price: data.price,
                  oneTime: data.oneTime,
                  oneTimeDiscounted: data.oneTimeDiscounted,
                  yearOnYear: data.yearOnyear,
                  yearOnYearDiscounted: data.yearOnYearDiscounted,
                  list: data.list
                };
              }
            });
          }
      if (product) {
        formattedUserPins.push({
          id: pin.product_id,
          name: product.product_title,
          description: product.product_description,
          image: product.product_banner,
          isPinned: pinnedProductIds.has(product.product_id) ? 1 : 0, // User's pins are always pinned
          function: product.catalog_products,
          cluster: product.cluster,
          video: product.product_video,
          product_url: product.product_url,
          product_images: product.product_images,
          packages: responsePackage
        });
      }
    }

    // Filter out deleted pins from otherPins
    const formattedOtherPins = [];
    for (const notification of emailData) {
      const product = await products.findOne({ where: { product_id: notification.product_id } });
      const filePath = path.resolve(__dirname, '../../../buynowData.json');
          const JSONdata = require(filePath);

          let commonData = [
            {
              "product_name": product ? product.product_title : null,
              "title" : "Pro",
              "price" : 7,
              "priceTextColor": "#00D7C4",
              "oneTime" : 30,
              "oneTimeDiscounted" : 6,
              "yearOnyear" : 10,
              "yearOnYearDiscounted" : 1,
              "list" : [ "Automation product built with 25+ HAP technologies" ]
          },
          {
              "product_name": product ? product.product_title : null,
              "title" : "Legend",
              "price" : 11,
              "priceTextColor": "#7A2D8B",
              "oneTime" : 45,
              "oneTimeDiscounted" : 9,
              "yearOnyear" : 15,
              "yearOnYearDiscounted" : 2,
              "list" : [ "Pro", "GEN-AI topup from HAP" ]
          }
        ]
          let responsePackage = {};

          for (let i in JSONdata) {

            if (product.product_id == JSONdata[i].product_id) {

              if (JSONdata[i].title == "Pro") {
                responsePackage.pro = {
                  name: `${JSONdata[i].product_name} Pro`,
                  title: JSONdata[i].title,
                  price: JSONdata[i].price,
                  oneTime: JSONdata[i].oneTime,
                  oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
                  yearOnYear: JSONdata[i].yearOnyear,
                  yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
                  list: JSONdata[i].list
                };
              }
              if (JSONdata[i].title == "Legend") {
                responsePackage.legend = {
                  name: `${JSONdata[i].product_name} Legend`,
                  title: JSONdata[i].title,
                  price: JSONdata[i].price,
                  oneTime: JSONdata[i].oneTime,
                  oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
                  yearOnYear: JSONdata[i].yearOnyear,
                  yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
                  list: JSONdata[i].list
                };
              }

            }
          }
          if (Object.keys(responsePackage).length === 0) {
            commonData.forEach((data) => {

              if (data.title == "Pro") {
                responsePackage.pro = {
                  name: `${data.product_name} Pro`,
                  title: data.title,
                  price: data.price,
                  oneTime: data.oneTime,
                  oneTimeDiscounted: data.oneTimeDiscounted,
                  yearOnYear: data.yearOnyear,
                  yearOnYearDiscounted: data.yearOnYearDiscounted,
                  list: data.list
                };
              }
              if (data.title == "Legend") {
                responsePackage.legend = {
                  name: `${data.product_name} Legend`,
                  title: data.title,
                  price: data.price,
                  oneTime: data.oneTime,
                  oneTimeDiscounted: data.oneTimeDiscounted,
                  yearOnYear: data.yearOnyear,
                  yearOnYearDiscounted: data.yearOnYearDiscounted,
                  list: data.list
                };
              }
            });
          }
      if (product) {
        formattedOtherPins.push({
          id: notification.product_id,
          name: product.product_title,
          description: product.product_description,
          image: product.product_banner,
          isPinned: pinnedProductIds.has(product.product_id) ? 1 : 0, // Since these are other users' pins, they are always pinned
          function: product.catalog_products,
          cluster: product.cluster,

          video: product.product_video,
          documentLink: product.document_url,
          product_url: product.product_url,
          product_images: product.product_images,
          packages: responsePackage,
          pinnedBy: {
            email: notification.pinnedByUsername || 'Unknown',
            name: notification.pinnedById || 'Unknown',
          },
        });
      }
    }

    // Create the response object
    const response = {
      username: user.name,
      profilePic: user.image,
      email: user.email,
      myPins: formattedUserPins,
      otherPins: formattedOtherPins,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/*  const unPin = catchAsync(async (req, res) => {
  try {
    const product_id = req.query.product_id;
    const email = req.user.email;

    // Delete pins from Pin table
    let productDeleteResponse = await Pin.destroy({
      where: {
        product_id,
        email: email,
      },
    });

    console.log('line 964==>>', productDeleteResponse);

    // Delete pins from Notification table where the logged-in user has pinned someone else
    let notificationDeleteResponse = await Notification.destroy({
      where: {
        product_id,
        pinnedByUsername: { [Op.not]: email }, // Exclude notifications where the email is the logged-in user's email (notifications pinned by the logged-in user)
      },
    });
    console.log('line 973==>>>', notificationDeleteResponse);
    let productDeleteMessage = '';
    if (notificationDeleteResponse > 0) {
      productDeleteMessage = 'unPin successfully';
    } else {
      productDeleteMessage = 'Already unPin';
    }

    res.json({
      status: true,
      message: productDeleteMessage,
      productDeleteResponse,
      notificationDeleteResponse,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}); */

//new unpin CTA message
const unPin = catchAsync(async (req, res) => {
  try {
    const product_id = req.query.product_id;
    const email = req.user.email;

    // Delete pins from Pin table
    let productDeleteResponse = await Pin.destroy({
      where: {
        product_id,
        email: email,
      },
    });

    console.log('line 964==>>', productDeleteResponse);

    // Delete pins from Notification table where the logged-in user has pinned someone else
    let notificationDeleteResponse = await Notification.destroy({
      where: {
        product_id,
        pinnedByUsername: { [Op.not]: email }, // Exclude notifications where the email is the logged-in user's email (notifications pinned by the logged-in user)
      },
    });
    console.log('line 973==>>>', notificationDeleteResponse);
    let productDeleteMessage = '';
    if (notificationDeleteResponse > 0) {
      productDeleteMessage = 'Product successfully unpinned from your profile';
    } 
    // else {
    //   productDeleteMessage = 'This product is already unpinned from your profile';
    // }
    // if (notificationDeleteResponse > 0) {
    //   productDeleteMessage = 'unPin successfully';
    // } else {
    //   productDeleteMessage = 'Already unPin';
    // }

    res.json({
      status: true,
      message: productDeleteMessage,
      productDeleteResponse,
      notificationDeleteResponse,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
  
});


const getAllProducts = catchAsync(async (req, res) => {
  try {
    const cluster = req.query.cluster ? req.query.cluster.split(',') : [];
    const catalogProducts = req.query.catalog_products ? req.query.catalog_products.split(',') : [];
    const okr = req.query.OKR ? req.query.OKR.split(',') : [];

    const whereClause = {};

    if (cluster.length > 0) {
      whereClause.cluster = {
        [sequelize.Op.in]: cluster,
      };
    }

    if (catalogProducts.length > 0) {
      whereClause.catalog_products = {
        [sequelize.Op.in]: catalogProducts,
      };
    }

    if (okr.length > 0) {
      whereClause.OKR = {
        [sequelize.Op.in]: okr,
      };
    }

    let resultData;

    if (Object.keys(whereClause).length === 0) {
      // No filters provided, fetch all products
      resultData = await products.findAll();
    } else {
      // Filters are provided, apply them
      resultData = await products.findAll({
        where: whereClause,
      });
    }

    // Check if any products were found
    if (resultData.length === 0) {
      return res.status(200).json({
        message: `No products found with specified filters`,
        response: [],
      });
    }

    // Map and format the data

    const catalogData = await Promise.all(
      resultData.map(async (result) => {
        const product = result.dataValues;

        const rating = await averRating.findOne({
          where: {
            product_id: product.product_id,
          },
          attributes: ['roundedAverageRating'],
          order: [['roundedAverageRating', 'DESC']],
        });


      const filePath = path.resolve(__dirname, '../../../buynowData.json');
      const JSONdata = require(filePath);

      let commonData = [
        {
          "product_name": product ? product.product_title : null,
          "title" : "Pro",
          "price" : 7,
          "priceTextColor": "#00D7C4",
          "oneTime" : 30,
          "oneTimeDiscounted" : 6,
          "yearOnyear" : 10,
          "yearOnYearDiscounted" : 1,
          "list" : [ "Automation product built with 25+ HAP technologies" ]
      },
      {
          "product_name": product ? product.product_title : null,
          "title" : "Legend",
          "price" : 11,
          "priceTextColor": "#7A2D8B",
          "oneTime" : 45,
          "oneTimeDiscounted" : 9,
          "yearOnyear" : 15,
          "yearOnYearDiscounted" : 2,
          "list" : [ "Pro", "GEN-AI topup from HAP" ]
      }
    ]
    let responsePackage = {};

      for (let i in JSONdata) {

        if(product.product_id == JSONdata[i].product_id) {

          if (JSONdata[i].title == "Pro") {
            responsePackage.pro = {
              name: `${JSONdata[i].product_name} Pro`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          } 
          if (JSONdata[i].title == "Legend") {
            responsePackage.legend = {
              name: `${JSONdata[i].product_name} Legend`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          }
          
        }
      }
      if(Object.keys(responsePackage).length === 0) {
          commonData.forEach((data) => {
                   
            if (data.title == "Pro") {
              responsePackage.pro = {
                name: `${data.product_name} Pro`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            } 
            if (data.title == "Legend") {
              responsePackage.legend = {
                name: `${data.product_name} Legend`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            }
          });
        }

        return {
          id: product.product_id,
          name: product.product_title,
          description: product.product_description,
          image: product.product_banner,
          function: product.catalog_products,
          cluster: product.cluster,
          productUrl: product.product_banner,
          video: product.product_video,
          documentLink: product.document_url,
          product_url: product.product_url,
          product_images: product.product_images,
          OKR: product.OKR,
          rating: rating ? rating.dataValues.roundedAverageRating : null,
          packages: responsePackage
        };
      })
    );

    // Sort the catalogData by rating

    // catalogData.sort((a, b) => {
    //   const ratingA = a.rating;
    //   const ratingB = b.rating;

    //   if (ratingA === null && ratingB === null) {
    //     return 0;
    //   }

    //   if (ratingA === null) {
    //     return -1;
    //   }

    //   if (ratingB === null) {
    //     return -1;
    //   }
    //   return ratingB > ratingA ? 1 : ratingB < ratingA ? -1 : 0;
    // });

    // catalogData.sort((a, b) => {
    //   const ratingA = a.rating || 0; // Treat null as 0 for sorting
    //   const ratingB = b.rating || 0;

    //   return ratingB - ratingA;
    // });

    // Now sortedCatalogData contains the sorted catalogData array based on the 'rating'

    // Sort the catalogData by name
    // catalogData.sort((a, b) => {
    //   const nameA = (a.name || '').charAt(0).toUpperCase();
    //   const nameB = (b.name || '').charAt(0).toUpperCase();

    //   if (nameA < nameB) {
    //     return -1;
    //   }
    //   if (nameA > nameB) {
    //     return 1;
    //   }
    //   return 0;
    // });

    catalogData.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;

      // First, compare by rating in descending order
      const ratingComparison = ratingB - ratingA;

      // If ratings are equal, then compare by name
      if (ratingComparison === 0) {
        const nameA = (a.name || '').toUpperCase();
        const nameB = (b.name || '').toUpperCase();

        return nameA.localeCompare(nameB);
      }

      return ratingComparison;
    });

    res.status(200).json({
      response: catalogData,
    });
  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const getProductsByTagline = catchAsync(async (req, res) => {
  try {
    const resultData = await products.findAll({}); // Assuming you have a model named 'products'

    // Create an object to store products grouped by tagline
    const productGroups = {};

    // Iterate through the resultData and group products by tagline
    await Promise.all(resultData.map(async (result) => {
      const product = result.dataValues;
      // If the tagline is not already a key in productGroups, create it
      if (product.tagline !== null && product.tagline !== undefined) {
        if (!productGroups[product.tagline]) {
          // Check if the tagline is 'fastest' or 'smartest'
          const heading = ['fastest', 'smartest'].includes(product.tagline)
            ? `Building the ${product.tagline} Unilever yet!`
            : `Building the most ${product.tagline} Unilever yet!`;

          productGroups[product.tagline] = {
            heading: heading,
            products: [],
          };
        }
        // Fetch the rating for the current product
        const rating = await averRating.findOne({
          where: {
            product_id: product.product_id,
          },
          attributes: ['roundedAverageRating'],
          order: [['roundedAverageRating', 'DESC']],
        });


      const filePath = path.resolve(__dirname, '../../../buynowData.json');
      const JSONdata = require(filePath);

      let commonData = [
        {
          "product_name": product ? product.product_title : null,
          "title" : "Pro",
          "price" : 7,
          "priceTextColor": "#00D7C4",
          "oneTime" : 30,
          "oneTimeDiscounted" : 6,
          "yearOnyear" : 10,
          "yearOnYearDiscounted" : 1,
          "list" : [ "Automation product built with 25+ HAP technologies" ]
      },
      {
          "product_name": product ? product.product_title : null,
          "title" : "Legend",
          "price" : 11,
          "priceTextColor": "#7A2D8B",
          "oneTime" : 45,
          "oneTimeDiscounted" : 9,
          "yearOnyear" : 15,
          "yearOnYearDiscounted" : 2,
          "list" : [ "Pro", "GEN-AI topup from HAP" ]
      }
    ]
    let responsePackage = {};

      for (let i in JSONdata) {

        if(product.product_id == JSONdata[i].product_id) {

          if (JSONdata[i].title == "Pro") {
            responsePackage.pro = {
              name: `${JSONdata[i].product_name} Pro`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          } 
          if (JSONdata[i].title == "Legend") {
            responsePackage.legend = {
              name: `${JSONdata[i].product_name} Legend`,
              title: JSONdata[i].title,
              price: JSONdata[i].price,
              oneTime: JSONdata[i].oneTime,
              oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
              yearOnYear: JSONdata[i].yearOnyear,
              yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
              list: JSONdata[i].list
            };
          }
          
        }
      }
      if(Object.keys(responsePackage).length === 0) {
          commonData.forEach((data) => {
                   
            if (data.title == "Pro") {
              responsePackage.pro = {
                name: `${data.product_name} Pro`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            } 
            if (data.title == "Legend") {
              responsePackage.legend = {
                name: `${data.product_name} Legend`,
                title: data.title,
                price: data.price,
                oneTime: data.oneTime,
                oneTimeDiscounted: data.oneTimeDiscounted,
                yearOnYear: data.yearOnyear,
                yearOnYearDiscounted: data.yearOnYearDiscounted,
                list: data.list
              };
            }
          });
        }


        // Add the product to the appropriate tagline group
        productGroups[product.tagline].products.push({
          id: product.product_id,
          name: product.product_title,
          description: product.product_description,
          image: product.product_banner,
          function: product.catalog_products,
          cluster: product.cluster,
          productUrl: product.product_banner,
          video: product.product_video,
          documentLink: product.document_url,
          product_url: product.product_url,
          product_images: product.product_images,
          tagline: product.tagline,
          rating: rating ? rating.dataValues.roundedAverageRating : null,
          packages: responsePackage
        });
      }
    }));

    // Convert the productGroups object into an array of values
    const catalogData = Object.values(productGroups);
    catalogData.forEach(group => {
      group.products.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });
    });
    
    // Sort the catalogData by the highest rating within each group
    catalogData.sort((a, b) => {
      const highestRatingA = a.products[0]?.rating || 0;
      const highestRatingB = b.products[0]?.rating || 0;
      return highestRatingB - highestRatingA;
    });
    // catalogData.sort((a, b) => {
    //   const ratingA = a.products.reduce((total, product) => (total + (product.rating || 0)), 0) / a.products.length;
    //   const ratingB = b.products.reduce((total, product) => (total + (product.rating || 0)), 0) / b.products.length;
      
    //   return ratingB - ratingA;
    // });
    

    res.status(200).json(catalogData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const getProductsByPins = catchAsync(async (req, res) => {
  try {
    
    await Pin.sync();
    await Notification.sync();

    const pins = await Pin.findAll({
      attributes: ['product_id', [sequelize.fn('COUNT', sequelize.col('product_id')), 'pinCount']],
      group: ['product_id'],
      order: [[sequelize.literal('pinCount'), 'DESC']],
    });

    const Noti_pins = await Notification.findAll({
      attributes: [
        'product_id',
        [sequelize.fn('COUNT', sequelize.col('product_id')), 'Noti_Count'],
      ],
      group: ['product_id'],
      order: [[sequelize.literal('Noti_Count'), 'DESC']],
      });

    const combinedCounts = {};

    // Populate the dictionary with counts from pins
    pins.forEach(({ product_id, dataValues }) => {
      combinedCounts[product_id] = (combinedCounts[product_id] || 0) + dataValues.pinCount;
    });

    // Populate the dictionary with counts from Noti_pins
    Noti_pins.forEach(({ product_id, dataValues }) => {
      combinedCounts[product_id] = (combinedCounts[product_id] || 0) + dataValues.Noti_Count;
    });

    // Convert the dictionary to an array of objects
    const resultArray = Object.entries(combinedCounts).map(([product_id, count]) => ({
      product_id,
      count,
    }));

    // Sort the resultArray in decreasing order based on count
    resultArray.sort((a, b) => b.count - a.count);

    // Extract the sorted product_id values into a final result array
    const finalResult = resultArray.map((entry) => entry.product_id);

    let allProducts = [];

    // Use Promise.all to wait for all asynchronous queries to complete
    await Promise.all(
      finalResult.map(async (p_id) => {
        try {
          const product = await products.findByPk(p_id);
          const filePath = path.resolve(__dirname, '../../../buynowData.json');
          const JSONdata = require(filePath);

          let commonData = [
            {
              "product_name": product ? product.product_title : null,
              "title" : "Pro",
              "price" : 7,
              "priceTextColor": "#00D7C4",
              "oneTime" : 30,
              "oneTimeDiscounted" : 6,
              "yearOnyear" : 10,
              "yearOnYearDiscounted" : 1,
              "list" : [ "Automation product built with 25+ HAP technologies" ]
          },
          {
              "product_name": product ? product.product_title : null,
              "title" : "Legend",
              "price" : 11,
              "priceTextColor": "#7A2D8B",
              "oneTime" : 45,
              "oneTimeDiscounted" : 9,
              "yearOnyear" : 15,
              "yearOnYearDiscounted" : 2,
              "list" : [ "Pro", "GEN-AI topup from HAP" ]
          }
        ]
          let responsePackage = {};

          for (let i in JSONdata) {

            if (product.product_id == JSONdata[i].product_id) {

              if (JSONdata[i].title == "Pro") {
                responsePackage.pro = {
                  name: `${JSONdata[i].product_name} Pro`,
                  title: JSONdata[i].title,
                  price: JSONdata[i].price,
                  oneTime: JSONdata[i].oneTime,
                  oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
                  yearOnYear: JSONdata[i].yearOnyear,
                  yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
                  list: JSONdata[i].list
                };
              }
              if (JSONdata[i].title == "Legend") {
                responsePackage.legend = {
                  name: `${JSONdata[i].product_name} Legend`,
                  title: JSONdata[i].title,
                  price: JSONdata[i].price,
                  oneTime: JSONdata[i].oneTime,
                  oneTimeDiscounted: JSONdata[i].oneTimeDiscounted,
                  yearOnYear: JSONdata[i].yearOnyear,
                  yearOnYearDiscounted: JSONdata[i].yearOnYearDiscounted,
                  list: JSONdata[i].list
                };
              }

            }
          }
          if (Object.keys(responsePackage).length === 0) {
            commonData.forEach((data) => {

              if (data.title == "Pro") {
                responsePackage.pro = {
                  name: `${data.product_name} Pro`,
                  title: data.title,
                  price: data.price,
                  oneTime: data.oneTime,
                  oneTimeDiscounted: data.oneTimeDiscounted,
                  yearOnYear: data.yearOnyear,
                  yearOnYearDiscounted: data.yearOnYearDiscounted,
                  list: data.list
                };
              }
              if (data.title == "Legend") {
                responsePackage.legend = {
                  name: `${data.product_name} Legend`,
                  title: data.title,
                  price: data.price,
                  oneTime: data.oneTime,
                  oneTimeDiscounted: data.oneTimeDiscounted,
                  yearOnYear: data.yearOnyear,
                  yearOnYearDiscounted: data.yearOnYearDiscounted,
                  list: data.list
                };
              }
            });
          }
          allProducts.push({
            id: product.product_id,
            name: product.product_title,
            description: product.product_description,
            image: product.product_banner,
            function: product.catalog_products,
            cluster: product.cluster,
            productUrl: product.product_banner,
            video: product.product_video,
            documentLink: product.document_url,
            product_url: product.product_url,
            product_images: product.product_images,
            tagline: product.tagline,
            packages: responsePackage

          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ status: 'fail', error: err });
        }
      })
    );

    return res.status(200).json({ status: 'success', data: allProducts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const getRatingByUser = catchAsync(async (req, res) => {
  const email = req.user.email;
  const { product_id } = req.query;

  try {
    await products.sync();
    await Ratings.sync();

    let response = [];

    const updatedUserRatings = await Ratings.findAll({
      where: { email, product_id },
      attributes: ['product_id', 'ratings'],
    });

    if (updatedUserRatings.length == 0) {
      return res
        .status(200)
        .json({ data: response, message: 'You have not rated this product yet' });
    } else {
      await Promise.all(
        updatedUserRatings.map(async (updatedUserRating) => {
          response.push(updatedUserRating.dataValues);
        })
      );
      return res.status(200).json({ data: response });
    }
  } catch (e) {
    console.log('error = ', e);
    return res.status(500).json({ error: e });
  }
});

export default {
  getAverageRatings,
  getProductById,
  getclusterFunctionData,
  getAllUsers,
  getStaticFinanceData,
  getStaticSupplyChainData,
  getNewProductDateWise,
  manHoursSaved,
  buyNowDataAPI,
  commentAPI,
  getAllLike,
  getAllComments,
  shareAPI,
  pinAPIforMyself,
  pinAPIforOthers,
  getNotifications,
  likeUnlikeAPI,
  // deletePin,
  ratingAPI,
  getAverageRating,
  getUserProfile,
  // productStatus,
  getFunctionData,
  unPin,
  getAllProducts,
  //productAddTagLine,
  getProductsByTagline,
  getProductsByPins,
  getRatingByUser,
};

