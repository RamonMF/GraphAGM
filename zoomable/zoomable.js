var width = 760,
    height = 550,
    radius = Math.min(width, height) / 2.2;

var x = d3.scale.linear()
    .range([0, 2 * Math.PI]);

var y = d3.scale.sqrt()
    .range([0, radius]);
    
// Mapping of step names to colors.
var colors = {
"geometrical": "#003300",
"arithmetical": "#006600",
"astronomical": "#009900",
"technical": "#00CC00",
"treatise": "#F79F81",
"popularization": "#FAAC58",
"commentary": "#DF7401",
"compilation": "#61380B",
"canonical": "#29088A",
"mixed": "#0101DF",
"informal": "#2E64FE",
"root": "#ffffff"
};

// Categories to classify texts.
var categories = {
  "content": "green",
  "genre": "red",
  "style": "lightblue",
  "author": "black",
  "title": "grey"
}

var filters = {
  "exact": "#99CCFF",
  "approximate": "#99CCFF"
}

// Filter variables
var exactdata = "yes";
var inexactdata = "yes";
var exactdate = "yes";
var inexactdate = "yes";

//Current level necessary to calculate relative percentages.
var currentdepth=0;

// To store the current order of categories.
var boxes=d3.keys(categories);

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: 110, h: 40, s: 3, t: 10
};

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + (width / 2 - 100) + "," + (height / 2 + 10) + ")");    
        
var partitionwords = d3.layout.partition()
    .value(function(d) { return d.words; });

var partitionchars = d3.layout.partition()
    .value(function(d) { return d.chars; });
    
var arc = d3.svg.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });
    

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
}; 
    
  
// Use d3.text and d3.csv.parseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays.
d3.text("tabla.csv", function(text) {
  var csv = d3.csv.parseRows(text);
  var json = buildHierarchy(csv);
  
  d3.select("#togglelegend").on("click", toggleLegend);
  
    // Basic setup of page elements.
  initializeBreadcrumbTrail();
  drawLegend();
  drawOrder();
  drawFilter(1);
  drawFilter(2);
  
  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:circle")
       .attr("r", radius)
       .style("opacity", 0);
       
  createVisualization(json);
});
  


// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {

  // For efficiency, filter nodes to keep only those large enough to see.
  var nodes = partitionwords.nodes(json)
      .filter(function(d) {
      return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
      });
      
  var path = vis.selectAll("path")
    .data(partitionwords.nodes(json));
    
  path
    .enter().append("path")
    .attr("d", arc)
    .attr("id", function(d,i) { return "ARCID"+i; })
    .style("fill", function(d) { 
	    if (d.type == "title")
		    return "grey";	
	    else 
		    return colors[d.name];
	    })
    .on("click", click)
    .on("mouseover", mouseover);

  function click(d) {
     
     currentdepth = d.depth;
     
     path.transition()
          .duration(250)
          .attrTween("d", arcTween(d));
  }
  
  // Add the mouseleave handler to the bounding circle.
  d3.select("#container").on("mouseleave", mouseleave);
      
  // Get total size of the tree = value of root node from partition.
  totalSize = path.node().__data__.value;
  
};  
  

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

  // #Words (Global)
  var percentage = (100 * d.value / totalSize).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }

  d3.select("#percwords")
      .text("Words: "+percentageString);

      
  // #Words (Relative)
  if (d.parent != null) {
      var p = d;
      while (p.depth > currentdepth) {
	   p = p.parent;
      } 
      var relwords = addWordsChilds(p);
  } else 
      relwords = totalSize;
  
  var percentage = (100 * d.value / relwords).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }
 
   d3.select("#percrelwords")
       .text("Words (relative): "+percentageString);
      
  // #Chars (Global)
  var percentage = (100 * addCharsChilds(d) / sumchars).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }
  
  d3.select("#percchars")
      .text("Chars: "+percentageString);

  // #Chars (Relative)
  if (d.parent != null) {
      var p = d;
      while (p.depth > currentdepth) {
	   p = p.parent;
      } 
      var relchars = addCharsChilds(p);
  } else 
      relwords = sumchars;      
      
  var percentage = (100 * addCharsChilds(d) / relchars).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }
  
  d3.select("#percrelchars")
      .text("Chars (relative): "+percentageString);


      
  d3.select("#explanation")
      .style("visibility", "");

  var sequenceArray = getAncestors(d);
  //updateBreadcrumbs(sequenceArray, percentageString);
  updateBreadcrumbs(sequenceArray, "");
  
  // Fade all the segments.
  d3.selectAll("path")
      .style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  var curr = vis.selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
     
}


// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

  // Hide the breadcrumb trail
   d3.select("#trail")
       .style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("path")
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .each("end", function() {
              d3.select(this).on("mouseover", mouseover);
            });

   d3.select("#explanation")
       .style("visibility", "hidden");
}


// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
  var path = [];
  var current = node;
  while (current.parent) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
}


// Recursively sums all words from children nodes of the given node.
function addWordsChilds(node) {
  var sum=0;
  if (node.depth == 5) return node.words;
  
  for (var i=0;i<node.children.length;i++) {
    if (node.children[i].depth == 5) 
      sum += node.children[i].words;
    else
      sum += addWordsChilds(node.children[i]);
  }
  
  return sum;
}


// Recursively sums all chars from children nodes of the given node.
function addCharsChilds(node) {
  var sum=0;
  if (node.depth == 5) return node.chars;
  
  for (var i=0;i<node.children.length;i++) {
    if (node.children[i].depth == 5) 
      sum += node.children[i].chars;
    else
      sum += addCharsChilds(node.children[i]);
  }
  
  return sum;
}


function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3.select("#sequence").append("svg:svg")
      .attr("width", width)
      .attr("height", 50)
      .attr("id", "trail");
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
}



// Adapted from http://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this);
        var words = text.text().split(/\s+/).reverse();
	//var words = text.text().split(" ");
        var word;
        var line = [],
            lineNumber = 0,
            lineHeight = 22, 
            x = text.attr("x"),
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "px");

	while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight/2 + dy + "px")
                            .text(word);
            }
        }
    });
}


// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

  // Data join; key function combines name and depth (= position in sequence).
  var g = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return d.name + d.depth; });

  // Add breadcrumb and label for entering nodes.
  var entering = g.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { 
		    if (d.type == "title")
			    return "grey";	
		    else 
			    return colors[d.name];
      });

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", 15) //b.h / 2
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function (d) { return d.name; })
      .call(wrap, 90);      

  // Set position for entering and updating nodes.
  g.attr("transform", function(d, i) {
    return "translate(" + i * (b.w + b.s) + ", 0)";
  });

  // Remove exiting nodes.
  g.exit().remove();

  // Now move and update the percentage at the end.
  d3.select("#trail").select("#endlabel")
      .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(percentageString);

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
      .style("visibility", "");

}

function drawLegend() {

  // Dimensions of legend item: width, height, spacing, radius of rounded rect.
  var li = {
    w: 100, h: 30, s: 3, r: 3
  };

  var legend = d3.select("#legend").append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(colors).length * (li.h + li.s));

  var g = legend.selectAll("g")
      .data(d3.entries(colors))
      .enter().append("svg:g")
      .attr("transform", function(d, i) {
              return "translate(0," + i * (li.h + li.s) + ")";
           });

  g.append("svg:rect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w)
      .attr("height", li.h)
      .style("fill", function(d) { return d.value; });

  g.append("svg:text")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.key; });
}


