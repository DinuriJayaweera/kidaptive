import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://kidaptive-admin:UNUTJfjJddWPMMtS@kidaptive.9ruaupj.mongodb.net/?appName=kidaptive';

mongoose.connect(MONGO_URI).then(async () => {
  const cats = await mongoose.connection.db.collection('categories').find({}).toArray();
  for (const cat of cats) {
    console.log(`${cat.name}: ageGroups =`, JSON.stringify(cat.ageGroups));
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
