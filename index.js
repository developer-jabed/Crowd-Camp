const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simulated Auth Middleware
const authenticateUser = (req, res, next) => {
  req.user = { email: "testuser@example.com" }; // Replace with real auth logic
  next();
};

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_PASS}@cluster0.xo1yp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    const campaignCollection = client.db("crowdfundingDB").collection("campaigns");

    // Get campaigns of logged-in user
    app.get("/campaigns", authenticateUser, async (req, res) => {
      try {
        const userEmail = req.user.email;
        const result = await campaignCollection.find({ creatorEmail: userEmail }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).json({ message: "Server error", error });
      }
    });

    // Create new campaign (attach creatorEmail)
    app.post("/campaign", authenticateUser, async (req, res) => {
      try {
        const campaign = { ...req.body, creatorEmail: req.user.email };
        const result = await campaignCollection.insertOne(campaign);
        res.status(201).json({ success: true, message: "Campaign added", data: result });
      } catch (error) {
        res.status(500).json({ success: false, error: "Failed to add campaign" });
      }
    });

    // Delete a campaign (with email verification)
    app.delete("/campaigns/:id", authenticateUser, async (req, res) => {
      try {
        const campaignId = req.params.id;
        const result = await campaignCollection.deleteOne({
          _id: new ObjectId(campaignId),
          creatorEmail: req.user.email,
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Campaign not found or unauthorized" });
        }

        res.send({ message: "Campaign deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Error deleting campaign", error });
      }
    });

    // General campaigns route
    app.get("/campaign", async (req, res) => {
      try {
        const result = await campaignCollection.find().limit(10).toArray();
        if (result.length < 6) {
          return res.status(404).json({ message: "Not enough campaigns found" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).json({ message: "Server error", error });
      }
    });

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
