import express, { json } from "express";
import { driver as _driver, auth } from "neo4j-driver";

const app = express();
app.use(json());

// اتصال بقاعدة البيانات
const driver = _driver(
  "bolt://localhost:7687",   // لو شغال Docker/Local
  auth.basic(process.env.USER || "neo4j" , process.env.PASSWORD) // اليوزر والباسورد اللي اخترتهم
);
const session = driver.session();

// ✅ Route تجريبي
app.get("/", (req, res) => {
  res.send("Neo4j + Express API شغال ✅");
});

// 👤 إضافة مستخدم جديد
app.post("/users", async (req, res) => {
  const { name, age } = req.body;

  try {
    await session.run(
      "CREATE (u:User {name: $name, age: $age})",
      { name, age }
    );
    res.json({ message: "User created ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 👥 جلب جميع المستخدمين
app.get("/users" , (req,res)=>{
   try {
      session.run(
         "MATCH (u:User) RETURN u.name AS name, u.age AS age"
      ).then(result => {
         const users = result.records.map(record => ({ name: record.get("name"), age: record.get("age") }));
         res.json({ users });
      });
      
   } catch (error) {
      res.status(500).json({ error: "Something went wrong" });
   }
});

// 👥 جلب أصدقاء المستخدم
app.get("/users/:name/friends", async (req, res) => {
  const { name } = req.params;

  try {
    const result = await session.run(
      "MATCH (u:User {name: $name})-[:FRIEND_WITH]->(f) RETURN f.name AS friend",
      { name }
    );

    const friends = result.records.map(record => record.get("friend"));
    res.json({ friends });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 🤝 إضافة علاقة صداقة بين مستخدمين
app.post("/users/:name1/add-friend/:name2", async (req, res) => {
  const { name1, name2 } = req.params;

  try {
    await session.run(
      `MATCH (u1:User {name: $name1}), (u2:User {name: $name2})
       CREATE (u1)-[:FRIEND_WITH]->(u2), (u2)-[:FRIEND_WITH]->(u1)`,
      { name1, name2 }
    );
    res.json({ message: `${name1} and ${name2} are now friends ✅` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// تشغيل السيرفر
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
