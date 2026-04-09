#!/bin/bash
# Wait for MongoDB to be ready
sleep 5

# Ensure admin user exists
docker exec eligibility_mongo mongosh visa_requirements --quiet --eval "
const admin = db.users.findOne({email: 'contact@matchmyschool.com'});
if (!admin) {
  const User = require('./models/User');
  const admin = new User({
    email: 'contact@matchmyschool.com',
    password: 'Admin@2026',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  });
  admin.save();
  console.log('Admin user created');
} else {
  console.log('Admin user exists');
}
"
