import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();
app.use(bodyParser.json());

app.use('/images', express.static(path.join(__dirname, '../assets')));

// GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {
    const client = await MongoClient.connect(
        'mongodb://127.0.0.1:27017',
        { useNewUrlParser: true, useUnifiedTopology: true },
    );
    const db = client.db('vue-db');
    const products = await db.collection('products').find({}).toArray();
    res.status(200).json(products);
    client.close();
});

// GET USER CART ITEMS
app.get('/api/users/:userId/cart', async (req, res) => {
    const { userId } = req.params;

    const client = await MongoClient.connect(
        'mongodb://127.0.0.1:27017',
        { useNewUrlParser: true, useUnifiedTopology: true },
    );
    const db = client.db('vue-db');
    const user = await db.collection('users').findOne({ id: userId });

    if (!user) {
        return res.status(404).json('Could not find the user!');
    }
    const product = await db.collection('products').find({}).toArray();
    const cartItemIds = user.cartItems;

    const cartItems = cartItemIds.map(
        id => (
            product.find(product => product.id === id)
        )
    );

    res.status(200).json(cartItems);
    client.close();
});

// GET PRODUCT BY ID
app.get('/api/products/:productId', async (req, res) => {
    const { productId } = req.params;

    const client = await MongoClient.connect(
        'mongodb://127.0.0.1:27017',
        { useNewUrlParser: true, useUnifiedTopology: true },
    );
    const db = client.db('vue-db');
    const products = await db.collection('products').findOne({ id: productId });

    if (products) {
        res.status(200).json(products);
    } else {
        res.status(400).json('Could not find the product!');
    }
});

// ADD ITEM TO USER CART
app.post('/api/users/:userId/cart', async (req, res) => {
    const { userId } = req.params;
    const { productId } = req.body;

    const client = await MongoClient.connect(
        'mongodb://127.0.0.1:27017',
        { useNewUrlParser: true, useUnifiedTopology: true },
    );
    const db = client.db('vue-db');
    await db.collection('users').updateOne({ id: userId }, {
        $addToSet: { cartItems: productId },
    });

    const user = await db.collection('users').findOne({ id: userId });
    const products = await db.collection('products').find({}).toArray();
    const cartItemIds = user.cartItems;
    const cartItems = cartItemIds.map(id =>
        products.find(product => product.id === id)
    );

    res.status(200).json(cartItems);
    client.close();
});

// DELETE FROM CART
app.delete('/api/users/:userId/cart/:productId', async (req, res) => {
    const { userId, productId } = req.params;
    const client = await MongoClient.connect(
        'mongodb://127.0.0.1:27017',
        { useNewUrlParser: true, useUnifiedTopology: true },
    );
    const db = client.db('vue-db');

    await db.collection('users').updateOne({ id: userId }, {
        $pull: { cartItems: productId },
    });
    const user = await db.collection('users').findOne({ id: userId });
    const products = await db.collection('products').find({}).toArray();
    const cartItemIds = user.cartItems;
    const cartItems = cartItemIds.map(id =>
        products.find(product => product.id === id));

    res.status(200).json(cartItems);
    client.close();
});
app.listen(8000, () => {
    console.log('Server is listening on port 8000');
});