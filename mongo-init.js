// MongoDB initialization script
// This runs when the container is first created

db = db.getSiblingDB('alfred_ordering_db');

// Create app user with readWrite permissions
db.createUser({
    user: 'alfred_user',
    pwd: 'alfred_password',
    roles: [
        {
            role: 'readWrite',
            db: 'alfred_ordering_db'
        }
    ]
});

print('✅ Database user created successfully');