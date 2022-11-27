/*************************************************************************
* BTI325– Assignment 4
* I declare that this assignment is my own work in accordance with Seneca Academic
Policy. No part * of this assignment has been copied manually or electronically from any
other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Kelvin Vora  Student ID: 157616210 Date: 13th Nov 2022
*
* Your app’s URL (from Heroku) : 
https://stark-everglades-40861.herokuapp.com/
*
**************************************************************************/

var express = require("express");
var multer = require("multer");
var exphbs = require('express-handlebars');
const Sequelize = require('sequelize');
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fs = require('fs');
var path = require("path");

var HTTP_PORT = process.env.PORT || 8080;
const data = require("./data-service.js");

function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}

app.use(express.static('public'));

const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

app.engine('.hbs', exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href=" ' + url + ' ">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));
app.set("view engine", ".hbs");

const upload = multer({ storage: storage });

// set up sequelize to point to our postgres database
var sequelize = new Sequelize('hzuhrafk', 'hzuhrafk', 'oCB59viJeMZ6FyO7FHhAS0T0oi0Xmvy1', {
    host: 'hansken.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

// sequelize.authenticate().then(function () {
//     console.log('Connection has been established successfully.');
// }).catch(function (err) {
//     console.log('Unable to connect to the database:', err);
// });

// Define a "Project" model

var Project = sequelize.define('Project', {
    project_id: {
        type: Sequelize.INTEGER,
        primaryKey: true, // use "project_id" as a primary key
        autoIncrement: true // automatically increment the value
    },
    title: Sequelize.STRING,
    description: Sequelize.TEXT
}, {
    createdAt: false, // disable createdAt
    updatedAt: false // disable updatedAt
});

// synchronize the Database with our models and automatically add the 
// table if it does not exist

sequelize.sync().then(function () {

    // create a new "Project" and add it to the database
    Project.create({
        title: 'Project1',
        description: 'First Project'
    }).then(function (project) {
        // you can now access the newly created Project via the variable project
        console.log("success!")
    }).catch(function (error) {
        console.log("something went wrong!");
    });
});

app.use(function (req, res, next) {
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
})

app.get("/", function (req, res) {
    res.render('home');
});

app.get("/about", function (req, res) {
    res.render('about')
});

app.get("/images/add", function (req, res) {
    res.render('addImage')
});

app.get("/employees/add", function (req, res) {
    res.render('addEmployee')
});

app.get("/employees", (req, res) => {
    if (req.query.status) {
        data.getEmployeesByStatus(req.query.status).then((data) => {
            res.render("employees", { employees: data })
        }).catch((err) => {
            res.json({ ERROR: err });
        })
    }
    else if (req.query.department) {
        data.getEmployeesByDepartment(req.query.department).then((data) => {
            res.render("employees", { employees: data })
        }).catch((err) => {
            res.json({ ERROR: err });
        })
    }
    else if (req.query.manager) {
        data.getEmployeesByManager(req.query.manager).then((data) => {
            res.render("employees", { employees: data })
        }).catch((err) => {
            res.render({ message: "no results" });
        })
    }
    else {
        data.getAllEmployees().then((data) => {
            res.render("employees", { employees: data })
        }).catch((err) => {
            res.render({ message: "no results" });
        });
    }
});

app.get("/departments", (req, res) => {
    data.getDepartments().then((data) => {
        res.render("departments", { departments: data });
    }).catch((err) => {
        console.log(err);
    });
});

app.get("/images", (req, res) => {
    fs.readdir("./public/images/uploaded", (err, items) => {
        if (err) {
            res.render({ message: "error opening the file!" });
        }
        else {
            res.render("images", { data: items });
        }
    });
});

app.post("/images/add", upload.single("imageFile"), (req, res) => {
    fs.readdir("./public/images/uploaded", (err, items) => {
        if (err) {
            console.log(err);
        }
        else {
            res.json({ images: items });
        }
    })
})

app.post("/employees/add", (req, res) => {
    data.addEmployee(req.body).then(() => {
        res.redirect("/employees")
    }).catch((err) => {
        console.log(err);
    });
});

app.get("/employee/:value", (req, res) => {
    data.getEmployeeByNum(req.params.value).then((data) => {
        res.render("employee", { employee: data });
    }).catch((err) => {
        res.render("employee", { message: "no results" });
    })
})

app.post("/employee/update", (req, res) => {
    data.updateEmployee(req.body).then(() => {
        res.redirect("/employees");
    }).catch((err) => {
        console.log(err);
    })
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/404.html"));
})

data.initialize().then(() => {
    app.listen(HTTP_PORT, onHttpStart);
}).catch((err) => {
    console.log(err);
})