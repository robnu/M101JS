var { MongoClient } = require('mongodb');
var	commandLineArgs = require('command-line-args');
var	assert = require('assert');

var options = commandLineOptions();

MongoClient.connect('mongodb://localhost:27017/crunchbase', (err, db) => {
  assert.equal(err, null);
  console.log("Successfully connected to MongoDB.");

  var query = queryDocument(options);
  var projection = {
    "_id": 0,
    "name": 1,
    "founded_year": 1,
    "number_of_employees": 1,
    "ipo.valuation_amount": 1
  };

  var cursor = db.collection("companies").find(query, projection);
  var numMatches = 0;

  cursor.forEach(
    doc => {
      numMatches += 1;
      console.log(doc);
    },
    err => {
      assert.equal(err, null);
      console.log("Our query was:" + JSON.stringify(query));
      console.log("Matching documents: " + numMatches);
      return db.close();
    }
  );
});

function queryDocument(options) {
  console.log(options);

  var query = {
    "founded_year": {
      "$gte": options.firstYear,
      "$lte": options.lastYear
    }
  };

  if ("employees" in options) query.number_of_employees = { "$gte": options.employees };

  if ("ipo" in options) {
    if (options.ipo == "yes") 
      query["ipo.valuation_amount"] = { "$exists": true, "$ne": null };
      /** ^ ipo.valuation_amount exists AND is not equal to 'null' */
     else if (options.ipo == "no") query["ipo.valuation_amount"] = null;
  }

  return query;
}

function commandLineOptions() {
  var cli = commandLineArgs([
    { name: "firstYear", alias: "f", type: Number },
    { name: "lastYear", alias: "l", type: Number },
    { name: "employees", alias: "e", type: Number },
    { name: "ipo", alias: "i", type: String }
  ]);

  var options = cli.parse();
  if (!("firstYear" in options && "lastYear" in options)) {
    console.log(
      cli.getUsage({
        title: "Usage",
        description:
          "The first two options below are required. The rest are optional."
      })
    );
    process.exit();
  }

  return options;
}
