import mysql, { type Pool, type PoolConnection, type RowDataPacket } from "mysql2/promise";
const globalDb = globalThis as typeof globalThis & { mysqlPool?: Pool };
export function getPool(): Pool {
  return globalDb.mysqlPool ??= mysql.createPool({
    host: process.env.MYSQL_HOST ?? "127.0.0.1", port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? "ask_me", password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE ?? "ask_me", charset: "utf8mb4", connectionLimit: 10,
  });
}
export async function rows<T>(sql: string, values: (string | number | boolean | null)[] = [], connection?: PoolConnection): Promise<T[]> {
  const [result] = await (connection ?? getPool()).execute<RowDataPacket[]>(sql, values);
  return result as T[];
}
export async function transaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try { await connection.beginTransaction(); const result = await work(connection); await connection.commit(); return result; }
  catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
