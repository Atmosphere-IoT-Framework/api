
const run = async function() {
  // Make sure we are running node 7.6+
  const [major, minor] = process.versions.node.split('.').map(parseFloat);
  if (major < 7 || (major === 7 && minor <= 5)) {
    console.log('Older version of node, upload to 7.6 or greater\n');
    process.exit();
  }
  console.log('Node version: ' + process.versions.node);

  // Import environmental variables
  require('dotenv').config({ path: 'variables.env' });
  
  // Deafult tenant
  process.env.DEFAULT_TENANT = process.env.DEFAULT_TENANT_PROD;

  // Init database
  const database = require('./database.js');
  await database.init('prod');
  
  // Authentication
  require('./security/authentication.js');

  // Start the micro-service
  const server = require('./server.js');
}

run();