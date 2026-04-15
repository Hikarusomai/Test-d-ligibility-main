#!/bin/bash
# backend/scripts/ensure-mongodb-user.sh

# Use the localhost exception to create the user if it doesn't exist
# This works even if --auth is enabled but NO users exist yet.

echo "🔍 Checking for MongoDB user existence..."

mongosh --host localhost --eval "
  try {
    const user = db.getSiblingDB('admin').getUser('visaAdmin');
    if (user) {
      console.log('✅ User visaAdmin already exists.');
    } else {
      throw new Error('User not found');
    }
  } catch (e) {
    console.log('👷 Creating visaAdmin user...');
    db.getSiblingDB('admin').createUser({
      user: 'visaAdmin',
      pwd: 'VsF8kL2mP9xQj5nT3wZ7yB4cE6hR0dA',
      roles: [
        { role: 'root', db: 'admin' },
        { role: 'readWrite', db: 'visa_requirements' }
      ]
    });
    console.log('✅ User visaAdmin created successfully.');
  }
"
