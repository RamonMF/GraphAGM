// Global variables definition 
 
//Mapping of step names to colors.
var colors = {
"root": "#ffffff",
"geometrical": "#04B404",
"arithmetical": "#254117",
"astronomical": "#0B610B",
"technical": "#A1C935",
"treatise": "#C24641",
"popularization": "#FAAC58",
"commentary": "#61380B",
"compilation": "#B87333",
"canonical": "#29088A",
"mixed": "#A0CFEC", 
"informal": "#2E64FE",
"exact": "#733333",
"approx": "#733333",
"global-cdf": "#000000",
"content-cdf": "#009900",
"genre-cdf": "#993333",
"style-cdf": "#0066FF",
"density-f": "#FF3300"
};
 

var jsonFilter1 = [
{
name: "Content",
children: [{"name": "Arithmetical"},
	    {"name": "Astronomical"},
	    {"name": "Geometrical"},
	    {"name": "Technical"}
	   ]
},{
name: "Genre",
children: [ {"name": "Commentary"},
           {"name": "Compilation"},
           {"name": "Popularization"},
           {"name": "Treatise"} 
         ]
},{         
name: "Style",
children: [{"name": "Canonical"},
           {"name": "Informal"},
           {"name": "Mixed"}
         ]
},{                  
name: "Graph",
children: [{"name": "Works"},
           {"name": "Words"},
           {"name": "Chars"}
         ]
}];


var jsonFilter2 = [
{                  
name: "Data",
children: [{"name": "Exact"},
           {"name": "Approx"}
         ]
},{                  
name: "Date",
children: [{"name": "Exact"},
           {"name": "Approx"}
         ]
}];

var jsonFilter3 = [
{                  
name: "Lines",
children: [{"name": "Global-CDF"},
	   {"name": "Content-CDF"},
	   {"name": "Genre-CDF"},
	   {"name": "Style-CDF"},
           {"name": "Density-F"}
         ]
}];

var w = 1130;
var h = 400;
var timespanMin=-500;
var timespanMax=701;
var yearmin=timespanMin;
var yearmax=timespanMax;
var step=1; //The lower set of this value the slower turns the program. 
	    //Changing this value can produce unexpected behaviour.
var x = d3.scale.linear().domain([timespanMin, timespanMax]).range([0,w]);
var y = d3.scale.linear().domain([ 0, 100]).range([h,0]);
var densityScale = d3.scale.linear().domain([ 0, 0.51]).range([0,100]);
var cdfScale, workScale, wordScale, charScale;
var pad = 50;
var padw = 70;
var cdfcontents = new Array();
var cdfgenres = new Array();
var cdfstyles = new Array();
var cummulative = new Array();
var numFilteredPaths;    
var totalWorks=0;
var totalWords=0;
var totalChars=0;
var sumWorks=0;
var sumWords=0;
var sumChars=0; 
var filterString="";  //Example: filterString='d.style == "Canonical"||';
var filterauthors = "No";
var filterworks = "No";
var filterpartial = "No"; //Determines if categories are combined or not for the results.
var authorfilter = [];
var workfilter = [];
var numPaths=0;
var categoryant="";
var csv;
var jsonData;
var continuous = new Array();
var path;
var filteredpath;
var selectedCategory="Style"; // Determines the fill colors of the single paths.
var selectedGraph="Works"; // Determines the reference scale of the graph.
var zoom=50;

// Add tooltips
var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

var smalldiv = d3.select("body").append("div")   
    .attr("class", "smalldiv")               
    .style("opacity", 0);    

var detaildiv = d3.select("#main").append("div")   
    .attr("class", "detail")               
    .style("opacity", 0);
    
var scrolldiv = d3.select("#main").append("div")   
    .attr("class", "scrolldiv")               
    .style("opacity", 0)
    .on("mouseout", function(d) {
                   this.style("opacity", 0);
                 });    

var svg = d3.select("#chart")
    .append("svg:svg")
    .attr("height", h + pad)
    .attr("width",  w + padw)
    .on("click", function(d) {
          var t = d3.select("div.scrolldiv");
          if (t.style("opacity") != "0") {
	    t.transition().duration(500).style("opacity", 0);
	    t.style("pointer-events", "none"); 
	  }
     });

var fil = svg.append("svg:g")
    .attr("id", "filtro");
    
var vis = svg.append("svg:g")
    .attr("id", "series")
    .attr("transform", "translate(20,30)");    
    
initialize();
       
//Load data and execute initial setup.
function initialize() {
    
    printInstructions();
    
    //Initialize check variables in case some checkbox remains checked
    //when the page is refreshed.
    var chbox=d3.select(".chkaut");
    toggleFilterauthors(chbox[0][0]);  
    chbox=d3.select(".chkwork");
    toggleFilterworks(chbox[0][0]);
    chbox=d3.select(".chkpart");
    toggleFilterpartial(chbox[0][0]);
    
    // Use d3.text and d3.csv.parseRows so that we do not need to have a header
    // row, and can receive the csv as an array of arrays.
    d3.text("tabla.csv", function(text) {
      csv = d3.csv.parseRows(text);
      jsonData = buildHierarchy(csv);
    });  

}       
       
function toggleFilterauthors(id) {
    if (id.checked)
      filterauthors = "Yes";
    else
      filterauthors = "No";
    
    createVisualization();
}

function toggleFilterworks(id) {
    if (id.checked)
      filterworks = "Yes";
    else
      filterworks = "No";
    
    createVisualization();
}

function toggleFilterpartial(id) {
    if (id.checked)
      filterpartial = "Yes";
    else
      filterpartial = "No";

    createVisualization();
}

function toggleGraph(id) {
    d3.select("#Graph").selectAll("div.child")
	      .attr("style","font-weight:normal; font-size:12px")
	      .attr("show","no");

    d3.select("#"+id.id)
	      .transition()
	      .attr("style",'font-weight:bold; font-size:16px')
	      .attr("show","yes")
	      .duration(100);
	      
     selectedGraph=id.id;
     
     createVisualization();
}

function toggleColors(id) {
    d3.selectAll("label.categoryColor")
	      .attr("style","font-weight:normal; font-size:12px")
	      .attr("show","no");

    if (this.style.fontSize != "16px")
	      d3.select("#"+id.id)
	      .transition()
	      .attr("style",'font-weight:bold; font-size:15px')
	      .attr("show","yes")
	      .duration(100);
	      
    selectedCategory=id.id;
    
    filteredpath
     .style("fill",function(d) {  if (((d.Gauss == "SI" ) && (d.cutdBegin < yearmin || d.cutdEnd > yearmax)) 
                                   ||((d.Gauss == "NO" ) && (d.dateBegin <= yearmin || d.dateEnd >= yearmax)))
					  return "none"; //Workaround to avoid fill overflow
				  else 
					switch(selectedCategory) {
			 case "content":
			      return colors[d.Content];
			      break;
			 case "genre":
			      return colors[d.Genre];
			      break;
			 default:
			      return colors[d.Style];
			      break;
			}; }) 
     .style("stroke",function(d) {  
     
			switch(selectedCategory) {
			 case "content":
			      return colors[d.Content];
			      break;
			 case "genre":
			      return colors[d.Genre];
			      break;
			 default:
			      return colors[d.Style];
			      break;
			}; 
			});

     printStatistics();
     
}

