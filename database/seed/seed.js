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
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO NOTHING
      `,
      ["admin", "admin@classquest.com", adminPassword, "ClassQuest Admin", "admin"]
    );

    await client.query(
      `
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO NOTHING
      `,
      ["student1", "student1@classquest.com", studentPassword, "Test Student", "student"]
    );

    const challengeResult = await client.query(
      `
      INSERT INTO challenges (title, slug, description, difficulty, category, xp_reward)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
      `,
      [
        "Sum Two Numbers",
        "sum-two-numbers",
        "Write a function solve(input) that receives a string of two space-separated integers and returns their sum as a string.\n\nExample: input \"2 3\" -> output \"5\"",
        "easy",
        "Variables",
        100,
      ]
    );

    let challengeId = challengeResult.rows[0]?.id;

    if (!challengeId) {
      const existing = await client.query(`SELECT id FROM challenges WHERE slug = $1`, ["sum-two-numbers"]);
      challengeId = existing.rows[0]?.id;
    }

    if (challengeId) {
      await client.query(
        `
        INSERT INTO challenge_languages (challenge_id, language, starter_code)
        VALUES ($1, $2, $3)
        ON CONFLICT (challenge_id, language) DO NOTHING
        `,
        [
          challengeId,
          "javascript",
          "function solve(input) {\n  // input is a string like \"2 3\"\n  const [a, b] = input.split(\" \").map(Number);\n  return String(a + b);\n}",
        ]
      );

      await client.query(
        `
        INSERT INTO test_cases (challenge_id, input, expected_output, is_hidden, order_index)
        VALUES
          ($1, '2 3', '5', false, 0),
          ($1, '10 15', '25', false, 1),
          ($1, '-4 4', '0', true, 2),
          ($1, '100 200', '300', true, 3)
        `,
        [challengeId]
      );
    }

    console.log("Seed completed.");
    console.log("Admin login:   admin / Admin123!");
    console.log("Student login: student1 / Student123!");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await client.end();
  }
}

seed();