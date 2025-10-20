import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class UserProfile extends Model {}

UserProfile.init({
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
        field: 'user_id'
    },
    age: {
        type: DataTypes.INTEGER,
        validate: {
        min: { args: 18, msg: 'Must be at least 18 years old' },
        max: { args: 100, msg: 'Invalid age' }
        }
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        validate: {
        isIn: {
            args: [['male', 'female', 'other', 'prefer_not_to_say']],
            msg: 'Invalid gender option'
        }
        }
    },
    bio: {
        type: DataTypes.TEXT,
        validate: {
        len: {
            args: [0, 500],
            msg: 'Bio cannot exceed 500 characters'
        }
        }
    },
    smoking: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    pets: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    music: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    chatty: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    rating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: null,     //changed from 5.0 to null
        allowNull: true,        //allow null for new users
        validate: {
        min: { args: 0, msg: 'Rating cannot be less than 0' },
        max: { args: 5, msg: 'Rating cannot be more than 5' }
        }
    },
    total_rides: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_rides'
    }
    }, {
    sequelize,
    modelName: 'UserProfile',
    tableName: 'user_profiles',
    indexes: [
        { fields: ['user_id'] }
    ]
});

export default UserProfile;