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

        // get the search terms from req.query
        const { first_name, last_name } = req.query;

        let basicQuery = `SELECT * FROM Customers JOIN Companies
                    ON Customers.company_id = Companies.company_id WHERE 1`

        const bindings = [];

        // if the user entered a first name, modif the basic quer
        // with a WHERE at the back to search for it
        if (first_name) {
            basicQuery = basicQuery + " AND first_name = ?";
            bindings.push(first_name);
        }

        if (last_name) {
            basicQuery = basicQuery + " AND last_name = ?";
            bindings.push(last_name);
        }

        console.log(basicQuery);

        // connection.execute will return an array
        // but only index 0 contains the rows data
        // the other indexes contain meta data
        // [] is array destructuring
        // let [customers] = await connection.execute("...") 
        // is the same as:
        // let results = await connection.execute('...');
        // let customers = results[0];
        let [customers] = await connection.execute(basicQuery, bindings);
        res.render('customers/index', {
            customers: customers,
            first_name, last_name
        })
    })

    app.get('/customers/create', async function (req, res) {
        const [companies] = await connection.execute(`SELECT company_id, name FROM Companies`);
        const [employees] = await connection.execute(`SELECT employee_id, first_name, last_name FROM Employees`);

        res.render('customers/create', {
            companies: companies,
            employees: employees
        })
    })

    app.post('/customers/create', async function (req, res) {

        try {
            await connection.beginTransaction();
            const { first_name, last_name, rating, company_id } = req.body;
            const sql = ` INSERT INTO Customers (first_name, last_name, rating, company_id)
                    VALUES (?, ?, ?, ?);`
            const bindings = [first_name, last_name, rating, company_id];
            // prepared statements - it's a defense against SQL Injection
            const [results] = await connection.execute(sql, bindings);

            // get the primary key (aka the customer_id) of the newly created customer
            const customerId = results.insertId;

            if (req.body.employees) {
                for (let employee of req.body.employees) {
                    const sql = `INSERT INTO EmployeeCustomer (employee_id, customer_id) VALUES (?,?)`;
                    const bindings = [employee, customerId];
                    await connection.execute(sql, bindings);
                }
            }

            await connection.commit(); // changes to the database is finalized
            res.redirect('/customers'); // tells browser to go to send a URL

        } catch (e) {
            await connection.rollback(); // undo every change done so far
            res.redirect('/customers');
        }

    })

    app.get('/customers/:id/update', async function (req, res) {
        const customerId = req.params.id;
        const [rows] = await connection.execute(`SELECT * FROM Customers WHERE customer_id = ?`, [customerId]);
        const [companies] = await connection.execute(`SELECT * FROM Companies`);
        const [employees] = await connection.execute(`SELECT * FROM Employees`);
        const [currentEmployees] = await connection.execute(`SELECT * FROM EmployeeCustomer WHERE customer_id = ?`, [customerId]);
        // exmaple: currentEmployees will be an array of two objects:
        // [ {employee_id: 2, customer_id:10}, {employee_id:3, customer_id:10}]
        // but the goal is to extract the employee_id ONLY and put them in an array (i,e [2, 3]);
        const currentEmployeeIDs = currentEmployees.map(employee => employee.employee_id);

        res.render('customers/update', {
            customer: rows[0],
            companies,
            employees,
            currentEmployeeIDs
        });
    })

    app.post('/customers/:id/update', async function (req, res) {
        try {
            await connection.beginTransaction();

            const customerId = req.params.id;
            const { first_name, last_name, rating, company_id } = req.body;

            await connection.execute(`
            UPDATE Customers SET first_name=?, last_name=?, rating=?, company_id=?
            WHERE customer_id = ?`, [first_name, last_name, rating, company_id, customerId]);

            //  For updating many to many relationships
            // 1. DELETE ALL existing the relationships
            // 2. RE-INSERT the relationships based on the form
            await connection.execute(`DELETE FROM EmployeeCustomer WHERE customer_id = ?`, [customerId]);

            if (req.body.employees) {
                for (let employee of req.body.employees) {
                    const sql = `INSERT INTO EmployeeCustomer (employee_id, customer_id) VALUES (?,?)`;
                    const bindings = [employee, customerId];
                    await connection.execute(sql, bindings);
                }
            }

            await connection.commit();
            res.redirect('/customers');
        } catch (e) {
            await connection.rollback();
            res.redirect('/customers');
        }

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