import { MongoClient } from 'mongodb';

async function getEmailByWalletAddress(walletAddress) {
  const uri = 'mongodb+srv://bridgeuser:Gk4FPxxs8m5cNURc@cluster0.gizdv.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('test');
    const collection = database.collection('userfaucets');

    const query = { walletAddress: walletAddress };
    const document = await collection.findOne(query);

    if (document) {
      const email = document.emailAddress;
      console.log(`Email for wallet address ${walletAddress}: ${email}`);
    } else {
      console.log(`No document found for wallet address ${walletAddress}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
    console.log('Disconnected from MongoDB');
  }
}

const walletAddressToFind = 'AZz6ty5UEuHqkgz1ZVuQc1wXv6Pyu98GzReCngS5Vqho'; 
getEmailByWalletAddress(walletAddressToFind);
