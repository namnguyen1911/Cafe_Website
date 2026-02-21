import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("PostgreSQL Connected");
  } catch (error) {
    console.error("PostgreSQL connection error:", error.message);
    throw error;
  }
};

export default connectDB;
