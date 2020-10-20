'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const SequelizeModel = require('./src/Sequelize');
const Utils = require('./src/Common/Utils');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';


(async () => {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cookieParser());


  const sequelize = new SequelizeModel();
  await sequelize.connect();

  app.get('/', (req, res) => {
    res.send('Hello World');
  });

  /** 
   * User Register 
   * variable required: email, firstName, password
   * **/
  app.post('/register', async (req, res, next) => {
    const args = req.body;
    console.log("args : ", args);
    try{
      const salt = crypto.randomBytes(16).toString('hex');
      const password = crypto.pbkdf2Sync(args.password, salt, 10000, 512, 'sha512').toString('hex');

      const user = sequelize.database.models.User.build({
        lastName: args.lastName,
        firstName: args.firstName,
        email: args.email,
        password: password,
        salt: salt
      });
  
      const result = await user.save();
  
      console.log("result : ", result);
      if(!result){
        throw new Error('Error registering user.');
      }
      const {password: newPassword, salt: newSalt, ...rest} = result.dataValues;
      res.send(rest);
    }catch(error){
      res.send({error: error.message});
    }
  });

  /** 
   * User Logout 
   * variable required: email, password
   * **/
  app.post('/logout', async (req, res) => {
    res.clearCookie("access");
    res.clearCookie("refresh");
    res.send({success: true});
  })

  /** 
   * User Login 
   * variable required: email, password
   * **/
  app.post('/login', async (req, res) => {
    const args = req.body;
    try{
      if(!args.email || !args.password){
        throw new Error('Please enter email and password.');
      }
      let user = await sequelize.database.models.User.findOne(
        {
          where: { email: args.email },
          attributes: ['firstName', 'lastName', 'email', 'password', 'salt']
        }
      );

      if(!user){
        throw new Error('Account not found.');
      }

      const {password, salt, ...rest} = user.dataValues;

      const inputPassword = Utils.getHash(args.password, salt);
      if(inputPassword !== password){
        throw new Error('Invalid password');
      }

      const tokens = await Utils.getTokens({email: user.email, firstName: user.firstName});
      if (tokens === undefined || tokens === null) {
        context.res.clearCookie("access");
        context.res.clearCookie("refresh");
        throw new Error('Fail to generate tokens.');
      }

      const cookies = Utils.tokenCookies(tokens);
      res.cookie(...cookies.access);
      res.cookie(...cookies.refresh);
      res.send(rest);
    }catch(error){
      res.send({error: error.message});
    }
  });

  /** 
   * List Model's records except User model for security issue. 
   * Simple filtering can be applied. example: localhost:8080/list/product?code=A01 || localhost:8080/list/warehouse?name=regov
   * **/
  app.get('/list/:model', async function (req, res) {
    const args = req.query;
    const {model} = req.params;
    const access = req.cookies["access"];
    try{
      if(access == null){
        throw new Error('Please login to proceed.');
      }

      var data = await Utils.verifyAccessToken(access);
      if (data === null || data.user === undefined) {
        throw new Error('Token expired.');
      }

      if(!model || model.toLowerCase() === 'user'){
        throw new Error('Invalid Request.');
      } 
      const modelNm = Utils.capitalize(model);
      const module = sequelize.database.models[modelNm];

      if(!module){
        throw new Error('Invalid Request.');
      }
      console.log("args: ", args);
      const result = await module.findAll({
        where: {...args}
      })

      const records = result.map(item=>{
        return {
          ...item.dataValues
        }
      })

      const { accessToken, refreshToken } = await Utils.refreshAccessToken(req.cookies["refresh"]);
      const cookies = Utils.tokenCookies({ accessToken, refreshToken });

      res.cookie(...cookies.access);
      res.cookie(...cookies.refresh);

      res.send(records);
    }catch(error){
      res.send({error: error.message});
    }
  })

  app.get('/:model/:id', async function (req, res){
    const {model, id} = req.params;
    try{
      if(req.cookies["access"] == null){
        throw new Error('Please login to proceed.');
      }

      var data = await Utils.verifyAccessToken(req.cookies["access"]);
      if (data === null || data.user === undefined) {
        throw new Error('Token expired.');
      }

      if(!id){
        throw new Error('Record ID not provided.');
      }

      if(!model || model.toLowerCase() === 'user'){
        throw new Error('Invalid Request.');
      } 
      const modelNm = Utils.capitalize(model);
      const module = sequelize.database.models[modelNm];

      if(!module){
        throw new Error('Invalid Request.');
      }

      const warehouse = await module.findByPk(id);

      const { accessToken, refreshToken } = await Utils.refreshAccessToken(req.cookies["refresh"]);
      const cookies = Utils.tokenCookies({ accessToken, refreshToken });

      res.cookie(...cookies.access);
      res.cookie(...cookies.refresh);

      if(!warehouse){
        res.send({error: `Record [${id}] not found.`});
      }else{
        res.send(warehouse.dataValues);
      }
    }catch(error){
      res.send({error: error.message});
    }
  })

  app.post('/product', async function (req, res) {
    const args = req.body;
    try{
      if(req.cookies["access"] == null){
        throw new Error('Please login to proceed.');
      }

      var data = await Utils.verifyAccessToken(req.cookies["access"]);
      if (data === null || data.user === undefined) {
        throw new Error('Token expired.');
      }

      const product = sequelize.database.models.Product.build({
        ...args
      });
  
      const result = await product.save();

      res.send(product.dataValues);
    }catch(error){
      res.send({error: error.message});
    }
  })

  app.delete('/product/:id', async function (req, res) {
    const {id} = req.params;
    try{
      if(req.cookies["access"] == null){
        throw new Error('Please login to proceed.');
      }

      var data = await Utils.verifyAccessToken(req.cookies["access"]);
      if (data === null || data.user === undefined) {
        throw new Error('Token expired.');
      }

      if(!id){
        throw Error('Please provide product ID to delete.');
      }

      const result = await sequelize.database.models.Product.destroy({
        where: {
          id: id
        }
      });

      console.log("result :: ", result);

      if(result < 1){
        throw Error('Record not found.');
      }

      res.send({success: true, message: 'Record deleted.'});
    }catch(error){
      res.send({error: error.message});
    }
  })

  app.post('/warehouse', async function (req, res) {
    const args = req.body;
    try{
      if(req.cookies["access"] == null){
        throw new Error('Please login to proceed.');
      }

      var data = await Utils.verifyAccessToken(req.cookies["access"]);
      if (data === null || data.user === undefined) {
        throw new Error('Token expired.');
      }

      const warehouse = sequelize.database.models.Warehouse.build({
        ...args
      });
  
      const result = await warehouse.save();

      res.send(warehouse.dataValues);
    }catch(error){
      res.send({error: error.message});
    }
  })

  app.delete('/warehouse/:id', async function (req, res) {
    const {id} = req.params;
    try{
      if(req.cookies["access"] == null){
        throw new Error('Please login to proceed.');
      }

      var data = await Utils.verifyAccessToken(req.cookies["access"]);
      if (data === null || data.user === undefined) {
        throw new Error('Token expired.');
      }

      if(!id){
        throw Error('Please provide warehouse ID to delete.');
      }

      const result = await sequelize.database.models.Warehouse.destroy({
        where: {
          id: id
        }
      });

      console.log("result :: ", result);

      if(result < 1){
        throw Error('Record not found.');
      }

      res.send({success: true, message: 'Record deleted.'});
    }catch(error){
      res.send({error: error.message});
    }
  })

  app.post('/stock', async function (req, res) {
    const {warehouse_id, product_id, qty} = req.body;
    try{
      if(req.cookies["access"] == null){
        throw new Error('Please login to proceed.');
      }

      var data = await Utils.verifyAccessToken(req.cookies["access"]);
      if (data === null || data.user === undefined) {
        throw new Error('Token expired.');
      }

      const stock = await sequelize.database.models.Stock.findOne({
        where: {
          WarehouseId: warehouse_id,
          ProductId: product_id
        }
      },
      {
      });

      if(!stock){
        const newStock = await sequelize.database.models.Stock.create(
          {
            WarehouseId: warehouse_id,
            ProductId: product_id,
            qty
          },
          {
          }
        );
        res.send(newStock.dataValues);
      }else{
        const newQty = qty + stock.dataValues.qty;
        stock.update({
          qty: newQty
        },
        {
        })
        res.send(stock);
      }
    }catch(error){
      res.send({error: error.message});
    }
  })


  app.post('/unstock', async function (req, res) {
    const {warehouse_id, product_id, qty} = req.body;
    try{
      if(req.cookies["access"] == null){
        throw new Error('Please login to proceed.');
      }

      var data = await Utils.verifyAccessToken(req.cookies["access"]);
      if (data === null || data.user === undefined) {
        throw new Error('Token expired.');
      }

      const stock = await sequelize.database.models.Stock.findOne({
        where: {
          WarehouseId: warehouse_id,
          ProductId: product_id
        }
      },
      {
      });

      if(!stock){
        throw new Error('No stock quantity to deduct.');
      }else{
        const newQty = stock.dataValues.qty - qty;
        if(newQty < 0){
          throw new Error('Not enough stock quantity to deduct.');
        }
        stock.update({
          qty: newQty
        },
        {
        })
        res.send(stock);
      }
    }catch(error){
      res.send({error: error.message});
    }
  })

  app.listen(PORT, HOST);
  console.log(`Running on http://${HOST}:${PORT}`);
})();