// Take a n-column CSV into an array.
function buildHierarchy(csv) {
  jsonData = [];
  var mu,sigma,gauss,works,words,chars,date,datebegin,dateend,cutdBegin,cutdEnd;
  
  for (var i = 0; i < csv.length; i++) {
		    
		  works = parseFloat(csv[i][8].replace(',','.').replace(' ',''));
		  if (isNaN(works)) { // e.g. if this is a header row
		      continue;
		    }
		  
		  mu = parseFloat(csv[i][1]);
		  sigma = parseFloat(csv[i][2].replace(',','.').replace(' ',''));
		  gauss = csv[i][3].toUpperCase();
		  words = parseFloat(csv[i][10]);
		  chars = parseFloat(csv[i][11]);
		  datebegin = parseInt(csv[i][12]);
		  dateend = parseInt(csv[i][13]);
		  data = csv[i][14];
		  if (data != "exact") 
			data = "approx";
		  
		  date = csv[i][15];
		  if (date != "exact") 
			date = "approx";
		  
		  cutdBegin =  Math.round(mu - 3 * sigma);
		  cutdEnd = Math.round(mu + 3 * sigma);
		  
		  childNode = {   "Gauss": gauss,
				  "Work": csv[i][0].toLowerCase(),
				  "Content": csv[i][4].toLowerCase(),
				  "Genre": csv[i][5].toLowerCase(),
				  "Style": csv[i][6].toLowerCase(),
				  "Author": csv[i][7].toLowerCase(),
				  "Works": works,
				  "Books": parseFloat(csv[i][9]),
				  "Words": words,
				  "Chars": chars,
				  "Data": data,
				  "Date": date,
				  "dateBegin": datebegin,
				  "dateEnd": dateend,
// 				  "samples": createSamples(mu,sigma,gauss,1,datebegin,dateend),
				  "cutdBegin": cutdBegin,
				  "cutdEnd": cutdEnd,
				  "worksamples": createSamples(mu,sigma,gauss,works,datebegin,dateend,cutdBegin,cutdEnd),
				  "wordsamples": createSamples(mu,sigma,gauss,words,datebegin,dateend,cutdBegin,cutdEnd),
				  "charsamples": createSamples(mu,sigma,gauss,chars,datebegin,dateend,cutdBegin,cutdEnd),
				  "cdfsamples": createCdfSamples(mu,sigma,gauss,1,datebegin,dateend),
				  "cdfworks": createCdfSamples(mu,sigma,gauss,works,datebegin,dateend),
				  "cdfwords": createCdfSamples(mu,sigma,gauss,words,datebegin,dateend),
				  "cdfchars": createCdfSamples(mu,sigma,gauss,chars,datebegin,dateend)
		  }
		    jsonData.push(childNode);

		    //Check if Content values are valid
		    if (childNode.Content != "arithmetical" && childNode.Content != "astronomical"
			&& childNode.Content != "geometrical" && childNode.Content != "technical")  
				console.log("Error cargando datos en linea "+i+". Content="+childNode.Content);
		    
		    //Check if Genre values are valid
		    if (childNode.Genre != "commentary" && childNode.Genre != "compilation"
			&& childNode.Genre != "popularization" && childNode.Genre != "treatise")  
				console.log("Error cargando datos en linea "+i+". Genre= "+childNode.Genre);
				
		    //Check if Style values are valid
		    if (childNode.Style != "canonical" && childNode.Style != "informal"
			&& childNode.Style != "mixed")  
				console.log("Error cargando datos en linea "+i+". Style="+childNode.Style);		

    }
    
    //Following code must be inside this function, in other case jsonData isn't ready and
    //"e undefined" error occurs.
    loadAuthors(); 
    loadWorks();
    
    path = vis.selectAll("path")
       .data(jsonData);
       
    path    
       .enter().append("path");
     
    path
      .each( function(d, i){
         totalWorks += d.Works;
	 totalWords += d.Words;
	 totalChars += d.Chars;
	 numPaths=i+1;
      });
    
    makeSlider();
    makeSliderZoom();
    createFilters();
    make_rules();

    return jsonData;
}

// Calculates probability density function
// mu=mean sigma=variance
// We cut the edges of the function:
//
// 	mu + 3 * sigma
// 	mu - 3 * sigma
//
function createSamples(mu, sigma, gauss, num, dbegin, dend, cutdBegin, cutdEnd) {

      var samples = new Array();

      // We need this values to calculate correctly partial paths without rounding errors.
      if (gauss == "SI") {
		      samples[dbegin] = num * make_gaussian_func_xi(mu,sigma,cutdBegin);
		      samples[dend] = num * make_gaussian_func_xi(mu,sigma,cutdEnd);
      }
      else { 
   		      samples[dbegin] = num * make_semiuniform_func_xi(dbegin,dend,dbegin);
		      samples[dend] = num * make_semiuniform_func_xi(dbegin,dend,dend);
      }
      
      for (var xi=yearmin;xi<=yearmax;xi+=step) {
		if (gauss == "SI") {
		      if (xi < cutdBegin || xi > cutdEnd)
			  samples[xi] = 0;
		      else
			  samples[xi] = num * make_gaussian_func_xi(mu,sigma,xi);
		}
		else {
		      if (xi < dbegin || xi > dend)
			  samples[xi] = 0;
		      else
			  samples[xi] = num * make_semiuniform_func_xi(dbegin,dend,xi);
		}
 	        
      }
     
     return samples;
}

// Calculates cumulative density function
function createCdfSamples(mu, sigma, gauss, num, dbegin, dend) {

      var cdfsamples=new Array();

      // We need this values to calculate correctly partial paths without rounding errors.
      if (gauss == "SI") {
		      cdfsamples[dbegin]=num * cdf(dbegin,mu,sigma*sigma);
		      cdfsamples[dend]=num * cdf(dend,mu,sigma*sigma);
      }
      else { 
   		      cdfsamples[dbegin]=num * cdf_uniform(dbegin,dbegin,dend);
		      cdfsamples[dend]=num * cdf_uniform(dend,dbegin,dend);
      }
      
      for (var xi=yearmin;xi<=yearmax;xi+=step) {
	 
		if (gauss == "SI") 
		      cdfsamples[xi]=num * cdf(xi,mu,sigma*sigma);
		else 
   		      cdfsamples[xi]=num * cdf_uniform(xi,dbegin,dend);
 	        
      }
     
     return cdfsamples;
}

function pctPaths() {
  return parseFloat(numFilteredPaths*100/numPaths).toFixed(2);
}

function pctWorks() {
  return parseFloat(sumWorks*100/totalWorks).toFixed(2);
}

function pctWords() {
  return parseFloat(sumWords*100/totalWords).toFixed(2);
}

function pctChars() {
  return parseFloat(sumChars*100/totalChars).toFixed(2);
}

function updateDomainX() {
   x = d3.scale.linear().domain([timespanMin,timespanMax]).range([0,w]);
}

function updateDomainY(newY) {
   y = d3.scale.linear().domain([ 0, newY]).range([h,0]);
}

function makeSlider() {
  //From: https://github.com/turban/d3.slider
  //Read License
  //Important: step value must be defined in concordance with the rest of the program (step=5).
 d3.select('#slider').call(d3.slider().axis(true).min(timespanMin).max(timespanMax).step(step).value( [ timespanMin, timespanMax ] )
 .on("slide", function(evt, value) {
      timespanMin=Math.round(value[ 0 ]);
      timespanMax=Math.round(value[ 1 ]);
      yearmin=Math.round(value[ 0 ]);
      d3.select('#slidertextmin').text(yearmin);      
      yearmax=Math.round(value[ 1 ]);
      d3.select('#slidertextmax').text(yearmax);
      updateDomainX();
    }));
}


function makeSliderZoom() {
  //From: https://github.com/turban/d3.slider
  //Read License
  d3.select('#sliderzoom').call(d3.slider().value(zoom).axis(true)
    .on("slide", function(evt, value) {
      zoom = Math.round(value);
      var z = zoom != 0 ? 1 - zoom / 101 : 1;
      densityScale = d3.scale.linear().domain([ 0, z]).range([0,100]);
      //d3.select('#sliderval').text(zoom);
    })
    .on("slideend", function() {
        filteredpath.attr("d", function(d) { 
          return d3.svg.line()
		  (
		    x.ticks((yearmax-yearmin)/step).map(function(xi) {
				    return [ x(xi),  y(applyScale(d,xi)) ] }))
		    });    

	  d3.select(".Density-F").remove();
	  drawGlobalDensityFunction();
      }));
}

