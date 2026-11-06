import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno desde .env en la raíz del proyecto
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'iglesias',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
})

export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Conexión con MySQL exitosa en la base de datos:', process.env.DB_NAME || 'iglesias')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error)
    return false
  }
}

