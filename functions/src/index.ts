import * as functions from 'firebase-functions';
import axios from 'axios'
import * as querystring from 'querystring';
import * as keys from './keys.json'
// import { database } from 'firebase-admin';

interface Tokens {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
  user_id: string;
}
interface FitbitError {
  errorType: string;
  message: string;
}

interface FitbitErrorResponse {
  errors: FitbitError[];
  success: boolean;
}

const clientID = keys.clientID
const clientSecret = keys.clientSecret
const redirectURI = keys.redirectURI
//'http%3A%2F%2Flocalhost%3A5000%2Ffitbit-auth%2Fus-central1%2Fcallback' //'http://localhost:5000/fitbit-auth/us-central1/callback' //'https://us-central1-fitbit-auth.cloudfunctions.net/callback' //https://fitbit-auth.firebaseapp.com/callback'

const basicAuthToken = Buffer.from(`${clientID}:${clientSecret}`).toString('base64')
console.log('basic auth token', basicAuthToken)
const configs = {
  headers: {
    contentType: 'application/x-www-form-urlencoded',
    authorization: `Basic ${basicAuthToken}`
  }
}

/**
 * 
 * @param code 
 */
function getTokens(code: string) {
  console.log('get tokens with code', code)
  // https://github.com/axios/axios/issues/350#issuecomment-227270046
  const requestBody = querystring.stringify({
    clientId: clientID,
    'grant_type': 'authorization_code',
    'redirect_uri': redirectURI,
    code,
  })
  console.log('requestBody', requestBody)
  console.log('configs', configs)

  return axios.post('https://api.fitbit.com/oauth2/token', requestBody, configs).then(result => {
    console.log('Success:', result.data)
    return result.data // type Tokens
  })
    .catch(err => {
      console.error('error hitting fitbit', err.message)
      throw err
    })
}

/**
 * curl -X POST -i -H "Authorization: Basic MjJESDVSOjU2ZmE5MDE3NTMyYTllYzQ4-urlencoded" -d "grant_type=refresh_token" -d "refresh_token=d0087d512687e5d307c9f2bf20e8d41c56cd7033cc9745e677de49e8cb9eadbf" https://api.fitbit.com/oauth2/token
 */
const refreshToken = (token: string) => {
  const requestBody = querystring.stringify({
    'grant_type': 'refresh_token',
    'refresh_token': token,
  })
  console.log('requestBody', requestBody)
  console.log('configs', configs)

  return axios.post('https://api.fitbit.com/oauth2/token', requestBody, configs).then(res => res.data)
}

// The error where we will refersh our tokens.
//[{"errorType":"invalid_grant", "message":"Authorization code expired: [code]."}],
const errorHandler = (errorResponse: FitbitErrorResponse) => {
  const error = JSON.stringify(errorResponse)
  if (error.includes('Authorization code expired')) {
    // database.get(refresh_token)
    // refreshToken(refresh_token)
  }
}
export const callback = functions.https.onRequest(async (request, response) => {
  const { code } = request.query
  console.log(code, request.query)
  const tokens: Tokens = await getTokens(code).catch(err => {
    console.error(err.response.data)
    response.send({ message: 'error getting tokens', err: err.response.data })
    return
  })

  // database.store(tokens.refresh_token)
  console.log('tokens', tokens)
  response.send('ok')
})