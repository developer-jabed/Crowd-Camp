const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken"); // Currently not used, but ready for future auth

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI
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
    console.log("Connected to MongoDB!");

    const db = client.db("crowdfundingDB");
    const campaignCollection = db.collection("campaigns");
    const donationCollection = db.collection("donation");
    const userCollection = db.collection("users");

    // -------------------------------
    // Create a New Campaign
    // -------------------------------
    app.post("/campaign", async (req, res) => {
      try {
        const campaign = req.body;
        const result = await campaignCollection.insertOne(campaign);
        res.status(201).json({
          success: true,
          message: "Campaign added successfully",
          data: result,
        });
      } catch (error) {
        console.error("Error adding campaign:", error);
        res
          .status(500)
          .json({ success: false, error: "Failed to add campaign" });
      }
    });

    // -------------------------------
    // Get All Campaigns
    // -------------------------------
    app.get("/campaign", async (req, res) => {
      try {
        const result = await campaignCollection.find().limit(100).toArray();
        if (result.length < 6) {
          return res
            .status(404)
            .json({ message: "Not enough campaigns found" });
        }
        res.json(result);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        res.status(500).json({ message: "Server error", error });
      }
    });

    // -------------------------------
    // Get Campaign by ID
    // -------------------------------
    app.get("/campaign/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const campaign = await campaignCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!campaign) {
          return res.status(404).json({ message: "Campaign not found" });
        }

        res.json(campaign);
      } catch (error) {
        console.error("Error fetching campaign by ID:", error);
        res.status(500).json({ message: "Server error", error });
      }
    });

    // -------------------------------
    // Update a Campaign (Partial Update)
    // -------------------------------
    app.put("/campaign/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateCampaign = req.body;

      const update = {
        $set: {
          photoUrl: updateCampaign.photoUrl,
          titleName: updateCampaign.titleName,
          name: updateCampaign.name,
          type: updateCampaign.type,
          description: updateCampaign.description,
          amount: updateCampaign.amount,
          date: updateCampaign.date,
        },
      };

      const result = await campaignCollection.updateOne(
        filter,
        update,
        options
      );
      res.send(result);
    });

    // -------------------------------
    // Delete a Campaign
    // -------------------------------
    app.delete("/campaign/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await campaignCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Campaign not found" });
        }

        res.json({ message: "Campaign deleted successfully", result });
      } catch (error) {
        console.error("Error deleting campaign:", error);
        res.status(500).json({ message: "Server error", error });
      }
    });

    // -------------------------------
    // Post a Donation
    // -------------------------------
    app.post("/donations", async (req, res) => {
      try {
        const donationData = req.body;
        const result = await donationCollection.insertOne(donationData);
        res
          .status(201)
          .json({ success: true, message: "Donation recorded", result });
      } catch (error) {
        console.error("Error recording donation:", error);
        res
          .status(500)
          .json({ success: false, error: "Failed to record donation" });
      }
    });

    // -------------------------------
    // Get All Donations (Optional)
    // -------------------------------
    app.get("/donations", async (req, res) => {
      try {
        const result = await donationCollection.find().toArray();
        res.json(result);
      } catch (error) {
        console.error("Error fetching donations:", error);
        res.status(500).json({ message: "Server error", error });
      }
    });

    app.get('/users', async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/users', async(req ,res) => {
      const newUser = req.body;
      console.log("creating new user ", newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    })
    // Optional Ping to MongoDB for health check
    await client.db("admin").command({ ping: 1 });
  } catch (error) {
    console.error("MongoDB connection error:", error);
  } finally {
    // Keep client connection open
    // await client.close();
  }
}

run().catch(console.dir);

// -------------------------------
// Base Route
// -------------------------------
app.get("/", (req, res) => {
  res.send("Crowdfunding server is running!");
});

// -------------------------------
// Start Server
// -------------------------------
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
