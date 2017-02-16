# Mapbox-GL-JS-save-view
Client and server code to save views of Mapbox-GL-JS applications.


# Overview

## Backend

The backend consists of a very simple node express app that sends and receives saved view objects.  The code includes both a save to file option, and a save to database (SQLite) option as specified in the top of the server.js file.

## Installation

### Windows

Running node on Windows is fairly simple, but requires slight orchestration. These are the steps to install.

1. If you don't have node installed, you should install it.
2. Clone this repository or cd into it.
3. Install save view dependencies.
 * `npm install`
4. Run tests
 * `npm test`
5. Run server to ensure it's working
 * Open up server.js code and adjust variables (port, save mode) as needed.
 * `node server`
 * hit localhost:4005 - you should receive the test client app.
6. Install Windows Service to 'host' node server
 * Open service.js file and adjust the service name filepath as needed - it needs to point to the server.js file.
 * `node service.js` - to install.
 * Once installed, the service can be stopped/started etc.
7. Complile and set up .NET proxy
 1. CD to dotnet_reverse_proxy
 2. `msbuild` or simply use binary that is included with code
 3. Open web.config - adjust parameters at top  PORTS/APPNAME (APPNAME must match the name of the application in step 6)
 4. From windows run line: `inetmgr`
 5. Right-click on web server and select 'Add Application'
 6. Call it whatever you like, it will be the name of the app that will be used externally.
 7. Assign to ASP.NET 4.0 AppPool or application pool of your choice.
8. Test
 * With the Windows service running, and the proxy functioning, you should now be able to access the node application via port 80 (or 443) and IIS.
 * The address will be //yourserver.com/APPNAME
 * Test saving views, turning layers on and off, reordering layers, drawing markup etc.

### Linux

Running node on Linux is similar in that the best practice is to use a reverse proxy, in this case Apache.  However instead of installing node as a service we would use a tool called 'forever' -- this is widely documented on the web and is very straightforward to install/use.

# Validation

The server code validates (using jsonschema) an uploaded mapView object according to the following schema:

 ```json
 var mapSchema = {
	"id":'/mapSchema',
	"type":"object",
	"properties":{
		"center": {
			"type": "array",
			"items": {
				"type": "number",
				"minItems": 2,
      			"maxItems": 2
			},
			"required": true
		},
		"zoom": {
			"type": "number",
			"required": true
		},
		"bearing": {
			"type": "number"
		},
		"pitch": {
			"type": "number"
		}
	}
}

var layerSchema  = {
	"type":"object",
	"properties":{
		"id": {
			"type": "string",
			"required": true
		},
		"visibility": {
			"type": "string",
			"pattern": /(visible|none)/,
			"required": true
		},
		"paint": {
			"type": "object"
		},
		"filter": {
			"type": "object"
		}
	}
}

var mapStateSchema = {
	"type":"object",
	"properties":{
		"map" : {"$ref": "/mapSchema"},
		"layers": {'type':"array", "items":{"$ref": "layerSchema"} },
		"shapes": {'type':'object'}
	},
	"required":["map", "layers"],
	"additionalProperties": false
}```


# Usage

Express is a Model View Controller (MVC) framework that is very easy to use and setup.  For the purposes of this project, I am simply using it to create http routes with which to handle communication between the db/file server and the browser client.

## Writing a view

In order to save a view the client application will POST a javascript viewState object to the '/view/' route.  The API will validate the object, and if valid, save it.

## Reading a view

There are several ways that a view can be acquired. The simplest is via client-side javascript parsing the URL params on page load and issuing an AJAX request to GET the javascript object.  The more sophisticated approach would involve server-side rendering.  Only the former falls within the scope of this project, but it is worth mentioning and being aware of.