function drawOrder() {
   // Dimensions of order selection item: width, height, spacing, radius of rounded rect.
  var li = {
    w: 100, h: 30, s: 3, r: 3
  };

  var ordsel = d3.select("#orderselection")
      .append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(colors).length * (li.h + li.s));

  var g = ordsel.selectAll("g")
      .data(d3.entries(categories));
      
      g.enter().append("svg:g")
      .attr("transform", function(d, i) {
              return "translate(0," + i * (li.h + li.s) + ")";
           });

  g.append("svg:rect")
      .attr("class","orderrect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w)
      .attr("height", li.h)
      .attr("id", function(d) { return d.key; })
      .style("fill", function(d) { return d.value; });
      //.on("click", function() { changeorder(this.id) });
      
  g.append("svg:text")
      .attr("class","textrect")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("id", function(d) { return d.key; })
      .text(function(d) { return d.key; })
      .on("click", function() { changeorder(this.id) });
   
}


function drawFilter(num) {
    // Dimensions of order selection item: width, height, spacing, radius of rounded rect.
  var li = {
    w: 100, h: 30, s: 3, r: 3
  }; 
  
  var filsel = d3.select("#filter"+num)
      .append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(filters).length * (li.h + li.s));
  
   var g = filsel.selectAll("g")
      .data(d3.entries(filters));
      
      g.enter().append("svg:g")
      .attr("transform", function(d, i) {
              return "translate(0," + i * (li.h + li.s) + ")";
      });
	      
  g.append("svg:rect")
      .attr("class","orderrect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w)
      .attr("height", li.h)
      .attr("id", function(d) { return d.key + num; })
      .style("fill", function(d) { return d.value; });
      //.on("click", function() { changeorder(this.id) });
      
  g.append("svg:text")
      .attr("class","textrect")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("id", function(d) { return d.key + num; })
      .text(function(d) { return d.key; })
      .on("click", function() { if (num == 1) togglefilterdata(this.id) 
	                        else togglefilterdate(this.id);
      });	      
  
}

// Changes order of color array elements and redraws graph.
function changeorder(el) {
		var l=boxes.length;
		var i=boxes.indexOf(el);
		var j=(i == 0 ? 4 : i-1);
		var cat=boxes[i];
		boxes[i]=boxes[j];
		boxes[j]=cat; 
		
		d3.selectAll("rect.orderrect")
		.data(boxes)
       		.attr("id", function(d) { 
		  return d; })
       		.style("fill", function(d) { 
		  return categories[d]; });

		d3.selectAll("text.textrect")
		.data(boxes)
       		.text(function(d) { return d; })
		.attr("id", function(d) { 
		  return d; })
		.on("click", function() { changeorder(this.id) });

		d3.text("tabla.csv", function(text) {
		    var csv = d3.csv.parseRows(text);
		    var json = buildHierarchy(csv);
		
		    vis.selectAll("path").remove();
		    
		    createVisualization(json);
	        });
}


function togglefilterdata(el) {
  if (el == "exact1") {
      if (exactdata == "yes") {
	exactdata = "no";
	d3.select("#exact1")
	   .style("fill","#B8B8B8");
      }
      else {
        exactdata = "yes";
	d3.select("#exact1")
	  .style("fill", "#99CCFF");
      }
  }
  else {
      if (inexactdata == "yes") {
	inexactdata = "no";
	d3.select("#approximate1")
	   .style("fill","#B8B8B8");
      }
      else {
        inexactdata = "yes";
	d3.select("#approximate1")
	  .style("fill", "#99CCFF");
      }
  }
  
   d3.text("tabla.csv", function(text) {
      var csv = d3.csv.parseRows(text);
      var json = buildHierarchy(csv);
	
      vis.selectAll("path").remove();
		    
      createVisualization(json);
   });

}

