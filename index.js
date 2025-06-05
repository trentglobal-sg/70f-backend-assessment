const express = require('express');
const hbs = require('hbs');
const waxOn = require('wax-on');
// setup waxOn on handlebars
waxOn.on(hbs.handlebars);
waxOn.setLayoutPath("./views/layouts");

const app = express();

// use hbs as our 'view engine'
app.set('view engine', 'hbs')

app.get('/', function(req,res){
    const luckyNumber = Math.floor(Math.random() * 1000 + 1);
    // by default, res.render assume the file path is relative to the /views folder
    res.render('index', {
        'lucky': luckyNumber
    });
})

app.get('/about-us', function(req,res){
    res.render('about-us')
})

app.get('/contact-us', function(req,res){
    res.render('contact-us')
})

app.listen(3000, function(){
    console.log("Express server has started")
})