//On click toggle filter appearance.
function onClickChild(obj,redraw) {
  var p=d3.select(obj.parentNode);
  var t=p.select("#"+obj.id);
  if (obj.style.fontSize != "16px") {
	      t.attr("show","yes")
	      .transition()
	      .attr("style",'font-weight:bold; font-size:16px; color:'+colors[obj.id.toLowerCase()])	      
	      .duration(100);
  } else {
	      p.select("#"+obj.id)
	      .attr("show","no")
	      .transition()
	      .attr("style","font-weight:normal; font-size:12px")
	      .duration(100);
  }
  
   if (t.attr("category") == "Lines") {
		redraw = 0;
                var v = d3.selectAll("path."+obj.id);
	        if (t.attr("show") == "no") {
		      v.style("visibility", "hidden");
		      if (obj.id == "Global-CDF") 
			  d3.select(".cdf").style("visibility", "hidden");
		}
		else {
		      v.style("visibility", "visible");
		      if (obj.id == "Global-CDF") 
			  d3.select(".cdf").style("visibility", "visible");
		}
		
  }
  
  if (redraw == 1)
      createVisualization();
  
}

function toggleAll(obj) {
   var ch1 = d3.select("#"+obj.name)
   var childs = ch1.selectAll("div.child");
   
   childs.each(function(r,i) {
     var el = d3.select(childs[0][i]);
	      
     if (obj.name == "Lines") {
         onClickChild(childs[0][i],0);
     }
     else {
        if (el.attr("show") == "no") {
	    el.attr("show","yes")
	      .attr("style",'font-weight:bold; font-size:16px; color:'+colors[el[0][0].id.toLowerCase()]);
	}
	else {
	    el     
	      .attr("style","font-weight:normal; font-size:12px")
	      .attr("show","no");
	}
     }
	
   });
   
   createVisualization();
}


//Create menu 
function createFilters() {
    var f1 = d3.select("div.filters")
     .selectAll("div.content")
     .data(jsonFilter1)
     .enter()
     .insert("div",".tcolors")
     .attr("class","ctitle") 
     .attr("id",function(d) { return d.name; })
     .attr("style","font-weight:bold");

    var f1_2 = d3.select("div.dat")
     .selectAll("div.content")
     .data(jsonFilter2)
     .enter()
     .append("div")
     .attr("class","ctitle") 
     .attr("id",function(d) { return d.name; })
     .attr("style","font-weight:bold");
     
    var f1_3 = d3.select("div.filters2")
     .selectAll("div.content")
     .data(jsonFilter3)
     .enter()
     .append("div")
     .attr("class","ctitle") 
     .attr("id",function(d) { return d.name; })
     .attr("style","font-weight:bold"); 
     
    d3.select("#Content").append("div").attr("class","tit").text("Content:");
    d3.select("#Genre").append("div").attr("class","tit").text("Genre:");
    d3.select("#Style").append("div").attr("class","tit").text("Style:");
    d3.select("#Graph").append("div").attr("class","titno").text("Graph:");
    d3.select("#Data").append("div").attr("class","tit").text("Data:");
    d3.select("#Date").append("div").attr("class","tit").text("Date:");
    d3.select("#Lines").append("div").attr("class","tit").text("Lines:");
     
    var f2 = f1.selectAll("div.child")
      .data(function(d) { return d.children; })
      .enter()
      .append("div")
      .attr("class","child")
      .attr("category",function(d) { return d3.select(this.parentNode).attr("id") })
      .attr("show","no")
      .attr("id",function(p) { return p.name; })
      .text(function(p) {return p.name; });
      
    var f2_2 = f1_2.selectAll("div.child")
      .data(function(d) { return d.children; })
      .enter()
      .append("div")
      .attr("class","child")
      .attr("category",function(d) { return d3.select(this.parentNode).attr("id") })
      .attr("show","no")
      .attr("id",function(p) { return p.name; })
      .text(function(p) {return p.name; });
      
    var f2_3 = f1_3.selectAll("div.child")
      .data(function(d) { return d.children; })
      .enter()
      .append("div")
      .attr("class","child")
      .attr("category",function(d) { return d3.select(this.parentNode).attr("id") })
      .attr("show","no")
      .attr("id",function(p) { return p.name; })
      .text(function(p) {return p.name; });  
      
    var f3 = d3.selectAll("div.child")
      .attr("style",function(d) { 
		if (d3.select(this.parentNode).attr("id") != "Lines")
		    return "font-weight:normal";
		else {
		    return "style",'font-weight:bold; font-size:16px; color:'+colors[d.name.toLowerCase()];
		}
	})
      .on("click", function() {
	  if (d3.select(this.parentNode).attr("id") != "Graph")
	     onClickChild(this,1);
	  else
	    toggleGraph(this);
      });
      
    var tt = d3.selectAll("div.tit")
         .on("click", function() {
	    toggleAll(this.__data__);
          }); 
     
     d3.select("#Works").attr("style","font-weight:bold; font-size:16px"); //Set default value
     d3.select("div#Lines").selectAll(".child").attr("show","yes");

     d3.select("#auth").on("click", function() {
	   var a=d3.select("div.authors").selectAll("input");
           a.property("checked", function() {
	     return ! this.checked; } );	   
	   a.each(function(e) {
			  authorSelected(e);
		    });
	   }); 

     d3.selectAll("#Approx").text("Approx.");
     
}


// Adds / removes author with the given name from the array of authors.
function pushAuthor(name) {
    var i = authorfilter.indexOf(name);
    if ( i != -1)
	  authorfilter.splice(i,1);
    else
	  authorfilter.push(name);
    return i;
}


// Select or unselect all works of the selected author.
function authorSelected(n) {
    var vworks = jsonData.filter(function(d){ return d.Author == n; });
    var worknames = d3.map(vworks, function(d){return d.Work;}).keys().sort();

    //Put or take selected author from list.
    var i = pushAuthor(n);
    var j;
    
    var chk = d3.select("div.works")
       .selectAll("input")
       .each(function(e) {
            j = worknames.indexOf(e);

	    if (i == -1 ) {	// Author not in filter => ADD
	        if (j != -1) {	// Work of this author
		    d3.select(this).node().checked = true;
		    pushWork(e,"put");
		}
	    }
            else {		// Author in filter => ADD
	        if (j != -1) {  // Work of this author
		  d3.select(this).node().checked = false;  
		  pushWork(e,"take");
		}
	    }
       });
    
}


function loadAuthors() {

    var chk = d3.select("div.authors")
       .selectAll("input")
       .data(d3.map(jsonData, function(d){return d.Author;}).keys().sort())

     console.log("Loading authors...");
       
     chk.enter()
       .append('label')
       .attr('for',function(d,i){ return 'a'+i; })
       .text(function(e) { return capitalizeFirstLetter(e); })
       .insert("input")
       .attr("type","checkbox")
       .attr("onchange", function(d) { return 'authorSelected("'+d+'")' })
       .attr("id", function(d,i) { return 'a'+i; })
       .attr("align", "center")
       
    chk.append('br')  

}

// Adds / removes work with the given name from the array of works.
function pushWork(name, action) {
    var i = workfilter.indexOf(name);
    if ( i != -1 && action != "put") 
	      workfilter.splice(i,1);
    else
      if ( i == -1 && action != "take") 
	      workfilter.push(name);
    
   return i;
}

