const express = require('express');
const hbs = require('hbs');
const waxOn = require('wax-on');
// setup waxOn on handlebars
waxOn.on(hbs.handlebars);
waxOn.setLayoutPath("./views/layouts");
require('dotenv').config();

// use the version of mysql2 that support promises
// promises here TLDR: await/async
const mysql = require('mysql2/promise');

const app = express();


// use hbs as our 'view engine'
app.set('view engine', 'hbs')

async function main() {
    let connection = await mysql.createConnection({
        'host': process.env.DB_HOST,
        'user': process.env.DB_USER,
        'database': process.env.DB_DATABASE,
        'password': process.env.DB_PASSWORD
    })

    app.get('/', function (req, res) {
        const luckyNumber = Math.floor(Math.random() * 1000 + 1);
        // by default, res.render assume the file path is relative to the /views folder
        res.render('index', {
            'lucky': luckyNumber
        });
    })

    app.get('/customers', async function (req, res) {

        // connection.execute will return an array
        // but only index 0 contains the rows data
        // the other indexes contain meta data
        // [] is array destructuring
        // let [customers] = await connection.execute("...") 
        // is the same as:
        // let results = await connection.execute('...');
        // let customers = results[0];
        let [customers] = await connection.execute(`
                SELECT * FROM Customers JOIN Companies
                    ON Customers.company_id = Companies.company_id;
        `);
        res.render('customers/index', {
            customers: customers
        })
    })

    app.post('/customers', async function (req, res) {

    })

    app.get('/about-us', function (req, res) {
        res.render('about-us')
    })

    app.get('/contact-us', function (req, res) {
        res.render('contact-us')
    })
}
main();




app.listen(3000, function () {
    console.log("Express server has started")
})