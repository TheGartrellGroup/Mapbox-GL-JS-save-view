# Mapbox-GL-JS-save-view
Client and server code to save views of Mapbox-GL-JS applications.


# Overview

## Backend

The backend consists of a very simple node express app that sends and receives saved view objects.  I've implemented both a save to file option, and a save to database (SQLite) option.

## Installation

### Windows

Running node on Windows is fairly simple, but requires slight orchestration. These are the steps to install.

1. If you don't have node installed, you should install it.
2. We're going to run a node server that will listen on port 3000.
3. We're going to create a windows service that will "host" the node server.
3. We're going to run a .net reverse proxy that will accept incoming requests from clients and forward them to the host windows service/node server.

### Linux

Running node on Linux is similar in that the best practice is to use a reverse proxy, in this case Apache.  However instead of installing node as a service we would use a tool called 'forever' -- this is widely documented on the web and is very straightforward to install/use.

# Usage

Express is a Model View Controller (MVC) framework that is very easy to use and setup.  For the purposes of this project, I am simply using it to create http routes with which to handle communication between the db/file server and the browser client.

## Writing a view

In order to save a view the client application will POST a javascript viewState object to the '/view/' route.  The API will validate the object, and if valid, save it.

## Reading a view

There are several ways that a view can be acquired. The simplest is via client-side javascript parsing the URL params on page load and issuing an AJAX request to GET the javascript object.  The more sophisticated approach would involve server-side rendering.  Only the former falls within the scope of this project, but it is worth mentioning and being aware of.

# Questions

Should views save loaded shapes from previous view loaded?