// Select or unselect the author of the selected work.
function workSelected(n) {
    var author = jsonData.filter(function(d){ return d.Work == n; });
    var authorname = d3.map(author, function(d){return d.Author;}).keys().sort();
    
    var vworks = jsonData.filter(function(d){ return d.Author == authorname; });
    var worknames = d3.map(vworks, function(d){return d.Work;}).keys().sort();

    //Put or take selected work from list.
    var i = pushWork(n, "null");

    //If some other work from the author is selected do not deselect it.
    var found=0;
    worknames.forEach(function(w) {
      if ((i != -1) && (workfilter.indexOf(w) != -1) && (w != n))
	found = 1;
    } );
    
    //No other works selected, so deselect author.
    if (found == 0) {
      var chk = d3.select("div.authors")
       .selectAll("input")
       .each(function(e) {
            var j = authorfilter.indexOf(e);

	    if (i == -1 ) {	//Work not checked
	        if (j == -1) {
		    if ( e == authorname ) {
// 			d3.select(this)
// 			  .attr("checked","true");
		      d3.select(this).node().checked = true;  
			pushAuthor(e);
		    }
		}
	    }
            else {	       //Work checked
	        if (j != -1) {
		  if ( e == authorname ) {
// 		      d3.select(this)
// 			.attr("checked",null);
		      d3.select(this).node().checked = false;  
		      pushAuthor(e);
		  }
		}
	    }
       });
    }
    
}


function loadWorks() {

    var chk = d3.select("div.works")
       .selectAll("input")
       .data(d3.map(jsonData, function(d){return d.Work;}).keys().sort())

     console.log("Loading works...");
       
     chk.enter()
       .append('label')
       .attr('for',function(d,i){ return 'w'+i; })
       .text(function(e) { return capitalizeFirstLetter(e); })
       .insert("input")
       .attr("type","checkbox")
       .attr("onchange", function(d) { return 'workSelected("'+d+'")' })       
       .attr("id", function(d,i) { return 'w'+i; })
       .attr("class", function(d) { return d; })
       .attr("align", "center")
       
    chk.append('br')  

}

// Constructs a String with the conditions selected in the application menu.
// Parameters:
//		category: Determines if only one Category (Content/Genre/Style) is used or All categories are combined
//			  to construct the filter.
//		filterauthor: If only one category is filtered indicates wheter filter by author/s or not.
//		
function makeFilter(categoryfilter, filterauthor) {
   
   filterString="";
   
   //If no authors/works are selected but the filter authors(works check-box is checked then return no results.
   if ( (filterauthor == "Yes" && authorfilter.length == 0 ) || (filterworks == "Yes" && workfilter.length == 0) )  {
	filterString = 'd.Author == NONE';
	return;
   }
   
     d3.selectAll("div.child")
     .each( function(r){
	    var actualChild=d3.select(this);
	    var category=actualChild.attr("category");
	    
	    
 	    if ( actualChild.attr("show") == "yes" && category != "Graph" && category != "Lines") { 
 		  
	        if ( categoryfilter == "All" || categoryfilter == category ) {
 		  
		      if (filterString == "") {
			    filterString = '(d.' + category + ' == ' + '"' + actualChild.attr("id").toLowerCase() + '"'
		      } else {
		      if (category != categoryant)
			      filterString = '(' + filterString + ')) && (d.' + category + ' == ' + '"' + actualChild.attr("id").toLowerCase() + '"'
		      else
			      filterString = filterString + ' || d.' + category + ' == ' + '"' + actualChild.attr("id").toLowerCase() + '"'
		      }
		      categoryant=category;  
	        } 
	    }
	
	} );
	
    if (filterString != "") filterString = filterString + ')' 	

    if (filterauthor == "Yes" && authorfilter.length != 0)  {
	d3.selectAll("div.Authors")
	  if (filterString != "")
	      filterString = filterString + ' && ';
	  filterString = filterString + 'authorfilter.indexOf(d.Author) != -1'    
    }	
    
    if (filterworks == "Yes" && workfilter.length != 0)  {
	d3.selectAll("div.Works")
	  if (filterString != "")
	      filterString = filterString + ' && ';
	  filterString = filterString + 'workfilter.indexOf(d.Work) != -1'    
    }
    
    console.log( filterString );
    categoryant="";
}

function maxChars(){
  var res = Math.max.apply(Math,jsonData.map(function(o){return o.Chars;}))
  return res;
}

function minChars(){
  var res = Math.min.apply(Math,jsonData.map(function(o){return o.Chars;}))
  return res;
}

function maxWords(){
  var res = Math.max.apply(Math,jsonData.map(function(o){return o.Words;}))
  return res;
}

function minWords(){
  var res = Math.min.apply(Math,jsonData.map(function(o){return o.Words;}))
  return res;
}


// mu=mean
// sigma=variance
//
function make_gaussian_func_xi(mu, sigma, xi) {
  // per: http://en.wikipedia.org/wiki/Gaussian_function
  // and: http://mathworld.wolfram.com/GaussianFunction.html
  var sqrt = Math.sqrt, pow = Math.pow, e = Math.E, pi = Math.PI;
  var a = 1 / (sigma * sqrt(2 * pi));
  return a * pow( e, - pow(xi - mu, 2) / (2 * pow(sigma, 2)) );
}

function make_uniform_func_xi(a,b,xi) {
  	  if ((xi < a) || (xi > b)) 
		return 0;
	  else
		return (1/(b-a));
}

//Semi-uniform density function
function make_semiuniform_func_xi(a,b,xi) {
	  if ((xi < a) || (xi > b)) 
	     return 0;
  
          var c = b-a;  
          var c2 = c*c;
  
          if (xi < (a + c/100))
	    return 99*xi/c2 - 99*a/c2;
	  
	  if (xi > (b - c/100))
	    return -99*xi/c2 + 99*b/c2;
  
	  return (100/(99*c));
}

//From: https://en.wikipedia.org/wiki/Uniform_distribution_%28continuous%29
function cdf_uniform(x, a, b) {
  if (x<=a) return 0;
  if (x>=b) return 1;

  return (x-a)/(b-a);
}
  

//Cummulative distribution function
//mu=mean
//sigma*sigma=variance
function cdf(x, mean, variance) {
  return 0.5 * (1 + erf((x - mean) / (Math.sqrt(2 * variance))));
}

function erf(x) {
  // save the sign of x
  var sign = (x >= 0) ? 1 : -1;
  x = Math.abs(x);

  // constants
  var a1 =  0.254829592;
  var a2 = -0.284496736;
  var a3 =  1.421413741;
  var a4 = -1.453152027;
  var a5 =  1.061405429;
  var p  =  0.3275911;

  // A&S formula 7.1.26
  var t = 1.0/(1.0 + p*x);
  var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y; // erf(-x) = -erf(x);
}  


//Unselect all authors checkboxes
function resetAuthors(){
      var chk = d3.select("div.authors")
       .selectAll("input")
       .each(function(e) {
	  d3.select(this).node().checked = false;  
          });
       
      authorfilter = [];

}

//Unselect all works checkboxes 
function resetWorks(){
        var chk = d3.select("div.works")
       .selectAll("input")
       .each(function(e) {
	  d3.select(this).node().checked = false;  
          });
       
      workfilter = [];
}

// Draw the graph.
function createVisualization() {

    makeFilter("All",filterauthors);
  
    // Remove paths from graph.
    d3.selectAll("path").remove();
  
    if (filterString != "") {
    
      drawSinglePaths();   
      
      drawGlobalDensityFunction();
      
      //Draw the paths corresponding to selected styles, genres and contents.
      applycdfScale();
      drawStyleCdf();
      drawGenreCdf();
      drawContentCdf();
      
      drawGlobalCdf();
      
      //Redraw rules
      d3.selectAll("g.rules").remove();
      make_rules();  
      
      printStatistics();
    }
}



function pctScale(x) {
  
  switch(selectedGraph) {
	case "Works":
	    return workScale(x);
	case "Words":
	    return wordScale(x);
	case "Chars":
	    return charScale(x); 
	default: 
	    return cdfScale(x);
   }  
}

function pctSumScale(partial) {
  switch(selectedGraph) {
	case "Works":
	    return partial == "yes" ? sumWorks : totalWorks; 
	case "Words":
	    return partial == "yes" ? sumWords : totalWords;
	case "Chars":
	    return partial == "yes" ? sumChars : totalChars;
	default: 
	    return partial == "yes" ? numFilteredPaths : numPaths;
   }  
}

