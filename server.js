const express = require('express');
const { MongoClient } = require('mongodb');
const config = require('./config');


const app = express();
const port = 3000;

// Connect to the MongoDB server
const connectToMongo = async () => {
  const client = new MongoClient(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  return client;
};

// Define the route for queryUserFaucets
app.get('/queryUserFaucets', async (req, res) => {
  try {
    const client = await connectToMongo();
    console.log('Connected to MongoDB');

    const database = client.db('test');
    const collection = database.collection('verifiedclaimers');

    const documents = await collection.find({}).toArray();
    console.log('Documents:', documents);

    const points = {};

    documents.forEach(doc => {
      const walletAddress = doc.walletAddress;
      if (points[walletAddress]) {
        points[walletAddress]++;
      } else {
        points[walletAddress] = 1;
      }
    });

    const sortedAddresses = Object.entries(points).sort((a, b) => b[1] - a[1]);

    const top10Addresses = sortedAddresses.slice(0, 10);
    console.log('Top 10 Addresses:', top10Addresses);

    const newClient = new MongoClient(config.newMongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await newClient.connect();
    console.log('Connected to new MongoDB');

    const newDatabase = newClient.db('referrals');
    const leaderboardCollection = newDatabase.collection('leaderboard');

    // Clear existing leaderboard data
    await leaderboardCollection.deleteMany({});

    // Insert top 10 addresses with their points into the leaderboard collection
    const leaderboardData = top10Addresses.map(([address, points]) => ({ address, points }));
    await leaderboardCollection.insertMany(leaderboardData);

    console.log('Top 10 addresses inserted into the leaderboard collection');

    res.json({ winners: leaderboardData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  } finally {
    client.close();
    console.log('Disconnected from MongoDB');
  }
});

// Define the route for checkWinners
app.get('/checkWinners', async (req, res) => {
  try {
    const newClient = new MongoClient(config.newMongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await newClient.connect();
    console.log('Connected to new MongoDB');

    const newDatabase = newClient.db('referrals');
    const leaderboardCollection = newDatabase.collection('leaderboard');

    const leaderboardData = await leaderboardCollection
      .find({})
      .sort({ points: -1 })
      .limit(10)
      .toArray();

    const walletAddresses = leaderboardData.map(data => data.address);

    const userFaucetsCollection = newDatabase.collection('userfaucets');
    const emails = await userFaucetsCollection
      .find({ walletAddress: { $in: walletAddresses } })
      .project({ _id: 0, walletAddress: 1, emailAddress: 1 })
      .toArray();

    console.log('Top 10 Winners:');
    leaderboardData.forEach((data, index) => {
      const { address, points } = data;
      const winnerEmail = emails.find(entry => entry.walletAddress === address)?.emailAddress;
      const email = winnerEmail || 'Email not given';
      console.log(`${index + 1}. Address: ${address}, Points: ${points}, Email: ${email}`);
    });

    res.json({ winners: leaderboardData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  } 
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
