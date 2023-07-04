import { MongoClient } from 'mongodb';

async function queryUserFaucets() {
  const uri = 'mongodb+srv://bridgeuser:Gk4FPxxs8m5cNURc@cluster0.gizdv.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('test');
    const collection = database.collection('verifiedclaimers');

    const address = 'AZz6ty5UEuHqkgz1ZVuQc1wXv6Pyu98GzReCngS5Vqho'; 

    const documents = await collection.find({ walletAddress: address }).toArray();
    console.log(`Entries for address ${address}:`);
    console.log(documents);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
    console.log('Disconnected from MongoDB');
  }



}

queryUserFaucets();
