/**
 * FINAL CMSC 335 PROJECT
 */

"use strict";

const path = require("path");
const express = require("express");   /* Accessing express module */
const app = express();  /* app is a request handler function */
const bodyParser = require("body-parser"); /* To handle post parameters */
const { type } = require("os");
const portNumber = process.argv[2];
const homeUrl = process.env.PORT || 4000; // https://dog-center.onrender.com/
const publicPath = path.resolve(__dirname);
app.use(express.static(publicPath));

/* directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));

/* view/templating engine */
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended:false})); // used for app.post

/* MongoDB stuff */
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env'), })  

const uri = process.env.MONGO_CONNECTION_STRING;

/* Our database and collection */
const databaseAndCollection = {db: "CMSC335DB", collection:"dogPhotos"};

const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

/* MongoDB functions */
/* For the Application pages */
async function insertApp(name, email, age, addInfo) {
    try {
        await client.connect();
       
        /* Inserting one app */
        // console.log("***** Inserting one app *****");
        let newApp = {name: name, email: email, age: age, addInfo: addInfo, dogs: []};
        await insertAppHelper(client, databaseAndCollection, newApp);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
async function insertAppHelper(client, databaseAndCollection, newApp) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newApp);
}

/* For the Review Application pages */
async function lookUpOneEntry(username) {
    let filter = {name: username};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);

    return result;
}

/* For the select GPA pages */
// async function lookUpMany(givenGpa) {
//     let filter = {gpa : { $gte: givenGpa}}; // >= (gpa: givenGpa)
//     const cursor = client.db(databaseAndCollection.db)
//     .collection(databaseAndCollection.collection)
//     .find(filter);

//     // Some Additional comparison query operators: $eq, $gt, $lt, $lte, $ne (not equal)
//     // Full listing at https://www.mongodb.com/docs/manual/reference/operator/query-comparison/
//     const result = await cursor.toArray();
//     return result;
//     // console.log(result);
// }

