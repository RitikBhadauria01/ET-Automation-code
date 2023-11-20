import { DataTypes } from 'sequelize';
import sequelize from '../helpers/Sequalize';

const InvoiceForm = sequelize.define(
  'invoiceforms',
  {
    businessApprover: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    costCenter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    toCostCenter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    glAccount: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    toCompanyCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    countryCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
  }
);
export default InvoiceForm;
 