// Format string to separate miles.
Number.prototype.format = function(){
   return this.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};


// Returns the percentage of works corresponding to
// the selected category, selected Works (global variables)
// and the given subcategory (parameter).
// Partial: return % related to the global total works or 
// related to the partial works of the current selection.
function numWorks(subcat, partial) {
  
    switch(selectedCategory) {
      case "content":
	  return parseFloat(pctSumScale("yes") * pctScale(cdfcontents[yearmax][subcat])/pctSumScale(partial)).toFixed(2);	     
      case "genre":
	  return parseFloat(pctSumScale("yes") * pctScale(cdfgenres[yearmax][subcat])/pctSumScale(partial)).toFixed(2);
      default: // Style
	  return parseFloat(pctSumScale("yes") * pctScale(cdfstyles[yearmax][subcat])/pctSumScale(partial)).toFixed(2);
    }
}


function printInstructions() {
/*  d3.text("usage.html", function(text) {
      d3.select("#rightTextbox")
      .append("html")
      .html(text);
    }); */ 
}

// Prints statistical data related to the current selection.
function printStatistics() {
       
        var tbox = d3.select("#statsTextbox");
	var rbox = d3.select("#rightTextbox");
        
        tbox.selectAll("html").remove();
	rbox.selectAll("html").remove();
        
        var text1 = "<b>" + numFilteredPaths.toFixed(2) + "</b> from <b>" + numPaths.format() + "</b> works selected (<b>" + pctPaths() + "</b> %)<br>" +
		  "<b>" + sumWords.format() + "</b> from <b>" + totalWords.format() + "</b> words selected (<b>" + pctWords() + "</b> %)<br>" +
                  "<b>" + sumChars.format() + "</b> from <b>" + totalChars.format() + "</b> chars selected (<b>" + pctChars() + "</b> %)<br><br>";
        
        if (filterpartial == "No") {
	    var recover=true;
	    updateScales("Yes"); 
	}
        
        // The last % of every category is calculated substracting the sum of the last subcategory from 100. 
        // This is done to hide the rounding errors that produce total % slightly above or under 100 %.
        // This errors only ocurr when the selected time period cuts any path.
        switch(selectedCategory) {
		 case "content":
		      var nArithmetical = +numWorks("arithmetical", "yes");
		      var nAstronomical = +numWorks("astronomical", "yes");
		      var nGeometrical = +numWorks("geometrical", "yes");
		      var nTechnical = +parseFloat(100 - (nArithmetical + nAstronomical + nGeometrical)).toFixed(2);
		      var text2 =  "<b>Arithmetical </b>" + selectedGraph + ": " + "<b>" + nArithmetical + "</b> %  - (" + "<b>" +  numWorks("arithmetical", "no") + "</b> % from total)<br>" +
				   "<b>Astronomical </b>" + selectedGraph + ": " + "<b>" + nAstronomical + "</b> %  -  (" + "<b>" +  numWorks("astronomical", "no") + "</b> % from total)<br>" +
				   "<b>Geometrical </b>" + selectedGraph + ": " + "<b>" + nGeometrical + "</b> %  -  (" + "<b>" + numWorks("geometrical", "no") + "</b> % from total)<br>" +
				   "<b>Technical </b>" + selectedGraph + ": " + "<b>" + nTechnical + "</b> %  -  (" + "<b>" + numWorks("technical", "no") + "</b> % from total)<br>";
		      break;
		 case "genre":
		      var nCommentary = +numWorks("commentary", "yes");
		      var nCompilation = +numWorks("compilation", "yes");
		      var nPopularization = +numWorks("popularization", "yes");
		      var nTreatise = +parseFloat(100 - (nCommentary + nCompilation + nPopularization)).toFixed(2);
		      var text2 =  "<b>Commentary </b>" + selectedGraph + ": " + "<b>" + nCommentary + "</b> %  -  (" + "<b>" + numWorks("commentary", "no") + "</b> % from total)<br>" +
				   "<b>Compilation </b>" + selectedGraph + ": " + "<b>" + nCompilation + "</b> %  -  (" + "<b>" + numWorks("compilation", "no") + "</b> % from total)<br>" +
				   "<b>Popularization </b>" + selectedGraph + ": " + "<b>" + nPopularization + "</b> %  -  (" + "<b>" + numWorks("popularization", "no") + "</b> % from total)<br>" +
				   "<b>Treatise </b>" + selectedGraph + ": " + "<b>" + nTreatise + "</b> %  -   (" + "<b>" + numWorks("treatise", "no") + "</b> % from total)<br>";
		      break;
		 default:
		      var nCanonical = +numWorks("canonical", "yes");
		      var nInformal = +numWorks("informal", "yes");
		      var nMixed = +parseFloat(100 - (nCanonical + nInformal)).toFixed(2);
		      var text2 =  "<b>Canonical </b>" + selectedGraph + ": " + "<b>" + nCanonical + "</b> %  -  (" + "<b>" + numWorks("canonical", "no") + "</b> % from total)<br>" +
				   "<b>Informal </b>" + selectedGraph + ": " + "<b>" + nInformal + "</b> %  -  (" + "<b>" + numWorks("informal", "no") + "</b> % from total)<br>" +
				   "<b>Mixed </b>" + selectedGraph + ": " + "<b>" + nMixed + "</b> %  -  (" + "<b>" + numWorks("mixed", "no") + "</b> % from total)<br>";
	}

	if (recover) {
	    updateScales("No"); 
	}
	
        tbox.append("html")
            .html(text1);
	    
        rbox.append("html")
            .html(text2);	    
}


function choosesample(d,xi) {
	switch(selectedGraph) {
	  case "Works":
	       return d.worksamples[xi]; 
	  case "Words":
	       return d.wordsamples[xi];
	  case "Chars":
    	       return d.charsamples[xi];
// 	  default: 
// 	      return d.samples[xi];
        }       
}
     
function choosecdf(d,xi) {   
	switch(selectedGraph) {
	  case "Works":
	       return d.cdfworks[xi]; 
	  case "Words":
	       return d.cdfwords[xi];
	  case "Chars":
    	       return d.cdfchars[xi];
// 	  default: 
// 	      return d.cdfsamples[xi];
        }
}

// x=number to be rounded
// n=round to this number
function roundX(x,n)
{
    return Math.round(x/n)*n;
}

