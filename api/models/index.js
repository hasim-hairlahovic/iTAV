const { DataTypes } = require('sequelize');

let MembershipData, CallData, HeadcountData, ForecastScenario, User;

function initModels(sequelize) {
  // MembershipData model
  MembershipData = sequelize.define('MembershipData', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    segment: {
      type: DataTypes.STRING,
      allowNull: false
    },
    total_customers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    new_customers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    churned_customers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'membership_data',
    timestamps: true
  });

  // CallData model
  CallData = sequelize.define('CallData', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    call_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    total_calls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    resolution_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    avg_handle_time: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    customer_satisfaction: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'call_data',
    timestamps: true
  });

  // HeadcountData model
  HeadcountData = sequelize.define('HeadcountData', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false
    },
    total_staff: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    active_staff: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    utilization_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'headcount_data',
    timestamps: true
  });

  // ForecastScenario model
  ForecastScenario = sequelize.define('ForecastScenario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    forecast_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    predicted_members: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    predicted_calls: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    confidence_level: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    scenario_type: {
      type: DataTypes.ENUM('optimistic', 'realistic', 'pessimistic'),
      allowNull: false,
      defaultValue: 'realistic'
    }
  }, {
    tableName: 'forecast_scenarios',
    timestamps: true
  });

  // User model for authentication
  User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'viewer'),
      allowNull: false,
      defaultValue: 'user'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  return {
    MembershipData,
    CallData,
    HeadcountData,
    ForecastScenario,
    User
  };
}

module.exports = {
  initModels,
  getMembershipData: () => MembershipData,
  getCallData: () => CallData,
  getHeadcountData: () => HeadcountData,
  getForecastScenario: () => ForecastScenario,
  getUser: () => User
}; 