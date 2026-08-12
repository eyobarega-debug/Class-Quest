import bcrypt from "bcryptjs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  try {
    await client.connect();

    const adminPassword = await bcrypt.hash("Admin123!", 10);
    const studentPassword = await bcrypt.hash("Student123!", 10);

    await client.query(
      `
      INSERT INTO users
        (username, email, password_hash, full_name, role)
      VALUES
        ($1, $2, $3, $4, $5)
      ON CONFLICT (username)
      DO NOTHING
      `,
      [
        "admin",
        "admin@classquest.com",
        adminPassword,
        "ClassQuest Admin",
        "admin",
      ]
    );

    await client.query(
      `
      INSERT INTO users
        (username, email, password_hash, full_name, role)
      VALUES
        ($1, $2, $3, $4, $5)
      ON CONFLICT (username)
      DO NOTHING
      `,
      [
        "student1",
        "student1@classquest.com",
        studentPassword,
        "Test Student",
        "student",
      ]
    );

    console.log("Seed completed.");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await client.end();
  }
}

seed();