/* For the Remove All pages */
async function removeAll() {
    try {
        await client.connect();
        // console.log("***** Clearing Collection *****");
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
        // console.log(`Deleted documents ${result.deletedCount}`);
        return result.deletedCount;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}



/* Definining and Processing Endpoints (path and specific HTTP method) stuff */

/* This endpoint renders the main page of the application 
	and it will display the contents of the index.ejs template file. */
app.get("/", (request, response) => { 
    /* You implement */
    response.render("index");
});

app.get("/register", (request, response) => {
    const variables = {
        postUrl: homeUrl + "/registerSuccess",
    };
    response.render("register", variables);
});

app.post("/registerSuccess", (request, response) => {
    let {name, email, age, addInfo} = request.body;
    insertApp(name, email, age, addInfo);
    const variables = {
        header: "Registration Status",
        results: "Finished processing",
    };
    response.render("result", variables);
});

/* The following two endpoints handle the Application pages */
app.get("/adoption", (request, response) => { 
	/* You implement */ 
    const variables = {
        postUrl: homeUrl + "/adoptionSuccess",
    };

    response.render("adoption", variables);
});
app.post("/adoptionSuccess", (request, response) => { 
    /* Notice how we are extracting the values from request.body */
    async function adopt() {
        await client.connect();
        let reqName =  request.body.name;
        let result = await lookUpOneEntry(reqName);
        let variables;
        if (result != null) {
            let {name, email, age, addInfo, dogs} = result;
            const res = await fetch("https://dog.ceo/api/breeds/image/random");
            const json = await res.json();
            dogs.push(json.message);
            variables = {
                header: "Adoption Status",
                results: "Adoption Process for 1 Random Dog Finished",
            };
        } else {
            variables = {
                header: "Adoption Status",
                results: "Invalid User",
            };
        }
        /*try {
            let result = await lookUpOneEntry(reqName);


            let {name, email, age, addInfo, dogs} = result;
    
            let answer = "<h1>Applicants Data</h1>";
            answer += "<b>Name: </b>&nbsp" + name + "<br>";
            answer += "<b>Email: </b>&nbsp" + email + "<br>";
            answer += "<b>GPA: </b>&nbsp" + age + "<br>";
            answer += "<b>Background Information: </b><br>" + addInfo + "<br>";
            answer += "<a href=\"/\">HOME</a>";
    
            response.writeHead(statusCode, {"Content-type": "text/html"});
            response.end(answer);
        } catch (e) {}
        let name =  request.body;*/
        response.render("result", variables);
    }
    adopt();
});

/* The following two endpoints handle the Review Application pages */
app.get("/backyard", (request, response) => {
    const variables = {
        postUrl: homeUrl + "/yourBackyard",
        // homeUrl: localUrl,
    };

    response.render("backyard", variables);
});
app.post("/yourBackyard", (request, response) => { 
    /* Notice how we are extracting the values from request.body */
    
    //let statusCode = 200; // success!

    // console.log("reqEmail is "+reqEmail);

    //MongoDB function!!
    async function backyard() {
        await client.connect();
        let reqName = request.body.name;
        let result = await lookUpOneEntry(reqName);
        let variables;
        if(result != null) {
            let {name, email, age, addInfo, dogs} = result;
            let images = "";
            let count = 1;
            dogs.forEach((entry) => {
                images += `<img src=${entry} width="100" height="200" alt="dog${count}>`
                count++;
            });
            variables = {
                header: "Backyard",
                results: images,
            };
        } else {
            variables = {
                header: "Backyard",
                results: "Invalid User",
            };
        }
        response.render("result", variables);
        /*try {
            let result = await lookUpOneEntry(reqName);

            let {name, email, age, addInfo, dogs} = result;
    
            let answer = "<h1>Applicants Data</h1>";
            answer += "<b>Name: </b>&nbsp" + name + "<br>";
            answer += "<b>Email: </b>&nbsp" + email + "<br>";
            answer += "<b>GPA: </b>&nbsp" + age + "<br>";
            answer += "<b>Background Information: </b><br>" + addInfo + "<br>";
            answer += "<a href=\"/\">HOME</a>";
    
            response.writeHead(statusCode, {"Content-type": "text/html"});
            response.end(answer);
        } catch (e) {
            // console.error(e);

            let answer = "<h1>Applicants Data</h1>";
            answer += "<b>Name: </b>&nbspNONE<br>";
            answer += "<b>Email: </b>&nbspNONE<br>";
            answer += "<b>GPA: </b>&nbspNONE<br>";
            answer += "<b>Background Information: </b><br>NONE<br>";
            answer += "<a href=\"/\">HOME</a>";
    
            response.writeHead(statusCode, {"Content-type": "text/html"});
            response.end(answer);
        } finally {
            await client.close();
        }*/
    }
    backyard();
});

/* The following two endpoints handle the 'Remove Applicants' pages */
app.get("/returnDog", (request, response) => {
    const variables = {
        postUrl: homeUrl+ "/processReturnDog",
        // homeUrl: localUrl,
    };

    response.render("returnDog", variables);
});
app.post("/processReturnDog", (request, response) => { 
    async function remove() { 
        
        let numberRemoved = await removeAll(); // no need for client.connect() because it's in removeAll()
  
        const variables = {
            header: "Remove All Users and Their Adopted Dogs",
            results: "All Applications have been removed from the database. Number of applications removed: " + numberRemoved + "<br><br><br>",
        };
        response.render("result", variables);
    }
    remove();
});

/* Important */
app.listen(portNumber);
process.stdin.setEncoding("utf8");

/* Command Prompt - stops if incorrect num of arguments */
// if (process.argv.length != 3) {
//   process.stdout.write(`Usage supermarketServer.js portNum`);
//   process.exit(1);
// }

console.log(`Web server started and running at http://localhost:${portNumber}`);



/* Command Prompt stuff */
const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);	// process.stdout.write writes the argument into the console
process.stdin.on("readable", function () {
	const dataInput = process.stdin.read();	// stream for stdin like input() from Python
	if (dataInput !== null) {
		const command = dataInput.trim();

	if (command === "stop") {
		process.stdout.write("Shutting down the server\n");	// stream for stdout
		process.exit(0);
	
	} else {
		process.stdout.write(`Invalid command: ${command}\n`)
	}
	process.stdout.write(prompt);
	process.stdin.resume();	// allows looping back to process.std.read() if invalid command
	}
});