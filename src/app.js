const express = require('express')
const app = express()
const engines = require('consolidate');
var bodyParser = require('body-parser')
const path = require('path')
app.use(bodyParser.urlencoded({ extended: false }));
const hbs = require('hbs')
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const flash = require('connect-flash');
const session = require('express-session');

app.use(session({
    cookie: { maxAge: 60000 },
    secret: 'woot',
    resave: false,
    saveUninitialized: false
}))
app.use(flash());
// Connection URL
const url = 'mongodb+srv://databasestudent:123456a@cluster0.aapp4.mongodb.net/test';

// Database Name
const dbName = 'MyStore'
// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

// Setup handlebars engine and views location
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

// Setup static directory to serve
app.use(express.static(publicDirectoryPath))

app.get('', async (req, res) => {
    let client = await MongoClient.connect(url);
    let dbo = client.db(dbName);
    let result = await dbo.collection('Product').find({}).toArray()
    res.render('index',
        {
            product: result
        })
})

app.get('/product', async (req, res) => {
    let client = await MongoClient.connect(url);
    let dbo = client.db(dbName);
    let result = await dbo.collection('Product').find({}).toArray()
    res.render('product',
        {
            product: result
        })
})

app.post('/doUpdate', async (req, res) => {
    let input_id = req.body.id;
    let inputProductName = req.body.productName;
    let inputProductPrice = req.body.productPrice;
    let inputDesciption = req.body.desciption;
    let inputImage = req.body.image;
    var ObjectID = require('mongodb').ObjectID
    let client = await MongoClient.connect(url);
    let dbo = client.db(dbName);
    let find = await dbo.collection('Product').find({ _id: ObjectID(input_id.toString()) }).toArray()
    let ngu = await dbo.collection('Product').updateOne({ "_id": ObjectID(input_id.toString()) },
        { $set: { NameProduct: inputProductName.toString(), Price: inputProductPrice.toString(), Desciption: inputDesciption.toString(), Image: inputImage.toString() } })
    res.redirect('/product')
})
// Use connect method to connect to the server
app.post('/doInsert', async (req, res) => {

    let inputProductName = req.body.productName;
    let inputProductPrice = req.body.productPrice;
    let inputDesciption = req.body.desciption;
    let inputImage = req.body.image;
    for(let i = 0; i < 10; i++){
        if(inputProductName.includes(""+i)){
            req.flash('error','Do not input number');
            res.redirect('/insert');
            return false;
        }
    }
    if (inputProductPrice > 30) {
        req.flash('error','Price had must be a  positive number');
        res.redirect('/insert');
        return false;
    }  else if (inputProductName.length < 4){
        req.flash('error', 'Name must be greater than 4 character');
        res.redirect('/insert');
        return false;
    }
    else {
        let newProduct = { NameProduct: inputProductName, Price: inputProductPrice, Desciption: inputDesciption, Image: inputImage };
        let client = await MongoClient.connect(url);
        let dbo = client.db(dbName);
        await dbo.collection('Product').insertOne(newProduct);
        res.redirect('/product');
    }
});

app.get('/remove', async (req, res) => {
    let id = req.query.id
    var ObjectID = require('mongodb').ObjectID
    let client = await MongoClient.connect(url);
    let dbo = client.db(dbName);
    await dbo.collection('Product').deleteOne({ _id: ObjectID(id) })
    res.redirect('/product')
})

app.get('/search', async (req, res) => {
    let key = req.query.search.trim();

    let client = await MongoClient.connect(url);
    let dbo = client.db(dbName);
    let result = await dbo.collection('Product').find({ NameProduct: { $regex: key, $options: 'i' } }).toArray();
    // console.log(result);
    res.render('product', { product: result });
});

app.get('/update', async (req, res) => {
    let id = req.query.id;
    var ObjectID = require('mongodb').ObjectID
    let client = await MongoClient.connect(url);
    let dbo = client.db(dbName);
    let result = await dbo.collection('Product').find({ _id: ObjectID(id.toString()) }).toArray()
    res.render('update', { product: result })

})
app.get('/insert', (req, res) => {
    let message= req.flash('error');
    let error_zero;
    let error_one;
    if (message.length > 0) {
        error_zero = message[0];
        error_one = message[1];
    } else {
        error_zero = null;
        error_one = null;
    }

    res.render('insert', { error_zero: error_zero, error_one : error_one });
})

const PORT = process.env.PORT || 4000;
app.listen(PORT);