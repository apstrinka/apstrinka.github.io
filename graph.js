"use strict";

var nodeRadius = 10;

function isBetween(x, bound1, bound2){
	return ((x < bound1 && x > bound2) || (x > bound1 && x < bound2));
}

function Node(id){
	this.id = id;
	this.links = [];
}

function Graph(){
	this.nextId = 0;
	this.nodes = [];
	this.distanceMatrix = [];
}

Graph.prototype.numNodes = function(){
	return this.nodes.length;
}

Graph.prototype.numLinks = function(){
	return this.nodes.reduce((total, i) => total + i.links.length, 0)/2;
}

Graph.prototype.addNode = function(){
	var newRow = [];
	newRow[this.nextId] = 0;
	this.distanceMatrix.push(newRow);
	var node = new Node(this.nextId);
	this.nextId = this.nextId + 1;
	this.nodes.push(node);
	return node;
}

Graph.prototype.addLink = function(fromNode, toNode){
	fromNode.links.push({toNode: toNode, weight: 1});
	toNode.links.push({toNode: fromNode, weight: 1});
	this.calculateDistanceGraph();
}

Graph.prototype.deleteNode = function(node){
	this.nodes = this.nodes.filter(i => i !== node);
	this.nodes.forEach(i => i.links = i.links.filter(j => j.toNode !== node));
	console.log(this.nodes);
	this.removeNodeFromDistanceMatrix(node.id);
	this.calculateDistanceGraph();
}

Graph.prototype.deleteLink = function(fromNode, toNode){
	fromNode.links = fromNode.links.filter(i => i.toNode !== toNode);
	toNode.links = toNode.links.filter(i => i.toNode !== fromNode);
	this.calculateDistanceGraph();
}

Graph.prototype.removeNodeFromDistanceMatrix = function(id){
	for (var i; i = 0; i < this.distanceMatrix.length()){
		this.distanceMatrix[i][id] = undefined;
	}
	this.distanceMatrix[id] = [];
}

Graph.prototype.calculateDistanceGraph = function(){
	for(var i = 0; i < this.nodes.length; i++){
		var node = this.nodes[i];
		var row = this.calculateDistancesFrom(node);
		this.distanceMatrix[node.id] = row;
	}
}

