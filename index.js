const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simulated Auth Middleware using JWT


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xo1yp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const campaignCollection = client
      .db("crowdfundingDB")
      .collection("campaigns");

    // Route to create a campaign
    app.post("/campaign",  async (req, res) => {
      try {
        const campaign = { ...req.body};
        const result = await campaignCollection.insertOne(campaign);
        res.status(201).json({ success: true, message: "Campaign added", data: result });
      } catch (error) {
        res.status(500).json({ success: false, error: "Failed to add campaign" });
      }
    });

    // Route to get all campaigns
    app.get("/campaign", async (req, res) => {
      try {
        const result = await campaignCollection.find().limit(100).toArray();
        if (result.length < 6) {
          return res
            .status(404)
            .json({ message: "Not enough campaigns found" });
        }
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
      }
    });

    app.delete('/campaign/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await campaignCollection.deleteOne(query);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Crowdfunding server is running");
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
