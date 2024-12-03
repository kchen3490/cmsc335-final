/**
 * Project 5 created by Kai C., 11/24/2024
 */

"use strict";

const fs = require("fs");
const path = require("path");
const express = require("express");   /* Accessing express module */
const app = express();  /* app is a request handler function */
const bodyParser = require("body-parser"); /* To handle post parameters */
const { type } = require("os");
const portNumber = process.argv[2];
const localUrl = `http://localhost:${portNumber}`;

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
const databaseAndCollection = {db: "CMSC335DB", collection:"campApplicants"};

const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

/* MongoDB functions */
/* For the Application pages */
async function insertApp(name, email, gpa, bgInfo) {
    try {
        await client.connect();
       
        /* Inserting one app */
        // console.log("***** Inserting one app *****");
        let newApp = {name: name, email: email, gpa: gpa, bgInfo, bgInfo};
        await insertAppHelper(client, databaseAndCollection, newApp);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
async function insertAppHelper(client, databaseAndCollection, newApp) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newApp);

    // console.log(`App entry created with id ${result.insertedId}`);
}

/* For the Review Application pages */
async function lookUpOneEntry(appEmail) {
    let filter = {email: appEmail};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);

    return result;
//    if (result) {
//        console.log(result);
//    } else {
//        console.log(`No email found with address ${appEmail}`);
//    }
}

/* For the select GPA pages */
async function lookUpMany(givenGpa) {
    let filter = {gpa : { $gte: givenGpa}}; // >= (gpa: givenGpa)
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);

    // Some Additional comparison query operators: $eq, $gt, $lt, $lte, $ne (not equal)
    // Full listing at https://www.mongodb.com/docs/manual/reference/operator/query-comparison/
    const result = await cursor.toArray();
    return result;
    // console.log(result);
}

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

/* The following two endpoints handle the Application pages */
app.get("/apply", (request, response) => { 
	/* You implement */ 
    const variables = {
        postUrl: localUrl + "/processApplication",
        homeUrl: "\"" + localUrl + "\"",
    };

    response.render("application", variables);
});
app.post("/processApplication", (request, response) => { 
    /* Notice how we are extracting the values from request.body */
    let {name, email, gpa, bgInfo} =  request.body;
    let statusCode = 200; // success!

    insertApp(name, email, gpa, bgInfo).catch(console.error); // MongoDB funtion!!

    let answer = "<h1>Applicants Data</h1>";
    answer += "<b>Name: </b>&nbsp" + name + "<br>";
    answer += "<b>Email: </b>&nbsp" + email + "<br>";
    answer += "<b>GPA: </b>&nbsp" + gpa + "<br>";
    answer += "<b>Background Information: </b><br>" + bgInfo + "<br>";
    answer += "<hr><b>Task completed at <!--#echo var=\"DATE_LOCAL\" --></b><hr>"; // rubric says this is not required
    answer += "<a href=\"" + localUrl + "\">HOME</a>";

    response.writeHead(statusCode, {"Content-type": "text/html"});
    response.end(answer);
});

/* The following two endpoints handle the Review Application pages */
app.get("/reviewApplication", (request, response) => {
    const variables = {
        postUrl: localUrl + "/processReviewApplication",
        homeUrl: "\"" + localUrl + "\"",
    };

    response.render("reviewApp", variables);
});
app.post("/processReviewApplication", (request, response) => { 
    /* Notice how we are extracting the values from request.body */
    let reqEmail =  request.body.email;
    let statusCode = 200; // success!

    // console.log("reqEmail is "+reqEmail);

    //MongoDB function!!
    async function main() {
        await client.connect();

        try {
            let result = await lookUpOneEntry(reqEmail);

            let {name, email, gpa, bgInfo} = result;
    
            let answer = "<h1>Applicants Data</h1>";
            answer += "<b>Name: </b>&nbsp" + name + "<br>";
            answer += "<b>Email: </b>&nbsp" + email + "<br>";
            answer += "<b>GPA: </b>&nbsp" + gpa + "<br>";
            answer += "<b>Background Information: </b><br>" + bgInfo + "<br>";
            answer += "<a href=\"" + localUrl + "\">HOME</a>";
    
            response.writeHead(statusCode, {"Content-type": "text/html"});
            response.end(answer);
        } catch (e) {
            // console.error(e);

            let answer = "<h1>Applicants Data</h1>";
            answer += "<b>Name: </b>&nbspNONE<br>";
            answer += "<b>Email: </b>&nbspNONE<br>";
            answer += "<b>GPA: </b>&nbspNONE<br>";
            answer += "<b>Background Information: </b><br>NONE<br>";
            answer += "<a href=\"" + localUrl + "\">HOME</a>";
    
            response.writeHead(statusCode, {"Content-type": "text/html"});
            response.end(answer);
        } finally {
            await client.close();
        }
}
    main();
});

