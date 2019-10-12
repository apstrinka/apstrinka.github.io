"use strict";

var nodeRadius = 10;

function Node(id){
	this.id = id;
	this.edges = [];
}

function Graph(){
	this.nextId = 0;
	this.nodes = [];
	this.numNodes = 0;
	this.numEdges = 0;
	this.distanceMatrix = [];
}

Graph.prototype.addNode = function(){
	this.numNodes = this.numNodes + 1;
	var newRow = [];
	newRow[this.nextId] = 0;
	this.distanceMatrix.push(newRow);
	var node = new Node(this.nextId);
	this.nextId = this.nextId + 1;
	this.nodes.push(node);
	return node;
}

Graph.prototype.addEdge = function(fromNode, toNode){
	this.numEdges = this.numEdges + 1;
	fromNode.edges.push({toNode: toNode, weight: 1});
	toNode.edges.push({toNode: fromNode, weight: 1});
	this.calculateDistanceGraph();
}

Graph.prototype.calculateDistanceGraph = function(){
	for(var i = 0; i < this.nodes.length; i++){
		var row = this.calculateDistancesFrom(this.nodes[i]);
		for (var j = 0; j < this.nodes.length; j++){
			this.distanceMatrix[i][j] = row[j]
		}
	}
}

Graph.prototype.calculateDistancesFrom = function(startNode){
	console.log("start");
	var getNextNodeToExplore = function(nodesToExplore, nodeDistances){
		var minNode = nodesToExplore[0];
		var minDist = nodeDistances[minNode.id];
		var minIndex = 0;
		
		for (var i = 1; i < nodesToExplore.length; i++){
			var node = nodesToExplore[i];
			var dist = nodeDistances[node.id];
			if (dist < minDist){
				minNode = node;
				minDist = dist;
				minIndex = i;
			}
		}
		
		nodesToExplore.splice(minIndex, 1);
		return minNode;
	}
	
	var nodeDistances = []
	nodeDistances[startNode.id] = 0
	var nodesToExplore = [startNode]
	while (nodesToExplore.length !== 0){
		console.log(nodeDistances.length);
		var node = getNextNodeToExplore(nodesToExplore, nodeDistances);
		var nodeDist = nodeDistances[node.id]
		
		for (var i = 0; i < node.edges.length; i++){
			var pair = node.edges[i]
			var nextNode = pair.toNode;
			var nextDist = nodeDist + pair.weight;
			if (nodeDistances[nextNode.id] === undefined || nodeDistances[nextNode.id] > nextDist){
				nodeDistances[nextNode.id] = nextDist;
				nodesToExplore.push(nextNode);
			}
		}
	}
	
	return nodeDistances;
}

function ViewNode(node, x, y){
	this.node = node;
	this.x = x;
	this.y = y;
}

ViewNode.prototype.draw = function(context){
	context.beginPath();
	context.arc(this.x, this.y, nodeRadius, 0, 2*Math.PI);
	context.stroke();
	context.fillText(this.node.id, this.x-5, this.y+3);
}

function ViewEdge(fromNode, toNode){
	this.fromNode = fromNode;
	this.toNode = toNode;
}

ViewEdge.prototype.draw = function(context){
	var fromX = this.fromNode.x;
	var fromY = this.fromNode.y;
	var toX = this.toNode.x;
	var toY = this.toNode.y;
	var xDiff = toX - fromX;
	var yDiff = toY - fromY;
	var dist = Math.hypot(xDiff, yDiff);
	var xOffset = xDiff*nodeRadius/dist;
	var yOffset = yDiff*nodeRadius/dist;
	fromX = fromX + xOffset;
	fromY = fromY + yOffset;
	toX = toX - xOffset;
	toY = toY - yOffset;
	
	context.beginPath();
	context.moveTo(fromX, fromY);
	context.lineTo(toX, toY);
	context.stroke();
}

function ViewGraph(){
	this.graph = new Graph();
	this.viewNodes = [];
	this.viewEdges = [];
}

ViewGraph.prototype.addNode = function(x, y){
	var node = this.graph.addNode();
	var viewNode = new ViewNode(node, x, y);
	this.viewNodes.push(viewNode);
}

