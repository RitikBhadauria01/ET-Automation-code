import { DataTypes, Model } from 'sequelize';
import sequelize from '../helpers/Sequalize';


class AzureFolderNames extends Model {}
// initalize
AzureFolderNames.init(
  {
    
    
    folderName: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: 'AzureFolderNames',
    timestamps: false,
  }
);
export default AzureFolderNames;
