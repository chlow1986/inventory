const { Sequelize, DataTypes } = require('sequelize');

class SequelizeModel {
  constructor() {
    this.database = null;
  }

  async connect(){
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite'
    });

    /*
      User Model
      Required: firstName, email, password
      Unique: email
     */
    const User = sequelize.define('User', {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      salt: {
        type: DataTypes.TEXT
      }
    }, {
    });


    /*
      Product Model
      Required: code, name, price
     */
    const Product = sequelize.define('Product', {
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT
      },
      price: {
        type: DataTypes.DOUBLE,
        allowNull: false
      }
    }, {
    });


    /*
      Warehouse Model
      Required: name, address
     */
    const Warehouse = sequelize.define('Warehouse', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    }, {
    });

    /*
      Stock Model
      Required: WarehouseId, ProductId, qty
    */
    const Stock = sequelize.define('Stock', {
      qty: {
        type: DataTypes.DOUBLE,
        allowNull: false
      }
    }, {
    });

    Warehouse.belongsToMany(Product, { through: Stock, onDelete: 'cascade' });
    Product.belongsToMany(Warehouse, { through: Stock, onDelete: 'cascade' });

    try {
      await sequelize.authenticate();
      console.log('Connection has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }

    /* to sync all models to database */
    // await sequelize.sync({alter: true});

    this.database = sequelize;
  }
}

module.exports = SequelizeModel;