ViewGraph.prototype.addEdge = function(fromViewNode, toViewNode){
	this.graph.addEdge(fromViewNode.node, toViewNode.node);
	this.viewEdges.push(new ViewEdge(fromViewNode, toViewNode));
}

ViewGraph.prototype.nodeAt = function(x, y){
	var minDist = -1;
	var minNode = null;
	
	for (var i = 0; i < this.viewNodes.length; i++){
		var node = this.viewNodes[i];
		var dist = Math.hypot(node.x - x, node.y - y);
		if (dist < nodeRadius){
			if (dist < minDist || minDist < 0){
				minDist = dist;
				minNode = node;
			}
		}
	}
	
	return minNode;
}

ViewGraph.prototype.draw = function(context){
	var i;
	
	for (i = 0; i < this.viewNodes.length; i++){
		this.viewNodes[i].draw(context);
	}
	
	for (var i = 0; i < this.viewEdges.length; i++){
		this.viewEdges[i].draw(context);
	}
}

ViewGraph.prototype.summarize = function(div){
	div.empty();
	var numNodes = this.graph.numNodes;
	div.append("<p>Number of nodes: " + numNodes + "</p>");
	div.append("<p>Number of edges: " + this.graph.numEdges + "</p>");
	div.append("<p>Distance matrix</p>");
	var table = document.createElement("table");
	var headerRow = document.createElement("tr");
	headerRow.appendChild(document.createElement("td"));
	for (var i = 0; i < numNodes; i++){
		var header = document.createElement("td");
		header.innerHTML = i;
		headerRow.appendChild(header);
	}
	table.appendChild(headerRow);
	for (var i = 0; i < numNodes; i++){
		var row = document.createElement("tr");
		var col = document.createElement("td");
		col.innerHTML = i;
		row.appendChild(col);
		for (var j = 0; j < numNodes; j++){
			var dist = this.graph.distanceMatrix[i][j];
			col = document.createElement("td");
			if (dist === undefined)
				col.innerHTML = "x";
			else
				col.innerHTML = dist;
			row.appendChild(col);
		}
		table.appendChild(row);
	}
	div.append(table)
}

function clearCanvas(canvas, context){
	context.clearRect(0, 0, canvas.width, canvas.height);
}

function initContext(context){
	context.lineWidth = 2;
}

function resizeCanvas(){
		var canvas = document.getElementById("myCanvas");
		canvas.width = 0;
		canvas.height = 0;
		canvas.width = $("#viewport").width();
		canvas.height = $("#viewport").height();
	}

$(document).ready(function(){
	$(document).tooltip();
	$(".button").button();
	$("#chooseColor").button();
	$(".radioButton").checkboxradio({icon: false});
	$(".radioButtonGroup").controlgroup();
	
	resizeCanvas();
	
	var canvas = document.getElementById("myCanvas");
	var context = canvas.getContext("2d");
	context.lineWidth = 2;
	var startX = 0;
	var startY = 0;
	var moved = false;
	var startNode = null;
	
	var viewGraph = new ViewGraph();
	viewGraph.summarize($("#info"));
	
	$(window).resize(function(){
		resizeCanvas();
		initContext(context);
		viewGraph.draw(context);
	});
	
	$("#myCanvas").mousedown(function(ev){
		moved = false;
		startNode = viewGraph.nodeAt(ev.offsetX, ev.offsetY);
	});
	
	$("#myCanvas").mouseup(function(ev){
		if (moved && startNode !== null) {
			var endNode = viewGraph.nodeAt(ev.offsetX, ev.offsetY);
			if (endNode !== null && endNode !== startNode){
				clearCanvas(canvas, context);
				viewGraph.addEdge(startNode, endNode);
				viewGraph.draw(context);
				viewGraph.summarize($("#info"));
			}
		}
	});
	
	$("#myCanvas").mousemove(function(ev){
		moved = true;
	});
	
	$("#myCanvas").click(function(ev){
		if (!moved) {
			var x = ev.offsetX;
			var y = ev.offsetY;
			clearCanvas(canvas, context);
			viewGraph.addNode(x, y);
			viewGraph.draw(context);
			viewGraph.summarize($("#info"));
		}
	});
});