function togglefilterdate(el) {
  if (el == "exact2") {
      if (exactdate == "yes") {
	exactdate = "no";
	d3.select("#exact2")
	   .style("fill","#B8B8B8");
      }
      else {
        exactdate = "yes";
	d3.select("#exact2")
	  .style("fill", "#99CCFF");
      }
  }
  else {
      if (inexactdate == "yes") {
	inexactdate = "no";
	d3.select("#approximate2")
	   .style("fill","#B8B8B8");
      }
      else {
        inexactdate = "yes";
	d3.select("#approximate2")
	  .style("fill", "#99CCFF");
      }
  }
  
   d3.text("tabla.csv", function(text) {
      var csv = d3.csv.parseRows(text);
      var json = buildHierarchy(csv);
	
      vis.selectAll("path").remove();
		    
      createVisualization(json);
   });

}




function toggleLegend() {
  var legend = d3.select("#legend");
  if (legend.style("visibility") == "hidden") {
    legend.style("visibility", "");
  } else {
    legend.style("visibility", "hidden");
  }
}

d3.select(self.frameElement).style("height", height + "px");

// Interpolate the scales!
function arcTween(d) {
  var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(y.domain(), [d.y, 1]),
      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
  return function(d, i) {
    return i
        ? function(t) { return arc(d); }
        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
  };
}


// Take a n-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. 
//
// This is the description of the row structure:
// work,mu,sigma,gauss,content,genre,style,author,works,books,words,chars,datebegin,dateend,data,date
// text,-285,"11,667",NO,geometrical,treatise,canonical,Anonymous,1,1,10154,50648,-320,-250,exact,exact
function buildHierarchy(csv) {
  var root = {"name": "root", "type": "", "children": []};
  sumchars = 0;

  for (var i = 0; i < csv.length; i++) {
    var sequence = [];
    sequence[0] = csv[i][4];
    sequence.push(csv[i][5]);
    sequence.push(csv[i][6]);
    sequence.push(csv[i][7]);
    sequence.push(csv[i][0]);
    var nwords = parseFloat(csv[i][10]);
    var nchars = parseFloat(csv[i][11]);
    var data = csv[i][14]; // Data: exact / inexact
    var date = csv[i][15]; // Date: exact / inexact
    if (isNaN(nwords)) { // e.g. if this is a header row
      continue;
    }
    
    if (exactdate == "no" && date == "exact") {
      continue;
    }

   if (inexactdate == "no" && date == "approximate") {
      continue;
    }

    if (exactdata == "no" && data == "exact") {
      continue;
    }

   if (inexactdata == "no" && data == "approximate") {
      continue;
    }    
    
    var parts = [];
    //Reorder array
    parts[boxes.indexOf("content")]=sequence[0];
    parts[boxes.indexOf("genre")]=sequence[1];
    parts[boxes.indexOf("style")]=sequence[2];
    parts[boxes.indexOf("author")]=sequence[3];
    parts[boxes.indexOf("title")]="xTx"+sequence[4];
    var currentNode = root;
    for (var j = 0; j < parts.length; j++) {
      var children = currentNode["children"];
      var nodeName = parts[j];
      var type = "";
      if (nodeName.substring(0, 3) == "xTx") {
	  nodeName = nodeName.substring(3);
	  type = "title";
      }
      var childNode;
      if (j + 1 < parts.length) {
   // Not yet at the end of the sequence; move down the tree.
 	var foundChild = false;
 	for (var k = 0; k < children.length; k++) {
 	  if (type != "title" && children[k]["name"] == nodeName) {
 	    childNode = children[k];
 	    foundChild = true;
 	    break;
 	  }
 	}
  // If we don't already have a child node for this branch, create it.
 	if (!foundChild) {
 	  childNode = {"name": nodeName, "type": type, "children": []};
 	  children.push(childNode);
 	}
 	currentNode = childNode;
      } else {
 	// Reached the end of the sequence; create a leaf node.	
	sumchars += nchars;
 	childNode = {"name": nodeName, "type": type, "words": nwords, "chars": nchars, "date": date};
 	children.push(childNode);
      }
    }
  }

  return root;
};


