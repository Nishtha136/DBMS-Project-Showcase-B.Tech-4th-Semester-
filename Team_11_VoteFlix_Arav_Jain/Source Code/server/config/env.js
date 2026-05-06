// using dotenv to load the variables from .env file
import dotenv from 'dotenv'

// calling the config function
dotenv.config()

// exported env object with all db details
export const env = {
  port: Number(process.env.PORT || 4000),
  mysqlHost: process.env.MYSQL_HOST || 'localhost',
  mysqlPort: Number(process.env.MYSQL_PORT || 3306),
  mysqlUser: process.env.MYSQL_USER || 'root',
  mysqlPassword: process.env.MYSQL_PASSWORD || '',
  mysqlDatabase: process.env.MYSQL_DATABASE || 'movie_awards',
}
