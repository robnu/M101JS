### `find` and Cursors in the Node.js driver

To import a database into MongoDB, on the terminal, exactly where the file is, run 

```
mongoimport -d crunchbase -c companies companies.json
```
`-d` specify the database <br>
`-c` specify the collection <br>
`companies.json` the file with the data

This program is an example of using `find` the Node.js driver.
```javascript
const { MongoClient } = require('mongodb');
const assert = require('assert');

MongoClient.connect('mongodb://localhost:27017/crunchbase', (err, db) => {
  assert.equal(err, null);
  console.log('Successfully connected to MongoDB.');

  const query = { "category_code": "biotech" };

  db
    .collection('companies')
    .find(query)
    .toArray((err, docs) => {
      assert.equal(err, null);
      assert.notEqual(docs.length, 0);

      docs.forEach(doc => console.log(`${doc.name} is a ${doc.category_code} company.`));

      db.close();
    });
});
```
`find` returns a cursor, so we're calling `toArray` on that cursor. `toArray` returns an array with all the docs, then we're using `forEach` to loop through the docs and printing each document. The first assertion is to make sure there's no error, and the second one is to make sure the length of the array is not 0.

```javascript
const { MongoClient } = require('mongodb');
const assert = require('assert');

MongoClient.connect('mongodb://localhost:27017/crunchbase', (err, db) => {
  assert.equal(err, null);
  console.log('Successfully connected to MongoDB.');

  const query = { "category_code": "biotech" };

  var cursor = db.collection('companies').find(query);

  cursor.forEach(doc => {
      console.log(`${doc.name} is a ${doc.category_code} company.`);
    },
    err => {
      assert.equal(err, null);
      return db.close();
    }
  );
});
```

This is a slightly different version of the first code. Note that we have a call to the `find` method, but don't give it a callback. Remember that `find` returns a cursor and we're assigning the value returned from `find` (the cursor) to a variable called `cursor`. <br>
Chaining a call to `toArray` onto a call to `find` (as we did in the first example) consumes the cursor and gives us an array of documents we can work with. With code written like the second example, instead of consuming everything at once and pulling it all in to memory, we're streaming the data to our application. `find` can create the cursor immediately because it doesn't actually make a request to the database until we try to use some of the documents it will provide. The point of the cursor is just to describe our query. <br>
In the first example, it was `toArray` that provided the need to actually retrieve documents from the database. When we did that `toArray` call, the driver said "okay the client app is actually looking for all the documents and wants them back in an array so I'll actually have to go execute the query". In this second example we haven't actually asked for anything yet, so it can just make the cursor object and return it.  Cursor objects provide a `forEach` method. Note that this is not the `forEach` method on arrays because we're dealing with the cursor here as opposed to an array object. And the form of this method, that is to say what arguments it expects are different. The cursor `forEach` method expects as its first argument a callback for iterating through the documents; it will call this callback one time for each document in the result set. The second argument is what to do when the cursor is exhausted or in the case of an error. When we call `forEach` here as, with `toArray` this is an indication to the driver that needs to actually go get us some documents. <br>
The difference between the 2 examples is that with the code written this way we're streaming the documents into the application as we need them. And all we're really doing here is printing them out one at a time. <br>
When the cursor requests documents from MongoDB triggered by something like the cursor method `toArray` or the cursor method `forEach`, the response from the database system isn't necessarily the entire result set. So consider a situation where you have a massive database with many many documents and you don't actually want to return the whole set of documents all at once; what actually happens is that when the cursor has to go off and get some documents, say because we called `forEach`, MongoDB will return a batch of documents up to a certain batch size. So in the second example when the cursor gets back that  first batch of results it can actually start passing documents to the callback we've handed `forEach`. Once that initial batch runs out, the cursor can make another request to get the next batch and once that batch runs out, can make another request and so on until it reaches the end of the result set. This works very nicely with a method  like `forEach` because we can process documents as they come in in successive batches. Contrast this was `toArray` where the callback doesn't get called until all documents have been retrieved from the database system and the entire array is built, which means you're not getting any advantage from  the fact that the driver and database system are working together to batch results to your application. Batching is meant to provide some efficiency in terms of memory overhead an execution time so take advantage of it, if you can, in your applications.

___

### Projection in the Node.js Driver

```javascript
var { MongoClient } = require('mongodb');
var assert = require('assert');

MongoClient.connect('mongodb://localhost:27017/crunchbase', (err, db) => {
  assert.equal(err, null);
  console.log('Successfully connected to MongoDB.');

  var query = { "category_code": "biotech" };
  var projection = { "name": 1, "category_code": 1, "_id": 0 };

  var cursor = db.collection('companies').find(query).project(projection);

  cursor.forEach(
    doc => {
      console.log(doc.name + ' is a ' + doc.category_code + ' company.');
      console.log(doc);
    },
    err => {
      assert.equal(err, null);
      return db.close();
    }
  );
});

```

