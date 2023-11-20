// import sequelize from "../helpers/Sequalize";
import { DataTypes, Model } from "sequelize";
import sequelize from '../helpers/Sequalize';
// import BotUser from "./BotUser";

const products = sequelize.define('products', {
  
    product_id : {
        type: DataTypes.INTEGER,    
        primaryKey: true,
        autoIncrement: true
    },
    lead_platform: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    cluster: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    country: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    catalog_products: {
        type: DataTypes.CHAR(40),
        allowNull: true,
    },
    product_status: {
        type: DataTypes.CHAR(100),
        allowNull: true,
    },
    subarea: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    product_title: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    clusters_live: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    product_caption: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
product_description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    product_icon: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    hrs_saved: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    hrs_saved_text: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    product_banner: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    product_video: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    process_caption: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    area: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
isDocument: {
              // rpa specific
              type: DataTypes.BOOLEAN,
              allowNull: true,
            },
            document_url: {
              type: DataTypes.TEXT,
              allowNull: true
          },
         product_url:{
        type: DataTypes.TEXT,
        allowNull: true
      },
      product_images:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pid: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      tagline:{
        type: DataTypes.TEXT,
        allowNull: true
      },
      OKR : {
        type: DataTypes.STRING,
        allowNull: true
      } 

},
{
    sequelize,
    timestamps:true,
    createdAt:true,
    updatedAt: true
  })
module.exports = products;
