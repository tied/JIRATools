/* FetchReport.js
 * This module needs to be run within the Node.js framework.
 * 
 * Arguments:
 * --start YYYY-MM-DD
 * --end YYYY-MM-DD
 * 
 * Output:
 * A csv file named after the UTC date when it is run ie YYYY-MM-DD_output.csvss
 */

var https = require('https');

var args = process.argv.slice(2);
var startDate = (args[0] === "--start") ? startDate = args[1] : '2017-05-01';
var endDate   = (args[2] === "--end") ? endDate = args[3] : '2017-06-01';
var query = '{' +
	'"jql":' +
	'"issuetype=story and sprint is not EMPTY and resolutiondate >= ' + startDate + ' and resolutiondate <= ' + endDate + ' order by key",' +
	'"startAt" : 0,' +
	'"maxResults" : 50' +
	'}';

console.log(query);
// Options for http POST
var options = {
		host : 'jira.trustvesta.com',
		port : 443,
		path : '/jira/rest/api/2/search',
		method: 'POST',
		headers : { 
			'Content-type': 'application/json', 
			'Content-Length': Buffer.byteLength(query)
		},
		auth: 'reportuser:Welcome123!'
};

function writeFile(output) {
	var fs = require('fs');
	var date = new Date().toISOString();
	var filename = date.match(/(.*?)T/)[1] + "_output.csv";

	fs.writeFile(filename, output, function(err) { 
		if (err) {
			console.error(err.message);
		}
	});	
}

function getInitiative(epic,output) {
	
	// console.log('Getting parent initiative of: ' + epic);
	
	// if (epic === null) { return null; }
	
	// do the POST request.  The return object is https.ClientRequest
	var initiativeOptions = {
			host : 'jira.trustvesta.com',
			port : 443,
			path : '/jira/rest/api/2/issue/' + epic,
			method: 'GET',
			headers : { 
				'Content-type': 'application/json', 
			},
			auth: 'reportuser:Welcome123!'
	};
	
	var initiativeRequest = https.request(initiativeOptions, function(res) {
	    
		// Error check
		var statusCode = res.statusCode;
		var contentType = res.headers['content-type'];
		var error = null;
		if (statusCode !== 200) {
			error = new Error('Request Failed.\n' + "Status Code: " + statusCode);
		} else if (!/^application\/json/.test(contentType)) {
		    error = new Error('Invalid content-type.\n' + "Expected application/json but received " + contentType);
	    }
		
		if (error) {
			console.error(error.message);
			res.resume();
			return;
		}

		// Listeners for data and end events.  Aggregate multiple chunks.
		res.setEncoding('utf8');
		var rawData = '';
		var parsedData = '';
		var initiative = '';

		res.on('data', function(chunk) { rawData += chunk; });
		res.on('end', function() {
			try {
				parsedData = JSON.parse(rawData);
				if (parsedData.fields.issuelinks[0] !== undefined) { 
					initiative = parsedData.fields.issuelinks[0].inwardIssue.key; 
				}
				console.log(output + ',' + initiative);
				writeFile(output + ',' + initiative + '\n');


			} catch (e) {
				console.error(e.message);
			}
		});
		
	});

	// Finishes the request
	initiativeRequest.end();

	// Handle request error
	initiativeRequest.on('error', function(e) { console.error(e); });
	
}

// Write out data from http POST
function processResponse(data) { 
	var output = '';
	
	for (var i=data.startAt; i < data.maxResults; i++) {
	
	    var key = data.issues[i].key;
		var issueType = data.issues[i].fields.issuetype.name;
		var epic = data.issues[i].fields.customfield_10001;
		var initiative = getInitiative(epic);
		var fixVersions = data.issues[i].fields.fixVersions;
		var timeSpent = data.issues[i].fields.aggregatetimespent / 3600;  // convert from seconds to hours
		var sprintName = data.issues[i].fields.customfield_10000.toString().match(/name=(.*?),start/)[1];	
		var sprintStart = data.issues[i].fields.customfield_10000.toString().match(/startDate=(.*?)T/)[1];	
		var sprintEnd = data.issues[i].fields.customfield_10000.toString().match(/completeDate=(.*?)T/)[1];	
		
		output = key + ',' + issueType + ',' + epic + ',' + fixVersions + ',' + timeSpent + ',' + sprintName + ',' + sprintStart + ',' + sprintEnd; 
		getInitiative(epic,output);
	}
}

// do the POST request.  The return object is https.ClientRequest
var request = https.request(options, function(res) {
    
	// Error check
	var statusCode = res.statusCode;
	var contentType = res.headers['content-type'];
	var error = null;
	if (statusCode !== 200) {
		error = new Error('Request Failed.\n' + "Status Code: " + statusCode);
	} else if (!/^application\/json/.test(contentType)) {
	    error = new Error('Invalid content-type.\n' + "Expected application/json but received " + contentType);
    }
	
	if (error) {
		console.error(error.message);
		res.resume();
		return;
	}

	// Listeners for data and end events.  Aggregate multiple chunks.
	res.setEncoding('utf8');
	var rawData = '';
	var parsedData = '';
	res.on('data', function(chunk) { rawData += chunk; });
	res.on('end', function() {
		try {
			parsedData = JSON.parse(rawData);
			console.log(parsedData.total);
			processResponse(parsedData);
		} catch (e) {
			console.error(e.message);
		}
	});
	console.log(parsedData);
});

// send query data to POST
request.write(query);
// Finishes the request
request.end();

// Handle request error
request.on('error', function(e) { console.error(e); });

