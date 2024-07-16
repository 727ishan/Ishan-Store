const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Razorpay = require('razorpay');

const app = express();
const PORT = process.env.PORT || 3000;

const razorpay = new Razorpay({
    key_id: 'rzp_test_iZNBELNqkzg7fM',
    key_secret: '0ONmbzhG6HmoXkYeXJPFydl1'
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

const sampleProducts = [
    { id: 1, name: 'Synthwave Pack', price: 5000, imageUrl: 'https://synthanatomy.com/wp-content/uploads/2022/04/AIR-Music-Tech-Akai-MPC-Instruments.001-678x381.jpeg', downloadLink: 'https://bit.ly/1GB-testfile.zip' },
    { id: 2, name: "Lo-Fi Beats Pack", price: 3000, imageUrl: 'https://preview.redd.it/0n44qe5nu5721.png?width=1264&format=png&auto=webp&s=72200ce1843f609c50cf374de9ad8aaac175e67f', downloadLink: 'https://file-examples.com/wp-content/storage/2017/02/zip_2MB.zip' },
    { id: 3, name: "Lo-Fi Beats Pack", price: 3000, imageUrl: 'https://preview.redd.it/0n44qe5nu5721.png?width=1264&format=png&auto=webp&s=72200ce1843f609c50cf374de9ad8aaac175e67f', downloadLink: 'https://file-examples.com/wp-content/storage/2017/02/zip_2MB.zip' },
];

const cart = [];

app.get('/', (req, res) => {
    res.render('index', { products: sampleProducts, cart: cart });
});

app.post('/add-to-cart', (req, res) => {
    const productId = req.body.productId;
    const product = sampleProducts.find(p => p.id === parseInt(productId));
    if (product) {
        cart.push(product);
        res.status(200).send('Product added to cart');
    } else {
        res.status(404).send('Product not found');
    }
});

app.get('/cart', (req, res) => {
    res.render('cart', { cart });
});

app.post('/payment-success', (req, res) => {
    const { purchasedItems } = req.body;
    res.render('payment-success', { purchasedItems });
});


app.get('/payment-failed', (req, res) => {
    res.render('payment-failed');
});

app.post('/create-order', async (req, res) => {
    try {
        const amount = cart.reduce((acc, item) => acc + item.price, 0) * 100;
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: 'order_rcptid_11'
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send('Error creating order. Please try again later.');
    }
});

app.post('/remove-from-cart', (req, res) => {
    const productId = req.body.productId;
    const index = cart.findIndex(item => item.id === parseInt(productId));
    if (index !== -1) {
        cart.splice(index, 1);
        res.redirect('/cart');
    } else {
        res.status(404).send('Product not found in cart');
    }
});

app.post('/payment-callback', (req, res) => {
    const paymentDetails = req.body;
    const paymentSuccessful = true; // Simulate payment success or failure based on your logic

    const purchasedItems = [...cart]; // Assume `cart` is where items are stored
    cart.length = 0; // Clear the cart after purchase

    res.status(200).json({ success: paymentSuccessful, purchasedItems });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