// Populates the cdf arrays with data corresponding to the current filter selection.
// Must be executed after filteredpath has been updated.
function calculateCdfs() {
   
     sumWorks=0;
     sumWords=0;
     sumChars=0;
    
     filteredpath.each( function(d, i){
	 
	 for (var xi=yearmin;xi<=yearmax;xi+=step) {
	      // The first path is different because all variables are initialized.
 	      if (i==0) {
 	          continuous[xi] = choosesample(d,xi);
		  cummulative[xi] = choosecdf(d,xi) - choosecdf(d,yearmin);
                         
 	          //cdf Styles
 		  cdfstyles[xi] = {"canonical": 0, "informal": 0, "mixed": 0 }
 		  cdfstyles[xi][d.Style] = cummulative[xi];
 	    
 		  //cdf Genre
 		  cdfgenres[xi] = {"commentary": 0, "compilation": 0, "popularization": 0, "treatise": 0 }
 		  cdfgenres[xi][d.Genre] = cummulative[xi];
 	    
 		  //cdf content
 		  cdfcontents[xi] = {"arithmetical": 0, "astronomical": 0, "geometrical": 0, "technical": 0 }
 		  cdfcontents[xi][d.Content] = cummulative[xi];
	      }
	      else {
		  continuous[xi] = Math.max(continuous[xi], choosesample(d,xi));
		  cummulative[xi] += choosecdf(d,xi) - choosecdf(d,yearmin);
		  cdfstyles[xi][d.Style] += choosecdf(d,xi) - cdfstyles[yearmin][d.Style];
		  cdfgenres[xi][d.Genre] += choosecdf(d,xi) - cdfgenres[yearmin][d.Genre];
		  cdfcontents[xi][d.Content] += choosecdf(d,xi) - cdfcontents[yearmin][d.Content];
	      }
      	}
      	
      	
      	    var inside = d.cdfsamples[yearmax] - d.cdfsamples[yearmin];
      	    // Apply time period filter to adjust the words/chars written in this period.
      	    // This approach causes some rounding errors that are propagated to the graph and the percentages.
	    // We round up the begindate and enddate to make it fit in the next xi value.
	    if (d.dateBegin < yearmin && d.dateEnd > yearmin && d.dateEnd <= yearmax) {
	        inside = parseFloat(((d.cdfsamples[d.dateEnd] - d.cdfsamples[yearmin]))).toFixed(2)
		numFilteredPaths -= (1 - inside);
	    }
	    
	    if (d.dateBegin >= yearmin && d.dateBegin <= yearmax && d.dateEnd > yearmax) {
	        inside = parseFloat(((d.cdfsamples[yearmax] - d.cdfsamples[d.dateBegin]))).toFixed(2);
		numFilteredPaths -= (1 - inside);
	    }
	    
	    if (d.dateBegin < yearmin && d.dateEnd > yearmax) {
	        inside = parseFloat(((d.cdfsamples[yearmax] - d.cdfsamples[yearmin]))).toFixed(2);
		numFilteredPaths -= (1 - inside);
	    }
			  
            if (d.dateEnd < yearmin || d.dateBegin > yearmax) {
		numFilteredPaths--;
		inside = 0;
	    }

  	    sumWorks += d.Works * inside;
	    sumWords += d.Words * inside;
	    sumChars += d.Chars * inside;

// 	    sumWorks += Math.round(d.Works * (d.cdfsamples[yearmax] - d.cdfsamples[yearmin]));
// 	    sumWords += Math.round(d.Words * (d.cdfsamples[yearmax] - d.cdfsamples[yearmin]));
// 	    sumChars += Math.round(d.Chars * (d.cdfsamples[yearmax] - d.cdfsamples[yearmin]));
	    
    });
   
   sumWords = Math.round(sumWords);
   sumChars = Math.round(sumChars);
   
   updateScales(filterpartial);
}


function updateScales(partial) {
  if (partial=="Yes") {
       //cdfScale = d3.scale.linear().domain([ 0, numFilteredPaths]).range([0,100]).clamp(true); 
       workScale = d3.scale.linear().domain([ 0, sumWorks]).range([0,100]).clamp(true);
       wordScale = d3.scale.linear().domain([ 0, sumWords]).range([0,100]).clamp(true);
       charScale = d3.scale.linear().domain([ 0, sumChars]).range([0,100]).clamp(true);
  }
  else {
       //cdfScale = d3.scale.linear().domain([ 0, numPaths]).range([0,100]).clamp(true); 
       workScale = d3.scale.linear().domain([ 0, totalWorks]).range([0,100]).clamp(true);
       wordScale = d3.scale.linear().domain([ 0, totalWords]).range([0,100]).clamp(true);
       charScale = d3.scale.linear().domain([ 0, totalChars]).range([0,100]).clamp(true);
  }
}

// Applies the corresponding scale (Works,Words,Chars) to the given value.
// value: current value
function applyScale(d,xi) {
  
   var z = (zoom > 0 ? numFilteredPaths / 10  * zoom : 1); // Avoid zero value for zoom.
    
   switch(selectedGraph) {
	case "Works":
	    return workScale(z * d.worksamples[xi]); 
	case "Words":
	    return wordScale(z * d.wordsamples[xi]);
	case "Chars":
	    return charScale(z * d.charsamples[xi]);
   }  
}


function applycdfScale() {
  
   switch(selectedGraph) {
	case "Works":
	    cdfScale = d3.scale.linear().domain([ 0, (filterpartial == "Yes" ? sumWorks : totalWorks)]).range([0,100]).clamp(true); 
	    break;
	case "Words":
	    cdfScale = d3.scale.linear().domain([ 0, (filterpartial == "Yes" ? sumWords : totalWords)]).range([0,100]).clamp(true); 
	    break;
	case "Chars":
	    cdfScale = d3.scale.linear().domain([ 0, (filterpartial == "Yes" ? sumChars : totalChars)]).range([0,100]).clamp(true); 
	    break;
// 	default: 
// 	    cdfScale = d3.scale.linear().domain([ 0, (filterpartial == "Yes" ? numFilteredPaths : numPaths)]).range([0,100]).clamp(true); 
   }  
}


function applyGdfScale(xi) {   
   //var z = (zoom > 0 ? (50 * numFilteredPaths/numPaths) * zoom : 1); // Avoid zero value for zoom. 
   var z = (zoom > 0 ? numFilteredPaths / 10  * zoom : 1); // Avoid zero value for zoom.
  
   switch(selectedGraph) {
	case "Works":
	    return workScale(z * continuous[xi]); 
	case "Words":
	    return wordScale(z * continuous[xi]);
	case "Chars":
	    return charScale(z * continuous[xi]); 
// 	default: 
// 	    return densityScale(continuous[xi]);
   }  
}


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Draws paths for every single line of the loaded data table.
// Uses selectedCategory variable to determine the color of the paths.
function drawSinglePaths() {

    //Remove visible tooltips
    detaildiv.style("opacity", 0);
    scrolldiv.style("opacity", 0);
   
     //d3.selectAll("path").remove();
  
     filteredpath = vis.selectAll("path")
		    .data(jsonData.filter(function(d) { return eval(filterString); }));

//      filteredpath    
//        .exit().remove();
     
     filteredpath    
       .enter().append("path");
     
     numFilteredPaths = filteredpath[0].length;
    
     //filteredpath.append("svg:title")
     //.text(function(d) { return  });
     filteredpath
        .on("mouseover", function(d) {      
            div.transition()        
                .duration(200)      
                .style("opacity", .95);      
            div.html("<b>" + "<span class=red>" + capitalizeFirstLetter(d.Work) + "</span><br/>" 
	                    + "<span>" + capitalizeFirstLetter(d.Author) + "</span><br/>" 
	                    + "<span class=blue>" + capitalizeFirstLetter(d.Style) + "</span><br/>" 
			    + "<span class=brown>" + capitalizeFirstLetter(d.Genre) + "</span><br/>"
			    + "<span class=green>" + capitalizeFirstLetter(d.Content) + "</span><br/>" 
			    + "<span>" + "Words: " + d.Words.format() + "</span><br/>"
	                    + "<span>" + "Chars: " + d.Chars.format() + "</span><br/>" + "</b>")
                .style("left", (d3.event.pageX > (w - 50) ? d3.event.pageX - 80 : d3.event.pageX - 30) + "px")     
                .style("top", (d3.event.pageY - 160) + "px");    
            })                  
        .on("mouseout", function(d) {       
            div.transition()        
                .duration(250)      
                .style("opacity", 0);   
        })
	.on("click", function(d) {
	   detaildiv.transition()        
                .duration(250)      
                .style("opacity", 0);   
	   detaildiv.transition()        
                .duration(200)      
                .style("opacity", .98);      
           detaildiv .html("<b>" + "<span class=red>" + capitalizeFirstLetter(d.Work) + "</span><br/>" 
	                    + "<span>" + capitalizeFirstLetter(d.Author) + "</span><br/>" 
	                    + "<span class=blue>" + capitalizeFirstLetter(d.Style) + "</span><br/>" 
			    + "<span class=brown>" + capitalizeFirstLetter(d.Genre) + "</span><br/>"
			    + "<span class=green>" + capitalizeFirstLetter(d.Content) + "</span><br/>"
			    + "<span>" + "Works: " + d.Works + "</span><br/>"
			    + "<span>" + "Words: " + d.Words.format() + "</span><br/>"
	                    + "<span>" + "Chars: " + d.Chars.format() + "</span><br/>" + "</b>");
	});
     
     calculateCdfs(); // Computes data necessary to update the scales used to draw the graph.
     
     filteredpath
     .style("fill",function(d) {  if (((d.Gauss == "SI" ) && (d.cutdBegin < yearmin || d.cutdEnd > yearmax)) 
                                   ||((d.Gauss == "NO" ) && (d.dateBegin <= yearmin || d.dateEnd >= yearmax)))
					  return "none"; //Workaround to avoid fill overflow
				  else 
					switch(selectedCategory) {
			 case "content":
			      return colors[d.Content];
			      break;
			 case "genre":
			      return colors[d.Genre];
			      break;
			 default:
			      return colors[d.Style];
			      break;
			}; }) 
     .style("stroke",function(d) {  
     
			switch(selectedCategory) {
			 case "content":
			      return colors[d.Content];
			      break;
			 case "genre":
			      return colors[d.Genre];
			      break;
			 default:
			      return colors[d.Style];
			      break;
			}; 
			})
     .style("stroke-width","2")
     .style("opacity", "1")
     .attr("d", 
     function(d) { return d3.svg.line()
        (
        x.ticks((yearmax-yearmin)/step).map(function(xi) {
               return [ x(xi),  y(applyScale(d,xi)) ] }))
     });    

}

