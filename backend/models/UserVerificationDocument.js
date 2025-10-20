import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class UserVerificationDocument extends Model {
  async approve(adminId) {
    return this.update({
      verification_status: 'approved',
      verified_by: adminId,
      verified_at: new Date()
    });
  }

  async reject(adminId, reason) {
    return this.update({
      verification_status: 'rejected',
      verified_by: adminId,
      verified_at: new Date(),
      rejection_reason: reason
    });
  }
}

UserVerificationDocument.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id',
    onDelete: 'CASCADE'
  },
  document_type: {
    type: DataTypes.ENUM('government_id', 'driving_license', 'vehicle_registration', 'insurance'),
    allowNull: false,
    field: 'document_type',
    validate: {
      isIn: {
        args: [['government_id', 'driving_license', 'vehicle_registration', 'insurance']],
        msg: 'Invalid document type'
      }
    }
  },
  document_url: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'document_url',
    validate: {
      isUrl: { msg: 'Invalid document URL' }
    }
  },
  document_number: {
    type: DataTypes.STRING(50),
    field: 'document_number'
  },
  verification_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    field: 'verification_status'
  },
  verified_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'verified_by'
  },
  verified_at: {
    type: DataTypes.DATE,
    field: 'verified_at'
  },
  rejection_reason: {
    type: DataTypes.STRING(200),
    field: 'rejection_reason'
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'submitted_at'
  }
}, {
  sequelize,
  modelName: 'UserVerificationDocument',
  tableName: 'user_verification_documents',
  indexes: [
    { fields: ['user_id', 'verification_status'] },
    { fields: ['document_type'] }
  ]
});

export default UserVerificationDocument;