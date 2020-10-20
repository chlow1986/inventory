const fs = require('fs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const privateKey = fs.readFileSync('rsa.private');
const refreshTokenExpiresIn = 1000 * 60 * 60; // 30 minutes
const accessTokenExpiresIn = 1000 * 60 * 30; // 30 minutes

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


function _signToken(data, expiresIn){
  return jwt.sign(
      data,
      privateKey,
      {
        expiresIn
      }
  );
}

function _verifyToken(token){
  return jwt.verify(token, privateKey);
}

async function verifyAccessToken(accessToken){
  var data;
  try {
    data = await _verifyToken(accessToken);
  }catch (error){
    if(error.name === 'TokenExpiredError'){
      return null;
    }
  }
  return data;
}

async function refreshAccessToken(refreshToken){
  if (refreshToken === undefined || refreshToken === null) {
    return null;
  }

  var data;
  try {
    data = await _verifyToken(refreshToken);

    const accessToken = await _signToken({user: data.user}, accessTokenExpiresIn);
    return { accessToken, refreshToken };
    
  } catch (error) {

  }
  return null;
}

function getSalt(){
  return crypto.randomBytes(16).toString('hex');
}

function getHash(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex');
}

async function getTokens(user) {
  const accessToken = await _signToken({user}, accessTokenExpiresIn);
  const refreshToken = await _signToken({user}, refreshTokenExpiresIn);

  return { accessToken, refreshToken };
}

function tokenCookies({ accessToken, refreshToken }) {
  const cookieOptions = {
      httpOnly: true,
      // secure: true, //for HTTPS only
      // domain: "your-website.com",
      SameSite: 2,
      expires: new Date(Date.now() + (accessTokenExpiresIn - 1000))
  };

  return {
      access: ["access", accessToken, cookieOptions ],
      refresh: ["refresh", refreshToken, cookieOptions ]
  };
}

module.exports = {
  capitalize,
  tokenCookies,
  getTokens,
  getHash,
  getSalt,
  refreshAccessToken,
  verifyAccessToken,
}