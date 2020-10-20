# Inventory
Regov back-end-take-home

Register
POST http://localhost:8080/register
body - JSON
{
    "email": "chinhong.low@outlook.com",
    "password": "password",
    "firstName": "Chin Hong"
}


Login - Login using JSON Web Token method. accessToken and RefreshToken are refreshed and returned everytime in response cookie. Token will expired in 30 mins if there are no activity.
POST http://localhost:8080/login
body - JSON
{
  "email": "chinhong.low@outlook.com",
  "password": "password",
}


Logout
POST http://localhost:8080/logout


Add product
Product's code, name and price is required field.
Product's code and name must be unique.
POST http://localhost:8080/product
body - JSON
{
    "code": "A01",
    "name": "Apple",
    "description": "Fresh Apple",
    "price": 1.00,
    "remark": ""
}


Add warehouse
Warehouse's name is required field.
Warehouse's name must be unique.
POST http://localhost:8080/warehouse
body - JSON
{
    "name": "Regov",
    "address": "B-7-3A, Block B West, Menara PJ8"
}


Stock
Stock's product_id, warehouse_id and qty is required field.
Stock's product_id, warehouse_id are composite unique fields.

Stock's quantity will sum up with the input qty.
POST http://localhost:8080/stock
body - JSON
{
    "product_id": 2,
    "warehouse_id": 2,
    "qty": 4
}


Unstock

Stock's quantity will reduce by the input qty and qty cannot less then zero. 
POST http://localhost:8080/unstock
body - JSON
{
    "product_id": 2,
    "warehouse_id": 2,
    "qty": 4
}


List products
GET http://localhost:8080/list/product
A simple filter implemented, example:
localhost:8080/list/product?code=A01 it will return product with code equal to "A01"


List warehouses
GET http://localhost:8080/list/warehouse
A simple filter implemented, example:
localhost:8080/list/warehouse?name=Regov it will return warehouse with name equal to "Regov"

For Listing, I have implemented a common endpoint to list modules' record. http://localhost:8080/list/:model
model can be: product, warehouse or stock. But I have blocked listing User data because it is insecure to return user details unless to filter out password and salt field.


List warehouse
GET http://localhost:8080/warehouse/1


Delete product
DELETE http://localhost:8080/product/1


Delete Warehouse
DELETE http://localhost:8080/warehouse/1

