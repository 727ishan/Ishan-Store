const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer'); 

mongoose.connect('mongodb://localhost:27017/i-store', { useNewUrlParser: true, useUnifiedTopology: true });

const orderSchema = new mongoose.Schema({
    name: String,
    email: String,
    contact: String,
    address: String,
    purchasedItems: Array
});

const Order = mongoose.model('Order', orderSchema);

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

let cart = [];

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
        const { userDetails } = req.body;
        const amount = cart.reduce((acc, item) => acc + item.price, 0) * 100;
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: 'order_rcptid_11'
        };
        const order = await razorpay.orders.create(options);
        res.json({ ...order, userDetails });
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

app.post('/payment-callback', async (req, res) => {
    const paymentDetails = req.body;
    console.log('Payment Details:', paymentDetails);
    const paymentSuccessful = true; 

    const purchasedItems = [...cart]; 
    cart.length = 0; // Clear the cart after purchase

    // Save order details to MongoDB
    const newOrder = new Order({
        ...paymentDetails.userDetails,
        purchasedItems: purchasedItems
    });

    try {
        await newOrder.save();
        console.log('Order saved:', newOrder);

        // Send email to user
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ishansinghchouhan0@gmail.com',
                pass: 'auze fraa twyt yujc'
            }
        });

        const mailOptions = {
            from: 'ishansinghchouhan0@gmail.com',
            to: newOrder.email,
            subject: 'Your Purchase Details',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1 style="color: #4CAF50;">Thank You for Your Purchase!</h1>
                    <p>Dear ${newOrder.name},</p>
                    <p>We appreciate your business. Here are the details of your purchase:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid #ddd; padding: 12px; background-color: #f2f2f2;">Product Image</th>
                                <th style="border: 1px solid #ddd; padding: 12px; background-color: #f2f2f2;">Name</th>
                                <th style="border: 1px solid #ddd; padding: 12px; background-color: #f2f2f2;">Price</th>
                                <th style="border: 1px solid #ddd; padding: 12px; background-color: #f2f2f2;">Download Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${purchasedItems.map(item => `
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 12px;">
                                        <img src="${item.imageUrl}" alt="${item.name}" style="width: 100px; height: auto;">
                                    </td>
                                    <td style="border: 1px solid #ddd; padding: 12px;">${item.name}</td>
                                    <td style="border: 1px solid #ddd; padding: 12px;">${item.price} INR</td>
                                    <td style="border: 1px solid #ddd; padding: 12px;">
                                        <a href="${item.downloadLink}" style="color: #4CAF50; text-decoration: none;">Download</a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p>If you have any questions or need further assistance, feel free to reply to this email.</p>
                    <p>Best regards,<br>Ishan Music Production Team</p>
                    <p style="margin-top: 20px;">
                        <a href="/" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
                            Return to IshanSite
                        </a>
                    </p>
                    <footer style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd;">
                        <p style="font-size: 0.9em; color: #555;">
                            © 2024 Ishan Singh Chouhan. All rights reserved.<br>
                            Visit our <a href="/" style="color: #4CAF50; text-decoration: none;">Homepage</a> for more amazing products.
                        </p>
                    </footer>
                </div>
            `
        };


        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending email. Please try again later.');
            }
            console.log('Email sent:', info.response);
            res.status(200).json({ success: paymentSuccessful, purchasedItems });
        });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).send('Error saving order. Please try again later.');
    }
});

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
