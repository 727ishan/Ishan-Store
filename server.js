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
    { id: 1, name: 'Synthwave Essentials Pack', price: 5000, imageUrl: 'https://synthanatomy.com/wp-content/uploads/2022/04/AIR-Music-Tech-Akai-MPC-Instruments.001-678x381.jpeg' },
    { id: 2, name: "Lo-Fi Beats Pack", price: 3000, imageUrl: 'https://preview.redd.it/0n44qe5nu5721.png?width=1264&format=png&auto=webp&s=72200ce1843f609c50cf374de9ad8aaac175e67f' },
    { id: 3, name: 'EDM Essentials Pack', price: 10000, imageUrl: 'https://cdn.mos.cms.futurecdn.net/onpq9NFu4kos2ouKEatrgK-650-80.jpg.webp' },
    { id: 4, name: "Trap Beats Pack", price: 6000, imageUrl: 'https://preview.redd.it/0n44qe5nu5721.png?width=1264&format=png&auto=webp&s=72200ce1843f609c50cf374de9ad8aaac175e67f' },
    { id: 5, name: 'Vintage Drum Machine Pack', price: 4500, imageUrl: 'https://synthanatomy.com/wp-content/uploads/2022/04/AIR-Music-Tech-Akai-MPC-Instruments.001-678x381.jpeg' },
    { id: 6, name: "Ambient Sounds Pack", price: 3200, imageUrl: 'https://preview.redd.it/0n44qe5nu5721.png?width=1264&format=png&auto=webp&s=72200ce1843f609c50cf374de9ad8aaac175e67f' },
    { id: 7, name: 'Orchestral Strings Pack', price: 11000, imageUrl: 'https://cdn.mos.cms.futurecdn.net/onpq9NFu4kos2ouKEatrgK-650-80.jpg.webp' },
    { id: 8, name: "Hip-Hop Drums Pack", price: 2800, imageUrl: 'https://preview.redd.it/0n44qe5nu5721.png?width=1264&format=png&auto=webp&s=72200ce1843f609c50cf374de9ad8aaac175e67f' },
    { id: 9, name: 'Analog Synth Pack', price: 4800, imageUrl: 'https://synthanatomy.com/wp-content/uploads/2022/04/AIR-Music-Tech-Akai-MPC-Instruments.001-678x381.jpeg' },
    { id: 10, name: "Dubstep Bass Pack", price: 2900, imageUrl: 'https://preview.redd.it/0n44qe5nu5721.png?width=1264&format=png&auto=webp&s=72200ce1843f609c50cf374de9ad8aaac175e67f' },
    { id: 11, name: 'Analog Synth Pack', price: 9500, imageUrl: 'https://cdn.mos.cms.futurecdn.net/onpq9NFu4kos2ouKEatrgK-650-80.jpg.webp' },
    { id: 12, name: "Psytrance Essentials Pack", price: 3400, imageUrl: 'https://preview.redd.it/0n44qe5nu5721.png?width=1264&format=png&auto=webp&s=72200ce1843f609c50cf374de9ad8aaac175e67f' },
    { id: 13, name: 'Retro Drum Machine Pack', price: 5200, imageUrl: 'https://synthanatomy.com/wp-content/uploads/2022/04/AIR-Music-Tech-Akai-MPC-Instruments.001-678x381.jpeg' },
    { id: 14, name: "Indie Rock Drums Pack", price: 3100, imageUrl: 'https://preview.redd.it/0n44qe5nu5721.png?width=1264&format=png&auto=webp&s=72200ce1843f609c50cf374de9ad8aaac175e67f' },
    { id: 15, name: 'World Percussion Pack', price: 10200, imageUrl: 'https://cdn.mos.cms.futurecdn.net/onpq9NFu4kos2ouKEatrgK-650-80.jpg.webp' },
    { id: 16, name: "Future Bass Essentials Pack", price: 3700, imageUrl: 'https://preview.redd.it/0n44qe5nu5721.png?width=1264&format=png&auto=webp&s=72200ce1843f609c50cf374de9ad8aaac175e67f' },
];


// { id: 4, name: 'Pink Akram', price: 9000, imageUrl: '/images/PinkAk.jpeg' },
// { id: 5, name: 'Akram khan', price: 19000, imageUrl: '/images/PinkAk.jpeg' },

const cart = [];

app.get('/', (req, res) => {
    res.render('index');
});

// app.get('/shop', (req, res) => {
//     res.render('shop', { products: sampleProducts });
// });

app.get('/shop', (req, res) => {
    res.render('shop', { products: sampleProducts, cart: cart }); // Pass the cart variable here
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

app.post('/create-order', async (req, res) => {
    const amount = cart.reduce((acc, item) => acc + item.price, 0);

    const options = {
        amount: amount * 100, // amount in the smallest currency unit
        currency: 'INR',
        receipt: 'order_rcptid_11'
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Item removal from cart
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

// Payment callback=
app.post('/payment-callback', (req, res) => {
    const downloadLink = "https://bit.ly/1GB-testfile"; 

    const paymentSuccessful = true; 

    if (paymentSuccessful) {
        cart.length = 0;

        res.render('payment-success', { downloadLink });
    } else {
        res.status(400).send('Payment failed. Please try again.');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
