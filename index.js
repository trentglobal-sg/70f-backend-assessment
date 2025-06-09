const express = require('express');
const hbs = require('hbs');
const waxOn = require('wax-on');
// setup waxOn on handlebars
waxOn.on(hbs.handlebars);
waxOn.setLayoutPath("./views/layouts");

// handlebars helpers setup
const helpers = require('handlebars-helpers');
helpers({
    'handlebars': hbs.handlebars
})


require('dotenv').config();

// use the version of mysql2 that support promises
// promises here TLDR: await/async
const mysql = require('mysql2/promise');

const app = express();

// use hbs as our 'view engine'
app.set('view engine', 'hbs')
// this enables form processing (former people use body-parser)
app.use(express.urlencoded({
    extended: true  // true allow forms to contain arrays and objects
}))

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

    app.get('/customers/create', async function (req, res) {
        const [companies] = await connection.execute(`SELECT company_id, name FROM Companies`);

        res.render('customers/create', {
            companies: companies
        })
    })

    app.post('/customers/create', async function (req, res) {
        const { first_name, last_name, rating, company_id } = req.body;
        const sql = ` INSERT INTO Customers (first_name, last_name, rating, company_id)
  VALUES (?, ?, ?, ?);`
        const bindings = [first_name, last_name, rating, company_id];
        // prepared statements - it's a defense against SQL Injection
        await connection.execute(sql, bindings)

        res.redirect('/customers'); // tells browser to go to send a URL

    })

    app.get('/customers/:id/update', async function(req,res){
        const customerId = req.params.id;
        const [rows] = await connection.execute(`SELECT * FROM Customers WHERE customer_id = ?`, [customerId]);
        const [companies] = await connection.execute(`SELECT * FROM Companies`);
        res.render('customers/update', {
            customer: rows[0],
            companies
        });
    })

    app.post('/customers/:id/update', async function(req,res){
        const customerId = req.params.id;
        const {first_name, last_name, rating, company_id} = req.body;
        await connection.execute(`
            UPDATE Customers SET first_name=?, last_name=?, rating=?, company_id=?
            WHERE customer_id = ?`, [first_name, last_name, rating, company_id, customerId ]);
        res.redirect('/customers');
    })

    app.get('/customers/:id/delete', async function (req, res) {
        const customerId = req.params.id;
        // even if there's only one result, connection.execute will return an array
        const [rows] = await connection.execute(`SELECT * FROM Customers WHERE customer_id = ?`, [customerId]);
        const customer = rows[0];
        res.render('customers/delete', {
            customer
        })

    })

    app.post('/customers/:id/delete', async function (req, res) {
        try {
            const customerId = req.params.id;
            await connection.execute("DELETE FROM Sales WHERE customer_id = ?", [customerId]);
            await connection.execute("DELETE FROM EmployeeCustomer WhERE customer_id = ?", [customerId]);
            await connection.execute(`DELETE FROM Customers WHERE customer_id = ?`, [customerId]);
            res.redirect('/customers');
        } catch (e) {
            console.log(e);
            res.send("Unable to delete because of relationship. Press [BACK] and try again")
        } 
    })

    app.get('/about-us', function (req, res) {
        res.render('about-us')
    })

    app.get('/contact-us', function (req, res) {
        res.render('contact-us')
    })

    // READ EMPLOYEES: DISPLAY ALL THE EMPLOYEES
    app.get('/employees', async function (req, res) {
        const [employees] = await connection.query(`SELECT * FROM Employees JOIN Departments
   ON Employees.department_id = Departments.department_id`);

        res.render('employees/index', {
            employees
        })
    });


    app.get('/employees/create', async function (req, res) {
        const [departments] = await connection.execute(`SELECT * FROM Departments`);
        res.render('employees/create', {
            departments
        })
    })

    app.post('/employees/create', async function (req, res) {
        try {
            const bindings = [req.body.first_name, req.body.last_name, req.body.department_id];
            await connection.execute(`INSERT INTO Employees (first_name, last_name, department_id) 
                VALUES (?,?,?)`, bindings);
        } catch (e) {
            console.log(e);
        } finally {
            res.redirect('/employees');
        }
    })
}
main();




app.listen(3000, function () {
    console.log("Express server has started")
})