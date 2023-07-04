import { MongoClient } from 'mongodb';

const queryUserFaucets = async () => {

  const uri = 'mongodb+srv://bridgeuser:Gk4FPxxs8m5cNURc@cluster0.gizdv.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
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

    const newUri = 'mongodb+srv://koii:KoiiToTheMoon@im-a-task.b2xhqzs.mongodb.net/?retryWrites=true&w=majority';
    const newClient = new MongoClient(newUri, { useNewUrlParser: true, useUnifiedTopology: true });

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
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
    console.log('Disconnected from MongoDB');
  }
}



const checkWinners = async () => {
  const newUri = 'mongodb+srv://koii:KoiiToTheMoon@im-a-task.b2xhqzs.mongodb.net/?retryWrites=true&w=majority';
  const newClient = new MongoClient(newUri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await newClient.connect();
    console.log('Connected to new MongoDB');

    const newDatabase = newClient.db('referrals');
    const leaderboardCollection = newDatabase.collection('leaderboard');

    const leaderboardData = await leaderboardCollection.find({})
      .sort({ points: -1 })
      .limit(10)
      .toArray();

    const walletAddresses = leaderboardData.map(data => data.address);

    const userFaucetsCollection = newDatabase.collection('userfaucets');
    const emails = await userFaucetsCollection.find({ walletAddress: { $in: walletAddresses } })
      .project({ _id: 0, walletAddress: 1, emailAddress: 1 })
      .toArray();

    console.log('Top 10 Winners:');
    leaderboardData.forEach((data, index) => {
      const { address, points } = data;
      const winnerEmail = emails.find(entry => entry.walletAddress === address)?.emailAddress;
      const email = winnerEmail || 'Email not given';
      console.log(`${index + 1}. Address: ${address}, Points: ${points}, Email: ${email}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    newClient.close();
    console.log('Disconnected from new MongoDB');
  }
};

checkWinners();
   