const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 4000;



console.log(`User Name:${process.env.db_user}, Password:${process.env.db_pass}`)

//middleware

// app.use(cors({
//   origin: ['http://localhost:3000', /*'https://carsdoc.netlify.app'*/ ],
//   credentials: true,
// }))

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', /*'https://carsdoc.netlify.app'*/],
  credentials: true,
}));
app.use(express.json())





//mongodb start
const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.181u9cz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carsDoc').collection('services');
    const bookingCollection = client.db('carsDoc').collection('booking')




    // Auth related API (jwt)
    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1h'})
      res
      .cookie('token', token,{
        httpOnly: true,
        secure: false,
        sameSite: 'none'
      })
      .send({success: true})
    })  //this can be made with "app.get" too


    // Service related API
    app.get('/services', async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // app.get('/services/:id', async(req, res)=>{
    //   console.log(req.params)
    //   const id = parseInt(req.params.id);
    //   const query = {_id: new ObjectId(id)}

    //   const options = {
    //     // Include only the `title` and `imdb` fields in the returned document
    //     projection: {  title: 1, price: 1, service_id: 1 },
    //   };

    //   const result = await serviceCollection.findOne(query, options);
    //   res.send(result);
    //  })

    app.get('/services/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await serviceCollection.findOne(query);

        if (result) {
          res.status(200).json(result); // Sending the lecture as JSON response
        } else {
          res.status(404).send("Service not found");
        }
      } catch (error) {
        console.error("Error fetching Services:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // booking get
    app.get('/booking', async(req, res)=>{
      console.log((req.query.email));
      let query = {};
      if(req.query?.email){
        query = {email:req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    })

    //booking post
    app.post('/booking', async (req, res) => { //// post means creation
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })


    app.patch('/booking/:id', async(req, res)=>{

      const id = req.params.id;
      const filter = {_id :  new ObjectId(id) }
      const updatedBookings = req.body;
      console.log(updatedBookings);
      
      const updateDoc = {
        $set: {
          status: updatedBookings.status
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
      
    })

    // booking delete
    app.delete('/booking/:id', async (req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result);
    })

    // Get bookings based on user email (e.g., /booking?email=user@example.com)
    // app.get('/booking', async (req, res) => {
    //   try {
    //     const email = req.query.email; // Extract email from query parameters
    //     if (!email) {
    //       return res.status(400).json({ error: 'Email query parameter is required' });
    //     }

    //     const query = { email: email }; // Create a filter to find bookings by email
    //     const bookings = await bookingCollection.find(query).toArray(); // Fetch bookings from DB
    //     res.status(200).json(bookings); // Send bookings as JSON response
    //   } catch (error) {
    //     console.error("Error fetching bookings:", error);
    //     res.status(500).send("Internal Server Error");
    //   }
    // });






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//mongodb end


app.get('/', (req, res) => {
  res.send("doctor is running")
})


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})