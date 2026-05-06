// this is for connecting to the mysql database
import mysql from 'mysql2/promise'
// getting the db info from our env file
import { env } from '../config/env.js'

// pool for admin stuff
export const adminPool = mysql.createPool({
  host: env.mysqlHost,
  port: env.mysqlPort,
  user: env.mysqlUser,
  password: env.mysqlPassword,
  waitForConnections: true,
  connectionLimit: 10,
})

// pool for the main app to talk to the db
export const appPool = mysql.createPool({
  host: env.mysqlHost,
  port: env.mysqlPort,
  user: env.mysqlUser,
  password: env.mysqlPassword,
  database: env.mysqlDatabase,
  waitForConnections: true,
  connectionLimit: 10,
})