Graph.prototype.calculateDistancesFrom = function(startNode){
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
		var node = getNextNodeToExplore(nodesToExplore, nodeDistances);
		var nodeDist = nodeDistances[node.id]
		
		for (var i = 0; i < node.links.length; i++){
			var pair = node.links[i]
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

function ViewNode(node, x, y, selected){
	this.node = node;
	this.x = x;
	this.y = y;
	this.selected = selected;
}

ViewNode.prototype.distanceTo = function(x0, y0){
	return Math.hypot(this.x - x0, this.y - y0);
}

ViewNode.prototype.draw = function(context){
	if (this.selected)
		context.strokeStyle = "#FF0000";
	else
		context.strokeStyle = "#000000";
	
	context.beginPath();
	context.arc(this.x, this.y, nodeRadius, 0, 2*Math.PI);
	context.stroke();
	context.fillText(this.node.id, this.x-5, this.y+3);
}

function ViewLink(fromNode, toNode, selected){
	this.fromNode = fromNode;
	this.toNode = toNode;
	this.selected = selected;
}

ViewLink.prototype.distanceTo = function(x0, y0){
	var x1 = this.fromNode.x;
	var y1 = this.fromNode.y;
	var x2 = this.toNode.x;
	var y2 = this.toNode.y;
	
	var a = y2 - y1;
	var b = x1 - x2;
	var c = x2*y1 - y2*x1;
	var dist = Math.abs(a*x0 + b*y0 + c)/Math.hypot(a, b);
	
	var x = (b*(b*x0 - a*y0) - a*c)/(a*a + b*b);
	var y = (a*(a*y0 - b*x0) - b*c)/(a*a + b*b);
	
	if (isBetween(x, x1, x2) && isBetween(y, y1, y2))
		return dist;
	
	return Math.min(this.fromNode.distanceTo(x0, y0), this.toNode.distanceTo(x0, y0));
}

ViewLink.prototype.draw = function(context){
	if (this.selected)
		context.strokeStyle = "#FF0000";
	else
		context.strokeStyle = "#000000";
	
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
	this.viewLinks = [];
}

ViewGraph.prototype.addNode = function(x, y){
	var node = this.graph.addNode();
	var viewNode = new ViewNode(node, x, y, true);
	this.viewNodes.push(viewNode);
}

ViewGraph.prototype.addLink = function(fromViewNode, toViewNode){
	this.graph.addLink(fromViewNode.node, toViewNode.node);
	this.viewLinks.push(new ViewLink(fromViewNode, toViewNode, true));
}

ViewGraph.prototype.nodeAt = function(x, y){
	var minDist = -1;
	var minNode = null;
	
	for (var i = 0; i < this.viewNodes.length; i++){
		var node = this.viewNodes[i];
		var dist = node.distanceTo(x, y);
		if (dist < nodeRadius){
			if (dist < minDist || minDist < 0){
				minDist = dist;
				minNode = node;
			}
		}
	}
	
	return minNode;
}

ViewGraph.prototype.linkAt = function(x, y){
	var minDist = -1;
	var minLink = null;
	
	for (var i = 0; i < this.viewLinks.length; i++){
		var link = this.viewLinks[i];
		var dist = link.distanceTo(x, y);
		if (dist < nodeRadius){
			if (dist < minDist || minDist < 0){
				minDist = dist;
				minLink = link;
			}
		}
	}
	
	return minLink;
}

ViewGraph.prototype.unselectAll = function(){
	var i;
	
	for (var i = 0; i < this.viewLinks.length; i++){
		this.viewLinks[i].selected = false;
	}
	
	for (var i = 0; i < this.viewNodes.length; i++){
		this.viewNodes[i].selected = false;
	}
}

ViewGraph.prototype.deleteSelectedItems = function(){
	var selectedLinks = this.viewLinks.filter(i => i.selected);
	var selectedNodes = this.viewNodes.filter(i => i.selected);
	
	selectedLinks.forEach(i => this.graph.deleteLink(i.fromNode.node, i.toNode.node));
	selectedNodes.forEach(i => this.graph.deleteNode(i.node));
	
	this.viewLinks = this.viewLinks.filter(i => !i.selected && !i.fromNode.selected && !i.toNode.selected);
	this.viewNodes = this.viewNodes.filter(i => !i.selected);
}

ViewGraph.prototype.draw = function(context){
	var i;
	
	for (var i = 0; i < this.viewLinks.length; i++){
		this.viewLinks[i].draw(context);
	}
	
	for (i = 0; i < this.viewNodes.length; i++){
		this.viewNodes[i].draw(context);
	}
}

ViewGraph.prototype.summarize = function(div){
	div.empty();
	var numNodes = this.graph.numNodes();
	div.append("<p>Number of nodes: " + numNodes + "</p>");
	div.append("<p>Number of links: " + this.graph.numLinks() + "</p>");
	div.append("<p>Distance matrix</p>");
	var table = document.createElement("table");
	var headerRow = document.createElement("tr");
	headerRow.appendChild(document.createElement("td"));
	for (var i = 0; i < numNodes; i++){
		var header = document.createElement("td");
		header.innerHTML = this.graph.nodes[i].id;
		headerRow.appendChild(header);
	}
	table.appendChild(headerRow);
	for (var i = 0; i < numNodes; i++){
		var row = document.createElement("tr");
		var col = document.createElement("td");
		col.innerHTML = this.graph.nodes[i].id;
		row.appendChild(col);
		for (var j = 0; j < numNodes; j++){
			var iId = this.graph.nodes[i].id;
			var jId = this.graph.nodes[j].id;
			var dist = this.graph.distanceMatrix[iId][jId];
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

function addNode(viewGraph, x, y, canvas, context, div){
	clearCanvas(canvas, context);
	viewGraph.unselectAll();
	viewGraph.addNode(x, y);
	viewGraph.draw(context);
	viewGraph.summarize(div);
}

function addLink(viewGraph, startNode, endNode, canvas, context, div){
	clearCanvas(canvas, context);
	viewGraph.unselectAll();
	viewGraph.addLink(startNode, endNode);
	viewGraph.draw(context);
	viewGraph.summarize(div);
}

function selectItem(viewGraph, item, multiselect, canvas, context, div){
	clearCanvas(canvas, context);
	if (!multiselect)
		viewGraph.unselectAll();
	item.selected = !item.selected;
	viewGraph.draw(context);
	viewGraph.summarize(div);
}

function deleteSelectedItems(viewGraph, canvas, context, div){
	clearCanvas(canvas, context);
	viewGraph.deleteSelectedItems();
	viewGraph.draw(context);
	viewGraph.summarize(div);
}

function moveNode(viewGraph, startNode, x, y, canvas, context){
	clearCanvas(canvas, context);
	startNode.x = x;
	startNode.y = y;
	viewGraph.draw(context);
}

function drawTempLink(viewGraph, startNode, x, y, canvas, context){
	clearCanvas(canvas, context);
	
	context.strokeStyle = "#888888";
	
	var fromX = startNode.x;
	var fromY = startNode.y;
	var xDiff = x - fromX;
	var yDiff = y - fromY;
	var dist = Math.hypot(xDiff, yDiff);
	var xOffset = xDiff*nodeRadius/dist;
	var yOffset = yDiff*nodeRadius/dist;
	fromX = fromX + xOffset;
	fromY = fromY + yOffset;
	
	context.beginPath();
	context.moveTo(fromX, fromY);
	context.lineTo(x, y);
	context.stroke();
	
	viewGraph.draw(context);
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
				addLink(viewGraph, startNode, endNode, canvas, context, $("#info"));
			} else {
				clearCanvas(canvas, context);
				viewGraph.draw(context);
			}
		}
		startNode = null;
	});
	
	$("#myCanvas").mousemove(function(ev){
		moved = true;
		if (startNode !== null){
			if (startNode.selected)
				moveNode(viewGraph, startNode, ev.offsetX, ev.offsetY, canvas, context);
			else
				drawTempLink(viewGraph, startNode, ev.offsetX, ev.offsetY, canvas, context);
			}
	});
	
	$("#myCanvas").click(function(ev){
		if (!moved) {
			var node = viewGraph.nodeAt(ev.offsetX, ev.offsetY);
			if (node !== null){
				selectItem(viewGraph, node, ev.ctrlKey, canvas, context, $("#info"));
			} else {
				var link = viewGraph.linkAt(ev.offsetX, ev.offsetY);
				if (link !== null){
					selectItem(viewGraph, link, ev.ctrlKey, canvas, context, $("#info"));
				} else {
					addNode(viewGraph, ev.offsetX, ev.offsetY, canvas, context, $("#info"));
				}
			}
		}
	});
	
	$(document).keydown(function(ev){
		//console.log(ev.which);
		if (ev.which === 46) { //Delete
			deleteSelectedItems(viewGraph, canvas, context, $("#info"));
		}
	});
});