// Draws the addition of all single density functions.
function drawGlobalDensityFunction() {
    vis.append("svg:path")
      .classed("Density-F", true)
      .style("visibility", function(d) {
		  if (d3.select("#Density-F").attr("show") == "no")
		      return "hidden";
		  else
		      return "visible";
		})
      .style("stroke","#FF0000") //grey
      .style("fill","none")
      .style("stroke-width","3")
      .attr("d", function(d) { return d3.svg.line()(
        x.ticks((yearmax-yearmin)/step).map(function(xi) {
          return [ x(xi), y(applyGdfScale(xi)) ] 
        })
       )})
      .append("svg:title")
      .text("Global density function");
}

// Determine selected styles and draw the corresponfing paths.
function drawStyleCdf() {
 
    var selectedStyles = d3.selectAll("#Style").selectAll('[show="yes"]');
    
    //Draw cdf for selected styles
    if (cdfstyles.length > 0) {
	    selectedStyles.each(function(d){
	      var actualstyle=d3.select(this).attr("id").toLowerCase();
	      vis.append("svg:path")
	      .classed("Style-CDF", true)
      	      .style("visibility", function(d) {
		  if (d3.select("#Style-CDF").attr("show") == "no")
		      return "hidden";
		  else
		      return "visible";
		})
	      .style("stroke",colors[actualstyle])
	      .style("fill","none")
	      .style("stroke-width","3")
	      .attr("d", function(e) { return d3.svg.line()(
		x.ticks((yearmax-yearmin)/step).map(function(xi) {
		      return [ x(xi), y(cdfScale(cdfstyles[xi][actualstyle])) ]
		      })
		)})
	       .on("mouseover", function(d) {      
                   smalldiv.transition()        
                      .duration(200)      
                      .style("opacity", .95);      
                   smalldiv.html("<b>" + capitalizeFirstLetter(actualstyle) + "</b>")
		       .style("background", colors[actualstyle])
                       .style("left", (d3.event.pageX > (w - 50) ? d3.event.pageX - 80 : d3.event.pageX - 30) + "px")     
                       .style("top", (d3.event.pageY - 20) + "px");
                     })                  
                .on("mouseout", function(d) {
                   smalldiv.transition()        
                      .duration(200)      
                      .style("opacity", 0)
                 })
		.on("click", function(d) {
		      var inverseX = d3.scale.linear().domain([0,w]).range([timespanMin, timespanMax]);
		      var x0 = roundX(inverseX(d3.event.clientX - this.getBoundingClientRect().left - 30), step);
		      var result = "";
		      var i = 1;
		      var j = 1;
		      var lastauthor = "";
		      filteredpath.filter(function(d){ return d.Style == actualstyle; })
		                  .sort(function(a, b) { return d3.ascending(a.Author, b.Author) })
				  .each(function(d){
					    if (d.dateBegin <= x0 && d.dateEnd >= x0) {
						  if (lastauthor != d.Author) {
						      lastauthor = d.Author;
						      result += '<span class=red>' + d.Author.toUpperCase() + ":</span><br>"
						      j++;
						  }
						  result += "&nbsp;&nbsp;&nbsp;" + i + ": " + d.Work+"<br>";
						  i++;
					    }
				  });
		      scrolldiv.transition()        
			    .duration(300)      
			    .style("opacity", 0);   
		      scrolldiv
			    .transition()        
			    .duration(0)      
			    .style("opacity", .98)
			    //.style("background", colors[actualstyle])
			    .style("height", Math.min(i*13+j*15+5, 205)+"px")
			    .style("left", (d3.event.pageX > (w - 90) ? d3.event.pageX - 180 : d3.event.pageX - 30) + "px")     
			    .style("top", (d3.event.pageY < 300 ? d3.event.pageY : d3.event.pageY - 100) + "px");
		      scrolldiv.html("<b>" + (i==1 ? "&nbsp;&nbsp;&nbsp;&nbsp;No coincidences found" : result) + "</b>");
		  });
	    });
     }
}

// Determine selected genres and draw the corresponfing paths.
function drawGenreCdf() {
    var selectedGenres = d3.selectAll("#Genre").selectAll('[show="yes"]');

    //Draw cdf for selected genres
    if (cdfgenres.length > 0) {
	    selectedGenres.each(function(d){
	      var actualgenre=d3.select(this).attr("id").toLowerCase();
	      vis.append("svg:path")
	      .classed("Genre-CDF", true)
      	      .style("visibility", function(d) {
		  if (d3.select("#Genre-CDF").attr("show") == "no")
		      return "hidden";
		  else
		      return "visible";
		})
	      .style("stroke",colors[actualgenre])
	      .style("fill","none")
	      .style("stroke-width","3")
	      .attr("d", function(e) { return d3.svg.line()(
		x.ticks((yearmax-yearmin)/step).map(function(xi) {
		      return [ x(xi), y(cdfScale(cdfgenres[xi][actualgenre])) ]
		      })
		)})
	       .on("mouseover", function(d) {      
                   smalldiv.transition()        
                      .duration(200)      
                      .style("opacity", .95);      
                   smalldiv.html("<b>" + capitalizeFirstLetter(actualgenre) + "</b>")
		       .style("background", colors[actualgenre])
                       .style("left", (d3.event.pageX > (w - 50) ? d3.event.pageX - 80 : d3.event.pageX - 30) + "px")     
                       .style("top", (d3.event.pageY - 20) + "px");
                     })                  
                .on("mouseout", function(d) {
                   smalldiv.transition()        
                      .duration(200)      
                      .style("opacity", 0);   
                 })
		.on("click", function(d) {
		      var inverseX = d3.scale.linear().domain([0,w]).range([timespanMin, timespanMax]);
		      var x0 = roundX(inverseX(d3.event.clientX - this.getBoundingClientRect().left - 30), step);
		      var result = "";
		      var i = 1;
		      var j = 1;
		      var lastauthor = "";
		      filteredpath.filter(function(d){ return d.Genre == actualgenre; })
		                  .sort(function(a, b) { return d3.ascending(a.Author, b.Author) })
				  .each(function(d){
					    if (d.dateBegin <= x0 && d.dateEnd >= x0) {
						  if (lastauthor != d.Author) {
						      lastauthor = d.Author;
						      result += '<span class=red>' + d.Author.toUpperCase() + ":</span><br>"
						      j++;
						  }
						  result += "&nbsp;&nbsp;&nbsp;" + i + ": " + d.Work+"<br>";
						  i++;
					    }
				  });
		      scrolldiv.transition()        
			    .duration(300)      
			    .style("opacity", 0);   
		      scrolldiv
			    .transition()        
			    .duration(0)      
			    .style("opacity", .98)
			    //.style("background", colors[actualgenre])
			    .style("height", Math.min(i*13+j*15+5, 205)+"px")
			    .style("left", (d3.event.pageX > (w - 90) ? d3.event.pageX - 180 : d3.event.pageX - 30) + "px")     
			    .style("top", (d3.event.pageY < 300 ? d3.event.pageY : d3.event.pageY - 100) + "px");
		      scrolldiv.html("<b>" + (i==1 ? "&nbsp;&nbsp;&nbsp;&nbsp;No coincidences found" : result) + "</b>");
		  });
	    });
     }
}


