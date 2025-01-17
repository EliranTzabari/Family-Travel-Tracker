import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "postgres",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

// let users = [
//   { id: 1, name: "Anegela", color: "teal" },
//   { id: 2, name: "Jack", color: "powderblue" },
// ];

async function getUsers() {
  let result = await db.query("SELECT * FROM users")
  return result.rows
}

async function userColor(userId){
  const result = await db.query("SELECT color FROM users WHERE id = $1", [userId])
  return result.rows[0].color
}
// console.log(await userColor(2))
async function checkVisisted(userId) {
  const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id = $1", [userId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted(currentUserId);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: await getUsers(),
    color: await userColor(currentUserId),
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  
  try {
    const result = await db.query(
      "SELECT country_code FROM country WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === 'new') {
    res.render("new.ejs")
  } else if (req.body.user > 0) {
    currentUserId = req.body.user
    res.redirect("/")
    }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  console.log(req.body)
  const newUserId = await db.query("INSERT INTO users (name,color) values ($1, $2) RETURNING id", [req.body.name, req.body.color])
  console.log(newUserId.rows)
  currentUserId = newUserId.rows[0].id
  console.log(currentUserId)
  res.redirect("/")
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