/* The following two endpoints handle the 'Select by GPA' pages */
app.get("/adminGFA", (request, response) => {
    const variables = {
        postUrl: localUrl + "/processAdminGFA",
        homeUrl: "\"" + localUrl + "\"",
    };

    response.render("selectGpa", variables);
});
app.post("/processAdminGFA", (request, response) => { 
    /* Notice how we are extracting the values from request.body */
    let reqGpa =  request.body.gpa;
    // let {name, email, bgInfo} = ; // MongoDB stuff
    let statusCode = 200; // success!

    //MongoDB function!!
    async function main() {
        await client.connect();

        try {
            let result = await lookUpMany(reqGpa);
            // console.log(result);

            if (result.length == 0) {
                let answer = "<h1>Display GFAs Greater than or Equal to</h1><br><br>";
                answer += "<b>NONE<b><br><br>";
                answer += "<a href=\"" + localUrl + "\">HOME</a>";
        
                response.writeHead(statusCode, {"Content-type": "text/html"});
                response.end(answer);
            } else {
                let table = "<table border='1'><thead><tr><th>Name</th><th>GPA</th></tr></thead>";
                let tableBody = "<tbody>";
                result.forEach(element => {
                    tableBody += "<tr><td>"+element.name+"</td><td>"+element.gpa+"</td></tr>";
                });
                tableBody += "</tbody></table><br><br>"
        
                let answer = "<h1>Display GFAs Greater than or Equal to</h1><br><br>";
                answer += table;
                answer += tableBody;
                answer += "<a href=\"" + localUrl + "\">HOME</a>";
        
                response.writeHead(statusCode, {"Content-type": "text/html"});
                response.end(answer);
            }
        } catch (e) {
            console.error(e);

            let answer = "<h1>Display GFAs Greater than or Equal to</h1><br><br>";
            answer += "<b>NONE<b><br><br>";
            answer += "<a href=\"" + localUrl + "\">HOME</a>";
    
            response.writeHead(statusCode, {"Content-type": "text/html"});
            response.end(answer);
        } finally {
            await client.close();
        }
    }
    main();
});

/* The following two endpoints handle the 'Remove Applicants' pages */
app.get("/adminRemove", (request, response) => {
    const variables = {
        postUrl: localUrl + "/processAdminRemove",
        homeUrl: "\"" + localUrl + "\"",
    };

    response.render("removeApp", variables);
});
app.post("/processAdminRemove", (request, response) => { 
    async function main() { 
        
        let numberRemoved = await removeAll(); // no need for client.connect() because it's in removeAll()
        let statusCode = 200; // success!

        let answer = "<h1>Removal of All Applicants</h1><br>";
        answer += "All Applications have been removed from the database. Number of applications removed: " + numberRemoved + "<br><br><br>";
        answer += "<a href=\"" + localUrl + "\">HOME</a>";

        response.writeHead(statusCode, {"Content-type": "text/html"});
        response.end(answer);

    }
    main();
});



/* Important */
app.listen(portNumber);
process.stdin.setEncoding("utf8");

/* Command Prompt - stops if incorrect num of arguments */
if (process.argv.length != 3) {
  process.stdout.write(`Usage supermarketServer.js jsonFile`);
  process.exit(1);
}

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