// Determine selected contents and draw the corresponfing paths.
function drawContentCdf() {
//Determine selected contents.
    var selectedContents = d3.selectAll("#Content").selectAll('[show="yes"]');    
    
    //Draw cdf for selected contents
    if (cdfcontents.length > 0) {
	    selectedContents.each(function(d){
	      var actualcontent=d3.select(this).attr("id").toLowerCase();
	      vis.append("svg:path")
	      .classed("Content-CDF", true)
	      .style("visibility", function(d) {
		  if (d3.select("#Content-CDF").attr("show") == "no")
		      return "hidden";
		  else
		      return "visible";
		})
	      .style("stroke",colors[actualcontent])
	      .style("fill","none")
	      .style("stroke-width","3")
	      .attr("d", function(e) { return d3.svg.line()(
		x.ticks((yearmax-yearmin)/step).map(function(xi) {
		      return [ x(xi), y(cdfScale(cdfcontents[xi][actualcontent])) ]
		      })
		)})
	       .on("mouseover", function(d) {      
                   smalldiv.transition()        
                      .duration(200)      
                      .style("opacity", .95);      
                   smalldiv.html("<b>" + capitalizeFirstLetter(actualcontent) + "</b>")
		       .style("background", colors[actualcontent])
                       .style("left", (d3.event.pageX > (w - 50) ? d3.event.pageX - 80 : d3.event.pageX - 30) + "px")     
                       .style("top", (d3.event.pageY - 20) + "px");
                     })                  
                .on("mouseout", function(d) {
                   smalldiv.transition()        
                      .duration(200)      
                      .style("opacity", 0);   
                 })
		.on("click", function(d) {
		      var inverseX = d3.scale.linear().domain([0,w]).range([timespanMin, timespanMax]);
		      var x0 = roundX(inverseX(d3.event.clientX - this.getBoundingClientRect().left - 30), step);
		      var result = "";
		      var i = 1;
		      var j = 1;
		      var lastauthor = "";
		      filteredpath.filter(function(d){ return d.Content == actualcontent; })
		                  .sort(function(a, b) { return d3.ascending(a.Author, b.Author) })
				  .each(function(d){
					    if (d.dateBegin <= x0 && d.dateEnd >= x0) {
						  if (lastauthor != d.Author) {
						      lastauthor = d.Author;
						      result += '<span class=red>' + d.Author.toUpperCase() + ":</span><br>"
						      j++;
						  }
						  result += "&nbsp;&nbsp;&nbsp;" + i + ": " + d.Work+"<br>";
						  i++;
					    }
				  });
		      scrolldiv.transition()        
			    .duration(300)      
			    .style("opacity", 0);   
		      scrolldiv
			    .transition()        
			    .duration(0)      
			    .style("opacity", .98)
			    //.style("background", colors[actualcontent])
			    .style("height", Math.min(i*13+j*15+5, 205)+"px")
			    .style("left", (d3.event.pageX > (w - 90) ? d3.event.pageX - 180 : d3.event.pageX - 30) + "px")     
			    .style("top", (d3.event.pageY < 300 ? d3.event.pageY : d3.event.pageY - 100) + "px");
		      scrolldiv.html("<b>" + (i==1 ? "&nbsp;&nbsp;&nbsp;&nbsp;No coincidences found" : result) + "</b>");
		      scrolldiv.style("pointer-events", "visible");
		  });
	    });
     }
}

// Draws global cdf.
function drawGlobalCdf() {
    vis.append("svg:path")
      .classed("Global-CDF", true)
      .style("visibility", function(d) {
	    if (d3.select("#Global-CDF").attr("show") == "no")
		return "hidden";
	    else
		return "visible";
        })
      .style("stroke",colors["global-cdf"])
      .style("fill","none")
      .style("stroke-width","4")
      //.style("opacity", .75)
      .attr("d", function(d) { return d3.svg.line()(
        x.ticks((yearmax-yearmin)/step).map(function(xi) {
	      return [ x(xi), y(cdfScale(cummulative[xi])) ]
	      })
        )});
      
      vis.append("svg:path")
      .classed("cdf", true)
      .style("visibility", function(d) {
	    if (d3.select("#Global-CDF").attr("show") == "no")
		return "hidden";
	    else
		return "visible";
        })
      .style("stroke",colors["global-cdf"])
      .style("fill","none")
      .style("stroke-width","15")
      .style("opacity", .001)
      .attr("d", function(d) { return d3.svg.line()(
        x.ticks((yearmax-yearmin)/step).map(function(xi) {
	      return [ x(xi), y(cdfScale(cummulative[xi])) ]
	      })
        )})
      .on("click", function(d) {
	   var inverseX = d3.scale.linear().domain([0,w]).range([timespanMin, timespanMax]);
	   var x0 = roundX(inverseX(d3.event.clientX - this.getBoundingClientRect().left - 30), step);
	   var result = "";
	   var i = 1;
	   var j = 1;
	   var lastauthor = "";
	   filteredpath.sort(function(a, b) { return d3.ascending(a.Author, b.Author) })
	               .each(function(d){
	                        if (d.dateBegin <= x0 && d.dateEnd >= x0) {
				       if (lastauthor != d.Author) {
					  lastauthor = d.Author;
					  result += '<span class=red>' + d.Author.toUpperCase() + ":</span><br>"
					  j++;
				       }
		                       result += "&nbsp;&nbsp;&nbsp;" + i + ": " + d.Work+"<br>";
				       i++;
				}
		      });
	   scrolldiv.transition()        
                .duration(500)      
                .style("opacity", 0);   
	   scrolldiv
		.transition()        
                .duration(0)      
                .style("opacity", .98)
		.style("height", Math.min(i*13+j*15+5, 205)+"px")
		.style("left", (d3.event.pageX > (w - 90) ? d3.event.pageX - 180 : d3.event.pageX - 30) + "px")     
                .style("top", (d3.event.pageY < 300 ? d3.event.pageY : d3.event.pageY - 100) + "px");
           scrolldiv.html("<b>" + (i==1 ? "&nbsp;&nbsp;&nbsp;&nbsp;No coincidences found" : result) + "</b>");
	   scrolldiv.style("pointer-events", "visible");
      })
      .append("svg:title")
      .text(function(d) { return "Total"; });      
}


function make_rules() {
  var rules = svg.append("svg:g")
  .classed("rules", true)
  .attr("transform", "translate(20,30)");

  function make_x_axis() {
    return d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(20)
  }

  function make_y_axis() {
    return d3.svg.axis()
        .scale(y)
        .orient("right")
        .ticks(25)
  }

  rules.append("svg:g").classed("grid x_grid", true)
      .attr("transform", "translate(0,"+h+")")
      .call(make_x_axis()
        .tickSize(-h,0,0)
        .tickFormat("")
      )

  rules.append("svg:g").classed("grid y_grid", true)
      .call(make_y_axis()
        .tickSize(w,0,0)
        .tickFormat("")
      )

  rules.append("svg:g").classed("labels x_labels", true)
      .attr("transform", "translate(0,"+h+")")
      .call(make_x_axis()
        .tickSize(5)
        // .tickFormat(d3.time.format("%Y/%m"))
      )

  rules.append("svg:g").classed("labels y_labels", true)
      .call(make_y_axis()
        .tickSubdivide(1)
        .tickSize(10, 5, 0)
      )
      .attr("transform", "translate("+w+",0)");
      
}