The idea behind field projection is that in some circumstances we only care about some of the fields in the documents returned.
`query` is gonna form the "companies" collection, only documents which "category_code" equals "biotech". <br>
We've added added a `projection` object so that the only fields we get back from our query are those we need for the message we are
printing below. In a real application, you would project out just the fields you needed for whatever web page you need to display: an analytics task that you need to run or some other job your application is designed to accomplish. <br>
Projection allows us to explicitly include or exclude fields. We use 1 to indicate that we want to include a field and 0 to exclude fields.  Remember that _id is special in that it is always included unless we explicitly exclude it. <br>
`cursor` is chaining some methods on `db`: `collection` specifies which database collection we're pulling data from. `find` specifies what exactly we're looking for, and `projection` specifies which fields from the query we wanna show. <br>
The call to `find` will be synchronous. It won't actually go and fetch documents from the database. Rather, it'll simply immediately return a
cursor to us. We're going to modify that cursor with a field projection, using the `project` method on cursors and then we're going to call `forEach` on the cursor, passing 2 callbacks: one to iterate though the returned documents, and another callback to be called if there's an error or when we've exhausted the cursor. <br>
🔥 What's important to realize is that there is a performance advantage, in that we're only sending over the wire and using network bandwidth for data that we actually need. This is a factor that can have a sizeable performance impact especially when there are thousands of clients making requests to our database. By projecting out just the fields we need, responses will require less time to assemble on the database side, less time to transmit to clients, and less time to process within those clients 🔥

___

### Query Operators in the Node.js Driver

Check /queryOperatorsInNodeJSDriver/

___

### `sort`, `skip` and `limit` in the Node.js Driver

When we're retrieving documents from a MongoDB collection it's often the case that we would like the database to support us in paging through the results.

```javascript
// from app-sort.js
var cursor = db
  .collection('companies')
  .find(query)
  .project(projection)
  .sort([['founded_year', 1], ['number_of_employees', -1]]);
  ```
By running

```
$ node app-sort.js -f 2006 -l 2009 -e 100
```

`cursor` will go to the 'companies' collection, find the `query` variable, project some document and will **sort** the results in *ascending order* for 'founded_year' and *descending order* for 'number\_of\_employees' <br>
🗣️ It's still the case that not until we call the `forEach` *(app-sort.js line 20)* that the driver actually says, "oh I better go get some documents from the database". Instead, it's building up its representation of our query in this cursor object as we make additional cursor method calls, adding additional detail to the command that we do eventually want to issue to the database. <br>
Initially, for sorting 1 property only, we use a object `.sort({founded_year: -1});` but in the example above we're using an array. The reason for that is because the order in which these sorts are applied is important. We want to sort first by founded year in ascending order and then within each year sort by number of employees, and we want to do that in descending order. <br>
The problem we run into if we try to pass an object, is that **it's possible that the fields will be reordered**. There is no guarantee of order of fields for JavaScript objects, but the order of array elements is guaranteed. So if I want to make sure that I sort first by founded year and then by number of employees, the Node.js driver allows me to pass an array to sort.

#### Let's talk about `skip` and `limit`

Here is an extended version of the code above:

```javascript
var cursor = db
  .collection("companies")
  .find(query)
  .project(projection)
  .limit(options.limit)
  .skip(options.skip)
  .sort([["founded_year", 1], ["number_of_employees", -1]]);
```

Skip and Limit are also cursor methods and, as with project and sort they merely modify the description of the operation that we want to execute against the database.

Calling skip and calling limit **do not** force a call to the database.

It's only when we call `forEach` that we'll send the details to the database complete with the query, the projection, the sort, how many search results to skip and to what size we'd like to limit our results set.  

Running:
```
$ node app-sortSkipLimit.js -f 2006 -l 2009 -e 250 --limit 10 --skip 0
```

We set limit to 10, so only 10 results will be shown. We set skip to 0, so nothing will be skipped. If we run that again changing skip to 10, we'll skip the first 10 results, which is exactly the first 10 ones shown. Running it again, changing skip to 20, we'll show 10 documents skipping the first 20. You get the fucking idea. <br>
You do a search to Amazon, you see 10 results on a page, and then in order to see results beyond that first page of results you click a
Next button. On the back end what's happening is the application is actually submitting another query to the database-- same query, just skip the first 10 if that's how many we have on the page. That's what we're doing here.

___

### ~