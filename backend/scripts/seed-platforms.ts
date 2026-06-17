import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import ApiPlatform from '../src/models/ApiPlatform';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

const PLATFORMS = [
  {
    name: 'apollo',
    displayName: 'Apollo.io',
    testEndpoint: 'https://api.apollo.io/v1/auth/health',
    searchEndpoint: 'https://api.apollo.io/v1/mixed_people/search',
    docsUrl: 'https://apolloio.github.io/apollo-api-docs/'
  },
  {
    name: 'hunter',
    displayName: 'Hunter.io',
    testEndpoint: 'https://api.hunter.io/v2/account',
    searchEndpoint: 'https://api.hunter.io/v2/domain-search',
    docsUrl: 'https://hunter.io/api-documentation/v2'
  },
  {
    name: 'snov',
    displayName: 'Snov.io',
    testEndpoint: 'https://api.snov.io/v1/get-balance',
    searchEndpoint: 'https://api.snov.io/v2/domain-emails-with-info',
    docsUrl: 'https://snov.io/api'
  },
  {
    name: 'lusha',
    displayName: 'Lusha',
    testEndpoint: 'https://api.lusha.com/person/v2/search', // Re-verify real auth test endpoint if needed
    searchEndpoint: 'https://api.lusha.com/person/v2/search',
    docsUrl: 'https://www.lusha.com/docs/'
  },
  {
    name: 'rocketreach',
    displayName: 'RocketReach',
    testEndpoint: 'https://api.rocketreach.co/v1/api/account',
    searchEndpoint: 'https://api.rocketreach.co/v2/api/search',
    docsUrl: 'https://rocketreach.co/api'
  },
  {
    name: 'skrapp',
    displayName: 'Skrapp.io',
    testEndpoint: 'https://api.skrapp.io/api/v2/account',
    searchEndpoint: 'https://api.skrapp.io/api/v2/company',
    docsUrl: 'https://docs.skrapp.io/'
  },
  {
    name: 'getprospect',
    displayName: 'GetProspect',
    testEndpoint: 'https://api.getprospect.com/api/v1/users/current',
    searchEndpoint: 'https://api.getprospect.com/api/v1/search/contacts',
    docsUrl: 'https://getprospect.com/api-docs'
  }
];

async function seedPlatforms() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB.');

    // Clear existing platforms to ensure idempotency
    await ApiPlatform.deleteMany({});
    console.log('Cleared existing API platforms.');

    // Insert predefined platforms
    const result = await ApiPlatform.insertMany(PLATFORMS);
    console.log(`Successfully inserted ${result.length} API platforms.`);

  } catch (error) {
    console.error('Error seeding platforms:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seedPlatforms();
