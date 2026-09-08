import { readFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { getPool, transaction } from "../lib/db";
loadEnvConfig(process.cwd());
async function main() {
  const tables = {
    users: ["id","googleId","email","name","image","createdAt"],
    sessions: ["id","ownerUserId","title","description","presenter","date","active","allowQuestions","createdAt","updatedAt"],
    questions: ["id","sessionId","name","question","emoji","color","status","createdAt"],
  };
  const input = await Promise.all(Object.entries(tables).map(async ([table,columns])=>({table,columns,data:JSON.parse(await readFile(`data/${table}.json`,"utf8")) as Record<string,unknown>[]})));
  await transaction(async c=>{
    // Atomic import into an empty database only; never overwrite existing records.
    for (const {table} of input) {
      const [existing] = await c.query(`SELECT id FROM ${table} LIMIT 1`);
      if ((existing as unknown[]).length) throw new Error("Migration requires empty tables; existing database was not changed.");
    }
    for (const {table,columns,data} of input) for (const row of data) {
      await c.execute(`INSERT INTO ${table} (${columns.map(c=>`\`${c}\``).join(",")}) VALUES (${columns.map(()=>"?").join(",")})`,columns.map(key=>{ const value=row[key]; if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean" && value !== null) throw new Error("Invalid field"); return value; }));
    }
  });
  console.log("Imported JSON records in one transaction. Original files preserved.");
}
main().catch(()=>{console.error("Migration failed and rolled back. Check database connection, empty tables, and JSON records.");process.exitCode=1;}).finally(()=>getPool().end());
