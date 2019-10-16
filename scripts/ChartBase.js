import EventEmitter from 'events'
import { mcolor } from './color.js'
let d3formatter = require("d3-format");
let d3 = Object.assign(d3formatter, require("d3-fetch"), require("d3-time-format"), require("d3-scale"), require("d3-axis"), require("d3-color"), require("d3-path"), require("d3-selection"), require("d3-selection-multi"), require("d3-shape"), require("d3-transition"), require("d3-time"), require("d3-svg-annotation"));

import { DataStreamParse } from './DataStreamParse.js'
import { DataParser } from './DataParser.js'
import chartTemplate from '../templates/chartTemplate.html'
import chartLegendTemplate from '../templates/chartLegendTemplate.html'
import chartTipTemplate from '../templates/chartTipTemplate.html'

class ChartBase extends EventEmitter {
		
	constructor(opts){
		super();	
		
		//sets time format and number format as per the locale in PO file.
		d3.timeFormatDefaultLocale(this.locales(gettext("en")))
		d3.formatDefaultLocale(this.locales(gettext("en")));
		
		//object of defaults that get applied to the class			
		this.defaults = {
			hasPym:true,
			dataType:'value',
			xScaleType:'Linear',
			yScaleType:'Linear',
			xScaleTicks: 5,
			yScaleTicks:5,			
			xValue:'date',
			yValue:'value',
			xOrY : "x",
			yOrX : "y",
			leftOrTop : "left",
			topOrLeft : "top",
			heightOrWidth : "height",
			widthOrHeight : "width",
			bottomOrRight:"bottom",
			rightOrBottom:"right",
			colors:[blue3, purple3,orange3, red3,yellow3],
			dateFormat: d3.timeFormat("%b %Y"),
			dateParse:	undefined,
			recessionDateParse :d3.timeParse("%m/%d/%Y"),
			divisor:1,
			categorySort:"none",
			groupSort:"descending",
			chartTemplate:chartTemplate,
			legendTemplate:chartLegendTemplate,
			tipTemplate:chartTipTemplate,
			dataTransformation:"none",
			xorient:"Bottom",
			yorient:"Left",
			yTickFormatter: (d,i,nodes)=>{
				return this.yTickFormat(d,i,nodes)
			},
		
			xTickFormatter: (d,i,nodes)=>{
				return this.xTickFormat(d,i,nodes)
			},
			includeXAxis:true,
			includeYAxis:true,			
			YTickLabel: [["",""]],
			numbFormat: d3.format(",.0f"),
			lineType: "Linear",
			chartBreakPoint:400,
			hasLegend:true,
			firstRun:true,
			updateCount:0,
			visiblePosition:"onScreen",
			animateOnScroll:false,
			chartLayout:"basic",
			multiFormat: (date) => {
				let formatMillisecond = d3.timeFormat(".%L"),
				    formatSecond = d3.timeFormat(":%S"),
				    formatMinute = d3.timeFormat("%I:%M"),
				    formatHour = d3.timeFormat("%I %p"),
				    formatDay = d3.timeFormat("%a %d"),
				    formatWeek = d3.timeFormat("%b %d"),
				    formatMonth = d3.timeFormat("%B"),
				    formatYear = d3.timeFormat("%Y");
			  return (d3.timeSecond(date) < date ? formatMillisecond
			      : d3.timeMinute(date) < date ? formatSecond
			      : d3.timeHour(date) < date ? formatMinute
			      : d3.timeDay(date) < date ? formatHour
			      : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
			      : d3.timeYear(date) < date ? formatMonth
			      : formatYear)(date);
			},
			annotationType:d3.annotationLabel,
			annotationDebug:false,
			hardRadius:5,
			idField:"uniqueid",
			radiusModifier:1.5,
			yAxisLineLength:"default",
			xAxisLineLength:"default",	
			customYAxis: (g) =>{
				let s = g.selection ? g.selection() : g;
				this.yAxis(g)

				let rightMod = 1;
				let rightMarg = -this.margin.left;
				if (this.yorient == "Right"){
					rightMod = -1;
					rightMarg = -this.margin.right +8 ;
				}
				
				let propObj = {
					lineX1 : rightMarg * rightMod,
					lineX2 : this.width * rightMod,
					textX : -8 * rightMod,
					textDy : -4					
				}
				
				if (this.horizontal){
					propObj = {
						lineX1 : 0,
						lineX2 : -6 * rightMod,
						textX : -8 * rightMod,
						textDy : 2					
					}
				}
				
				if (this.yAxisLineLength == "long"){
					propObj = {
						lineX1 : 0,
						lineX2 :this.width * rightMod,
						textX : -8 * rightMod,
						textDy : 2					
					}					
				}

				if (this.yAxisLineLength == "short"){
					propObj = {
						lineX1 : -4 * rightMod,
						lineX2 :-10 * rightMod,
						textX : -12 * rightMod,
						textDy : 2					
					}					
				}

				if (this.yAxisLineLength == "none" || (this[`${this.yOrX}Value`] == "category" && ! this.options.yAxisLineLength)){
					propObj = {
						lineX1 : 0,
						lineX2 :0,
						textX : -12 * rightMod,
						textDy : 2					
					}					
				}

				s.select(".domain").remove();
				s.selectAll(".tick line").attr("x1", propObj.lineX1).attr("x2", propObj.lineX2)
				s.selectAll(".tick text").attr("x", propObj.textX).attr("dy", propObj.textDy);
				
							
				if (s !== g) g.selectAll(".tick line").attrTween("x1", null).attrTween("x2", null);
				if (s !== g) g.selectAll(".tick text").attrTween("x", null).attrTween("dy", null);		
			},
			customXAxis: (g) =>{
				
				let s = g.selection ? g.selection() : g;
				this.xAxis(g)
				s.select(".domain").remove();
				if (this.horizontal){
					//s.selectAll(".tick:last-of-type text").attr("text-anchor", "end")
				}
				
				let topMod = 1;
				if (this.xorient == "Top"){
					topMod = -1;
				}
				
				let propObj = {
					lineY1 :0,
					lineY2 : 6 * topMod,
				}
				
				if (this.horizontal || this.xAxisLineLength == "long"){
					propObj = {
						lineY1 : 0,
						lineY2 : -this.height  * topMod,
					}
				}
				
				if (this.xAxisLineLength == "short"){
					propObj = {
						lineY1 :0,
						lineY2 : 6 * topMod,
					}
				}
				
				if (this.xAxisLineLength == "none" || (this[`${this.xOrY}Value`] == "category" && ! this.options.xAxisLineLength)){
					propObj = {
						lineY1 :0,
						lineY2 : 0,
					}					
				}
												
				
				s.selectAll(".tick line").attr("y1", propObj.lineY1).attr("y2", propObj.lineY2)

				if (s !== g) g.selectAll(".tick line").attrTween("y1", null).attrTween("y2", null);
				if (s !== g) g.selectAll(".tick text").attrTween("x", null).attrTween("dy", null);		
			}		
													    
		    
		}
		_.each(this.defaults, (item, key) => {
			this[key] = item;
		});
		
		this.options = opts;				
		_.each(opts, (item, key) => {
			this[key] = item;
		});
		//after defaults and options from charter block applied, load data
		this.loadData();
		
		return this;	
	}

	$(selector) {
      return this.$el.find(selector);
    }
    
	//////////////////////////////////////////////////////////////////////////////////
	///// LOADING AND PARSING DATA
	//////////////////////////////////////////////////////////////////////////////////    
    	
	loadData () {
		//test if trying to load csv, or sheets url, or just passing in ready made object
		if (this.dataURL.indexOf("csv") == -1 && !_.isObject(this.dataURL)){
			d3.json(this.dataURL).then( (data) => {
			  this.preRender (data);
			});
		} 
		if (this.dataURL.indexOf("csv") > -1){
			d3.csv(this.dataURL).then( (data) => {
			  this.preRender (data);
			});
		}
		if (_.isObject(this.dataURL)){
			setTimeout( () => {
				this.preRender (this.dataURL);											
			}, 100);
		}		
		
	}

	parseData (data) {
		this.data = data;
		//run dataParser.  For line and bar charts makes an array of objects for each column header being plotted, and array of data points under value.
		//see dataparser module.
		//if there is multidatacolumns will make a copy of the data under each "type" in data.  and set the current one to this.data.
		this.multiDataColumns.forEach( (d) => {
			let currentData = _.groupBy(this.data,"type")[d] || JSON.parse(JSON.stringify(this.data));
			this[d] = new DataParser({
				data:currentData,
				dateFormat:this.dateFormat,
				dateParse:this.dateParse,
				chartType:this.chartType,
				xValue:this.xValue,
				yValue:this.yValue,
				xValueSort:this.xValueSort,
				columnNames:this.columnNames,
				columnNamesDisplay:this.columnNamesDisplay,
				divisor:this.divisor,
				categorySort:this.categorySort,
				groupSort:this.groupSort,
				dataType:this.dataType
			});
		})

		this.data = this[ this.multiDataColumns[this.multiDataColumns.length - 1] ]
		//chart data is different then main data in that it removes any data columns that are filtered out (pressed on legend button, for instance)  also re-runs the sorts and the stack bar logic upon removal or addition of data.
		this.chartData = this.makeChartData (this.data)
	
	}	

	preRender (data) {
		this.emit("data:parsing", this)

		//make deep copy of data, in case using object in several charts
		data = JSON.parse(JSON.stringify(data));
		//if it's datastream will reconfigure datastream raw data to charter format
		this.setDataStream(data);		
		//run through setting properties on class based on options chosen in charter block.
		this.setOptions(this.data);
		
		this.parseData(this.data);
		
		//renders all the things.  Render is called from extended chart.  is not in base chart.
		this.baseRender();
		this.render()

		
		this.emit("data:parsed", this)
		
	}
	
	setDataStream(data){
		//parses data stream data, see datastreamparse module.
		if (this.dataStreamOpts){
			//if (!_.isObject(this.dataStreamOpts)){this.dataStreamOpts = {}}
			this.dataStreamOpts.data = data;
			this.data = new DataStreamParse(this.dataStreamOpts)
		}else{
			this.data = data;
		}		
	}
	
	
	makeChartData (data){
		//reruns data sorts and stacks to account for new or removed data.
		let filtered = data.filter( (d) => d.visible )
		
		filtered = new DataParser({
			data:filtered,
			dateFormat:this.dateFormat,
			dateParse:this.dateParse,
			chartType:this.chartType,
			xValue:this.xValue,
			yValue:this.yValue,
			xValueSort:this.xValueSort,
			columnNames:this.columnNames,
			columnNamesDisplay:this.columnNamesDisplay,
			divisor:this.divisor,
			categorySort:this.categorySort,
			groupSort:this.groupSort,
			dataType:this.dataType,
			resorting:true,
		});

		return filtered;
	}

	//////////////////////////////////////////////////////////////////////////////////
	///// SETTING OPTIONS
	//////////////////////////////////////////////////////////////////////////////////  
	
	setOptions (data) {
		this.emit("chart:settingOptions", this)

		//sets piles of options based on chart block options and data.
		this.$el = $(this.el);
		this.setOptTooltips();
		this.setOptPolling();			
		this.setOptMultiData(data);		
		this.setOptCategory(data);
		this.setOptScaleTypes ();
		this.setOptHorizontal();
		this.setOptDataTransforms ();
		this.setOptDateParse(data);
		this.setOptChartColumns(data);
		this.setOptColorScales(data);
		this.setOptHasLegend(data);
		this.renderBaseTemplate();		
		this.setOptSelectors();
		this.setOptBreakpoint ();
		this.checkLegendBreakpoint();		
		this.setOptMargins();		
		this.setOptWidth();
		this.setOptHeight();
		this.setOptDataLabels();
		this.setOptQuarterFormat();
		this.setOptPolling();
		
		this.emit("chart:optionsSet", this)

	}
	
	setOptTooltips (){
		if (this.simpleTips){
			this.options.showTip = "off";
			this.showTip = "off"
		}
	}

	tipNumbFormat (d) {
		//what returns in the value div of the tooltip and the legend.  Can override the defaults here or make logic tests. 
		if (isNaN(d) === true){return "N/A";}else{
			let space = " ";
			if (this.dataLabels[1] == "%"){space = ""}
			return `${this.dataLabels[0]}${this.numbFormat(d)}${space}${this.dataLabels[1]}` ;				
		}				
	}

	setOptMultiData (data){
		//if multidatacolumns is mapped object, breaks appart to two matched arrays.
		if (_.isObject(this.multiDataColumns) && !_.isArray(this.multiDataColumns)){
			this.multiDataLabels = _.values(this.multiDataColumns);
			this.multiDataColumns = _.keys(this.multiDataColumns);
		}
		//if multidatacolumns is undefined, tries to make them from the type column in data.
		if (data[0].type && !this.multiDataColumns){
			this.multiDataColumns = _.uniq(_.map(data, 'type'));
		}
		//if you've defined multidatacolumns, but there is no type column in data, chances are you are trying to toggle transformations.  adjusts for that.
		if (this.multiDataColumns && !data[0].type){
			this.dataType = this.multiDataColumns[this.multiDataColumns.length-1]
			this.multiTransforms = true;
		}
		//if you've gotten this far, and there are no explicit labels, sets labels to match raw column names.
		if (!this.multiDataLabels && this.multiDataColumns){
			this.multiDataLabels = this.multiDataColumns;
		}
		//if no multi at all, sets one of just data, so that data can render through on loop.
		if (!this.multiDataColumns){
			this.multiDataColumns = ["data"]
		}		
	}
	
	setOptCategory (data){
		//if category exists, and we are not expressly setting x and y values, assume that xvalue is category
		if (data[0].category && !this.options.xValue){
			this.xValue = "category"
		}		
	}

	setOptScaleTypes (){
		//attempt to determine scale types.
		if (this.xValue == "date"){ this.xScaleType = "Time"; }
		if (this.xValue.indexOf("category") > -1 ){ this.xScaleType = "Point"; }
		if (this.yValue == "date"){ this.yScaleType = "Time"; }
		if (this.yValue.indexOf("category") > -1){ this.yScaleType = "Point"; }		
	}
	
	setOptHorizontal(){
		//horizontal charts basically invert all directional values.
		if (this.horizontal){
			this.xOrY = "y";
			this.yOrX = "x";
			this.leftOrTop = "top"; 
			this.heightOrWidth = "width";
			this.widthOrHeight = "height";				
			this.topOrLeft = "left";
			this.bottomOrRight="right";
			this.rightOrBottom="bottom";		
		}
	}

	setOptDataTransforms (){
		//i use dataType internally, but decided that was hard to understand in block, so basically i'm just taking in that option and resetting.		
		if (this.dataTransformation != "none"){
			this.dataType = this.dataTransformation;
		}		
	}
	
	setOptDateParse(data){
		//if specific parse date isn't set, assume that it's month day day year, and try to figure if it's two digit year or four
		if (data[0].date && !this.dateParse ){
			if (data[0].date.split('/')[2].length == 2){						
				 this.dateParse = d3.timeParse("%m/%d/%y");
			}
			if (data[0].date.split('/')[2].length == 4){						
				 this.dateParse = d3.timeParse("%m/%d/%Y");
			}			
		}		
	}
	
	setOptChartColumns(data){
		//Define columns of data to chart, and the names to display
		//same logic as above, trying to determine if they are dfined ata ll, if they are an object, or if arrays.
		if (!this.columnNames){
			this.columnNames = _.keys(data[0]).filter( (d) => (d != "date" && d != "category"  && d !== "type"  && d !== "rawDate" && d !== "displayDate"  && d!== this.xValue && d!== this.moeColumn) );
			this.columnNamesDisplay = this.columnNames;
		}
		if (_.isObject(this.columnNames) && !_.isArray(this.columnNames)){
			this.columnNamesDisplay = _.values(this.columnNames);
			this.columnNames = _.keys(this.columnNames);
		}
		if (_.isArray(this.columnNames) && !this.columnNamesDisplay){
			this.columnNamesDisplay = this.columnNames;
		}		
	}
	
	setOptColorScales(){		
		//Define Color Scale
		//again, if object, make domain and range from object keys and values.  otherwise use columnNames from above as domain, and array of colors as colors.		
		this.colorScale = d3.scaleOrdinal();				
		if (_.isObject(this.colors) && !_.isArray(this.colors)){
			this.colorScale.domain(_.keys(this.colors));
			this.colorScale.range(_.values(this.colors));
		}
		if (_.isArray(this.colors)){
			this.colorScale.domain(this.columnNames);
			this.colorScale.range(this.colors);
		}		
	}

	setOptHasLegend(){
		//turns off the legend if plotting only one thing.  Unless legend specifically asked for in block.
		if (this.columnNames.length == 1 && !this.options.hasLegend){
			this.hasLegend = false;
		}		
	}	
	
	renderBaseTemplate(){
		//woohoo we actually render the base html.  
		this.$el.html(this.chartTemplate({self:this}))
	}

	setOptSelectors(){
		//make a label based on the div's ID to use as unique identifiers 
		this.targetDiv = this.$el.attr("id");
		this.chartDiv = `${this.targetDiv} .chart`;
		this.legendDiv = `${this.targetDiv} .legend`;
		this.$chartEl = $(`#${this.chartDiv}`);
		this.$legendEl = $(`#${this.legendDiv}`);
		this.masterWidth = this.$el.width();
	}

	setOptBreakpoint (){
		//if top legend selected, just sets an outrageous breakpoint.
		if (this.topLegend){
			this.chartBreakPoint = 3000;
		}
	}	
	checkLegendBreakpoint(){
		//if width of chart drops below certain point, moves legend up top. w/ smaller class.  Activates tooltip, unless specifically required to not have one via options.
		if (!this.hasLegend){return}
		if (this.$el.width() < this.chartBreakPoint){
			this.$el.find('.chart-holder').addClass("smaller");
			if (this.options.showTip != "off"){
				this.showTip = true;				
			}

		}else{
			this.$el.find('.chart-holder').removeClass("smaller");
			this.showTip = this.options.showTip;
		}		
	}	
	
	setOptMargins(){
		//replace each margin value w/ margin value from options.
		let margin = {top: 15, right: 20, bottom: 30, left: 40}
		_.extend(margin,this.options.margin);

		this.margin = margin;		
	}
	
	setOptWidth(){
		//set the width and the height to be the width and height of the div the chart is rendered in
		this.width = this.$chartEl.width() - this.margin.left - this.margin.right;
		
	}
	
	setOptHeight(){
		//if no height set, square, otherwise use the set height, if lower than 10, it is a ratio to width
		if (!this.options.height){
			this.height = this.$chartEl.width() - this.margin.top - this.margin.bottom;			
		}
		if (this.options.height < 10){
			if ($(window).width() < 400){
				this.height = this.$chartEl.width() - this.margin.top - this.margin.bottom;							
			}else{
				this.height = (this.$chartEl.width() * this.options.height) - this.margin.top - this.margin.bottom;				
			}
		}
	}
	
	setOptDataLabels(){
		//datalabels are the current y axis labels.  Sets to the last one in the array as default.
		this.dataLabels = this.YTickLabel[this.YTickLabel.length-1];				
	}
	
	setOptQuarterFormat(){
		//if quarterformat, then replaces the date formatter.
		if (this.quarterFormat){
			this.dateFormat = this.quarterFormater
		}		
	}

	quarterFormater (d){
		//formats the dates to quarters for display in tooltips and legends.
		let yearformat = d3.timeFormat(" %Y")	
		let monthformat = d3.timeFormat("%m")
		let quarters = {
			"01":"Q1",
			"02":"Q1",
			"03":"Q1",
			"04":"Q2",
			"05":"Q2",
			"06":"Q2",
			"07":"Q3",
			"08":"Q3",
			"09":"Q3",
			"10":"Q4",
			"11":"Q4",
			"12":"Q4",
		}					
		return quarters[monthformat(d)] +yearformat(d)
	}	

	quarterAxisFormater (d){
		//samsies, but for axis, year is only shown on q1
		let yearformat = d3.timeFormat(" '%y")	
		let monthformat = d3.timeFormat("%m")
		let quarters = {
			"01":`Q1 ${yearformat(d)}`,
			"02":`Q1 ${yearformat(d)}`,
			"03":`Q1 ${yearformat(d)}`,
			"04":"Q2",
			"05":"Q2",
			"06":"Q2",
			"07":"Q3",
			"08":"Q3",
			"09":"Q3",
			"10":"Q4",
			"11":"Q4",
			"12":"Q4",
		}
					
		return quarters[monthformat(d)]
	}
	
	setOptPolling(){
		//if this is a polling chart, lots of options get overridden.
		if (this.isPoll && this.chartType == "line"){this.chartLayout = "fillLines";}		
		if (this.isPoll && this.chartType != "line" && this.leftBarCol){
			this.moeLabelObj = this.options.columnNames;
			this.options.colors[this.centerCol] = "none";
			this.colors[this.centerCol] = "none";
			this.legendItemsArray = [this.rightBarCol, this.centerCol, this.leftBarCol];			
			this.hasLegend = false;
			this.options.hasLegend = false;
			this.horizontal=true;
			this.chartLayout="stackTotal"
			this.yScaleMax=function(){
				return 100;
			}
			this.categorySort= "none";
			this.yScaleVals= [0,25,50,75,100];
			this.groupSort=this.legendItemsArray;
			this.YTickLabel= [[gettext(""),gettext("%")]];
		}		
		
	}
		
	//////////////////////////////////////////////////////////////////////////////////
	///// ALL YOUR BASE RENDER NOW BELONG TO US.
	//////////////////////////////////////////////////////////////////////////////////  	
	
	baseRender () {
		this.emit("chart:renderingBase", this)

		this.barCalculations();
		this.renderChartLayoutButtons();		
		this.appendSVG();
		this.appendPlot();
		this.appendClip();
		this.scales = {
			x: this.getXScale(),
			y: this.getYScale()
		};

		this.recessionMaker();
		this.renderAxis();
		this.renderLegend();
		this.renderMultiButtons();
		this.renderTooltips();
		
		this.renderEvents();

		if (this.annotations){
			this.labelAdder();
		}

		if (this.scaleLabels){
			this.$("svg").css({"overflow":"visible"});
			this.renderScaleLables();
		}
		
		
		//after rendering we run an update w/ the transition time as one second.  basically, we need to render the whole chart so we can figure out how big the margins actually need to be, and once that is accomplished, we can rerender the whole thing with these new margins.
		this.baseUpdate(1);			

		this.emit("chart:baseRendered", this)
				
	}
	
	numberOfObjects (){ 
		//calculates how many values you are plotting.  changes as you add and remove items.
		//fudge for some layouts, even though multiple items, act as if there is only one.
		if (this.chartLayout == "onTopOf" || this.chartLayout == "outlineBar"){ return 1; }else{
			return this.chartData.length;
		}
	}

	widthOfBar (){
		//determines how big a bar should be, based on how many data points, width of the chart area and chart layout.
		if (this.chartLayout == "stackTotal" || this.chartLayout == "stackPercent"){
			return (this[this.widthOrHeight] / (this.dataLength)) - (this[this.widthOrHeight] / (this.dataLength)) * 0.2;
		}else{				
			return (this[this.widthOrHeight] / (this.dataLength*this.numberOfObjects())) - (this[this.widthOrHeight] / (this.dataLength * this.numberOfObjects())) * 0.2;
		}
	}
	
	barCalculations(){


		//this seems silly, but essentially need to know how many data points are in the data, but each series being plotted may have different amounts of data points, so this loops through and finds the longest one.
		this.dataLength = 0;		
		this.chartData.forEach( (d) => {
			if( d.values.length > this.dataLength){
				this.dataLength = d.values.length;
			}
		});
	}	
	
	appendSVG(){
		//add the svg, then append a g tag and transform it via the margins.
		this.baseSVG = d3.select(`#${this.chartDiv}`).append("svg")
			.attrs({
				width: this.width + this.margin.left + this.margin.right,
				height:this.height + this. margin.top + this.margin.bottom
				})
		this.svg = this.baseSVG    
		    .append("g")
		    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);		

	}
	
	appendPlot(){
		//this is a rectangle in the background.  Is useful for zoom events, which i'm not currently doing, but who knows.
		this.svg.append("svg:rect")
			.attrs({
				width:this.width,
				height:this.height,
				class:"plot"
			});		
		
	}

	appendClip(){
		//clipping path to not have things floating outside the scale.
		 this.clip = this.svg.append("svg:clipPath")
		    .attr("id", `clip${this.targetDiv}`)
		    .append("svg:rect")
		    .attrs({
			    x: - this.margin.left,
			    y: -4,
			    width:this.width + this.margin.left + 8,
			    height:this.height +8
		    });		
		
	}
	
	renderScaleLables(){

		this.baseSVG.style("margin-bottom","20px");
		
		this.baseSVG.append("svg:defs").append("svg:marker")
		    .attr("id", "triangle")
		    .attr("refX", 3)
		    .attr("refY", 3)
		    .attr("markerWidth", 15)
		    .attr("markerHeight", 15)
		    .attr("orient", "auto")
		    .append("path")
		    .attr("d", "M 0 0 6 3 0 6 1.5 3")
		    .style("fill", gray4);

		this.xLabel = this.baseSVG.append("text")
		this.yLabel = this.baseSVG.append("text")			
		this.yArrow = this.baseSVG.append("line")
		this.xArrow = this.baseSVG.append("line")
		this.updateScaleLabels();
		
		
	}	
	
	makeZeroLine (){
		//adds a zero line, if zero is plotted.  i could and shold probaly just update this into the way the axis draws honestly.
		this.zeroLine = this.svg.append("line")
			.attrs({
				"class":"zeroAxis",
				"clip-path":() => {
					if (this.yorient != "Right"){
						return `url(#clip${this.targetDiv})`
					}
					
				},
				[`${this.xOrY}1`]:() => {
					if (this.horizontal || this.yAxisLineLength == "long" || this.yAxisLineLength == "short"){return 0;}
					return -this.margin[this.leftOrTop];				
				},
				[`${this.xOrY}2`]:() =>{ 
					if (this.yorient == "Right" && this.yAxisLineLength != "long" && this.yAxisLineLength != "short"){return this[this.widthOrHeight] + this.margin.right - 8}
					return this[this.widthOrHeight]
				},
				[`${this.yOrX}1`]:this.scales.y(0),
				[`${this.yOrX}2`]:this.scales.y(0)
			})
	}
	

	getRecessionData (){
		//returns the data for all the recessions.  Could overwrite this and plot any array of gray rectangles.		
		return [{"start":"5/1/1937","end":"6/1/1938"},{"start":"2/1/1945","end":"10/1/1945"},{"start":"11/1/1948","end":"10/1/1949"},{"start":"7/1/1953","end":"5/1/1954"},{"start":"8/1/1957","end":"4/1/1958"},{"start":"4/1/1960","end":"2/1/1961"},{"start":"12/1/1969","end":"11/1/1970"},{"start":"11/1/1973","end":"3/1/1975"},{"start":"1/1/1980","end":"7/1/1980"},{"start":"7/1/1981","end":"11/1/1982"},{"start":"7/1/1990","end":"3/1/1991"},{"start":"3/1/2001","end":"11/1/2001"},{"start":"12/1/2007","end":"6/1/2009"}]

	}
	
	recessionMaker (){
		//put in the recessions, if there are any.
		if (!this.hasRecessions){
			return;
		}
		const recessionData = this.getRecessionData();	
		this.recessions = this.svg.append('g')
			.attrs({
				"clip-path":`url(#clip${this.targetDiv})`,
				class:"recession"
			})
		
		this.recessionEnter = this.recessions	
			.selectAll('.recessionBox')
			.data (recessionData)
			.enter()
			.append("rect")
			.attrs({
				class:"recessionBox",
				[this.xOrY]:(d) => (this.scales.x(this.recessionDateParse(d.start))),
				[this.yOrX]:0,
				[this.widthOrHeight]:(d) => (this.scales.x(this.recessionDateParse(d.end))) - (this.scales.x(this.recessionDateParse(d.start))),
				[this.heightOrWidth]:this[this.heightOrWidth]
			});		
	}

	//////////////////////////////////////////////////////////////////////////////////
	///// AXIS.
	//////////////////////////////////////////////////////////////////////////////////  	

	determineFormatter (d,i,nodes){
		this.axisDecimal = this.axisDecimal || 0;
		if (Math.floor(d) !== d){
			let decimal = d.toString().split(".")[1].length || 0;
			if (decimal > this.axisDecimal){
				this.axisDecimal = decimal;
			}			
		}
		return this.axisDecimal;		
	}


	yTickFormat (d,i,nodes) {
		//format for y axis.  if it's date, will use multiformat, or quarter format.
		//if category, will just return itself.
		//otherwise, it's a number so it's going to put in the data labels, unless it's horizontal.
		if (this[`${this.yOrX}Value`] == "date"){
			if (this.quarterFormat){
				return this.quarterAxisFormater(d);
			}					
			return this.multiFormat(d)
		}
		
		let s = d
		if (this.scaleNumbFormat){
			s = this.numbFormat(d)
		}else if( this[`${this.yOrX}Value`] != "category" && d != 0 ){
			let decimal = this.determineFormatter(d,i,nodes);
			let axisForm = d3.format(`,.${decimal}f`)
			s = axisForm(d)
		}

		if (!this.horizontal){
			return nodes[i].parentNode.nextSibling
				? "\xa0" + s
				: this.dataLabels[0] + s;					
		}else{ return s }
    }
    
	xTickFormat  (d,i,nodes)  {
		//samsies, but opposite logic on adding data lables, only horizontal.
		if (this[`${this.xOrY}Value`] == "date"){
			if (this.quarterFormat){
				return this.quarterAxisFormater(d);
			}
			return this.multiFormat(d)
		}

		let s = d
		if (this.scaleNumbFormat){
			s = this.numbFormat(d)
		}else if( this[`${this.xOrY}Value`] != "category" && d != 0 ){
			let decimal = this.determineFormatter(d,i,nodes);
			let axisForm = d3.format(`,.${decimal}f`)
			s = axisForm(d)
		}

		if (this.horizontal){
			return nodes[i].parentNode.nextSibling
				? "\xa0" + s
				: this.dataLabels[0] + s;					
		}else{ return s }
    }			
	
	
	getXAxis (){
		//create and draw the x axis
		this.xAxis = d3[`axis${this.xorient}`]()
	    	.scale(this.scales[this.xOrY])
		    .ticks(this[`${this.xOrY}ScaleTicks`])
		    .tickPadding(8)
		    .tickFormat(this.xTickFormatter);

		//forces a tick for every value on the x scale 
		if (this.tickAll){
			this.fullDateDomain = [];
			this.smallDateDomain = [];
			this.chartData[0].values.forEach( (d,i) => {
				this.fullDateDomain.push(d.date);
				if (i === 0 || i == this.dataLength - 1){
					this.smallDateDomain.push(d.date);	
				}
			});
		}
		
	}
	
	getYAxis(){
		//create and draw the y axis                  
		this.yAxis = d3[`axis${this.yorient}`]()
	    	.scale(this.scales[this.yOrX])
		    .ticks(this[`${this.yOrX}ScaleTicks`])
		    .tickPadding(8)		    
		    .tickFormat(this.yTickFormatter);		

		//fixes padding if on other side
		if (this.yorient == "Right"){
			this.yAxis
			.tickPadding(20);
		}	
			
	}
	
	appendXAxis(){
		//translates the x axis to where it belongs and calls it.
		this.addXAxis = this.svg.append("svg:g")
		    .attr("class", "x axis")		
	        .attr("transform", (d,i) => {
				let toptrans = this.height;
				if (this.xorient == "Top"){
					toptrans = 0;
				}
				let sideAdjust = 0;
				if (this.chartLayout == "sideBySide" && !this.horizontal){
					sideAdjust = this.widthOfBar()/2				
				}				
				if (this.chartLayout != "sideBySide"){ i = 0;}
			    return `translate(${((i * (this[this.widthOrHeight] / this.numberOfObjects()))+sideAdjust)},${toptrans})`	
		     })

		this.customXAxis(this.addXAxis);
	}
	


	appendYAxis(){
		//custom y axis is defined in defaults, and makes much our formatting work.
		//transform based on orientation.
		this.addYAxis = this.svg.append("svg:g")
		    .attr("class", "y axis")			
        	.attr("transform", (d,i) => {
	        	if (this.yorient == "Right"){
		        	return `translate(${this.width},0)`	        			        	
	        	}
	        	if (this.chartLayout == "sideBySide" && this.horizontal){
					let	heightFactor = (i * (this[this.widthOrHeight] / this.numberOfObjects()))+this.widthOfBar()/2;
					let	widthFactor = 0;
		        	return `translate(${widthFactor},${heightFactor})`
	        	}

        	})
        	
	    	this.customYAxis(this.addYAxis) 	
	}
	

	adjustXTicks (){
		//need to figure this out on horizontal.  basically is a loop that adds up the widths of all the x ticks and checks them against the widht available.  if it's larger, it adjusts the ticks down 2. 
		if (this.horizontal){return}
		let ticksWidth = 0;
		let largest = 0;
		let count = 0;
		this.$el.find(".x.axis .tick text").each( function (d) {
			let thisWidth = $(this).width();
			if (thisWidth < 1){
				thisWidth = $(this)[0].getBoundingClientRect().width
			}

			if( (thisWidth + 5) > largest){
				largest = thisWidth + 5;
			}
			count ++
		});
		ticksWidth = count * largest;

		if (this.tickAll){
			this[`${this.xOrY}Axis`].tickValues(this.fullDateDomain);			
		}

		if (ticksWidth > this.width){
			this[`${this.xOrY}Axis`].ticks(2);				

			if (this.tickAll){
				this[`${this.xOrY}Axis`].tickValues(this.smallDateDomain);			
			}
			this.currentTicks = 2;			
		}else{		
			this[`${this.xOrY}Axis`].ticks(this[`${this.xOrY}ScaleTicks`])			
			this.currentTicks = "all"
		}
		
	
	}
	
	topTick(tickLabels){
		//currently i'm not including the trailing label in the axis function.  had alignment problems.  I ccan probably rethink all that and make it work.
		//in the meantime, i'm basically cloning another tick into there.
		let paddedLabel = tickLabels[1]
		if (paddedLabel != "%" && paddedLabel != ""){paddedLabel = "\u00A0"+tickLabels[1]}
		d3.selectAll(`#${this.targetDiv} .topTick`).remove();

		let topTick =  $(`#${this.targetDiv} .${this.yOrX}.axis .tick:last-of-type`).find("text");
		let topTickHTML = topTick.text();
		let backLabel = "";
		if (this.horizontal){backLabel = paddedLabel; }

		topTick.text(topTickHTML + backLabel);
		if (!this.horizontal){
			topTick.clone().appendTo(topTick.parent()).text(paddedLabel).css('text-anchor', "start").attr("class","topTick");
		}		
		
	}
	
	createSideLayoutAxis(){
		//side by side axis need to actualyl clone out the axis and make a second one.
		if (this.chartLayout =="sideBySide"){
			this.axisIsCloned = true;
			let $xaxis = this.$(`.${this.xOrY}.axis`)
			this.chartData.forEach( (d,i) => {
				if (i == 0){return}
				let heightFactor = this.height;
				let widthFactor = (i * (this[this.widthOrHeight] / this.numberOfObjects())) +this.widthOfBar()/2;
				if (this.horizontal){
					heightFactor = (i * (this[this.widthOrHeight] / this.numberOfObjects())) +this.widthOfBar()/2;
					widthFactor = 0;
				}
				$xaxis.clone().attr("transform",`translate(${widthFactor},${heightFactor})`).appendTo($xaxis.parent())
				
			})
		}
			
			
	}	
		
	renderAxis (){
		this.emit("chart:renderingAxis", this)
		
		if (this.includeXAxis){
			this.getXAxis();			
			this.appendXAxis();
			this.adjustXTicks();
			if (!this.horizontal){
				this.createSideLayoutAxis();				
			}
		}
		if (this.includeYAxis){
			this.getYAxis();
			this.appendYAxis();		
			this.topTick(this.dataLabels);
			if (this.horizontal){
				this.createSideLayoutAxis();				
			}						
		}
		
		if (this.yScaleVals && this[`${this.yOrX}Axis`]){	
			this[`${this.yOrX}Axis`].tickValues(this.yScaleVals);
		}

		if (this.xScaleVals && this[`${this.xOrY}Axis`]){	
			this[`${this.xOrY}Axis`].tickValues(this.xScaleVals);
		}
		
		this.emit("chart:axisRendered", this)
		
	}
	


	//////////////////////////////////////////////////////////////////////////////////
	///// LEGEND.
	//////////////////////////////////////////////////////////////////////////////////  	

	
	renderLegend(){
		this.emit("chart:renderingLegend", this)
		
		if(!this.hasLegend){
			return;
		}

		this.renderLegendTemplate();
		this.renderLegendClickEvent();
		this.defineLegendSelections();
		this.setLegendPositions();		
		
		this.emit("chart:legendRendered", this)

	}
	
	renderLegendTemplate (){
		//render the legend template
		this.$legendEl.html(this.legendTemplate({data:this.chartData,self:this}));		
	}
	
	renderLegendClickEvent(){
		//define click events
		this.$(".legendItems").on("click", (evt) =>{
			let $el = $(evt.currentTarget);
			let id = $el.attr("data-id")
			//udpate what is included or not, not just for current data, but for the other multi datas (if any) and their blobs of data.
			this.updateVisibility(this.data,id,$el)
			
			this.multiDataColumns.forEach( (dataType) => {
				this.updateVisibility(this[dataType],id,$el)
			})
			
			$el.toggleClass("clicked");									
			this.chartData = this.makeChartData (this.data)				
			this.update ();  		

		})				
	}
	
	defineLegendSelections(){
		//define d3 seletions of legend bits to use later.
		this.legendItems = d3.selectAll(`#${this.legendDiv} .legendItems`)
			.data(this.chartData)
		this.legendValues = d3.select(`#${this.legendDiv}`).selectAll(".valueTip")
			.data(this.chartData);			
		this.legendDate = d3.selectAll(`#${this.legendDiv} .dateTip`);				
	}
	
	updateVisibility (data,id,$el){
		let currentData =  _.find(data,{name:id})  
		if($el.hasClass("clicked")){
			currentData.visible = true
		}else{
			currentData.visible = false
		}
	}
	
	setLegendPositions(){
		//want legend items on the right to sort based on what is included or not, so they all have a top style applied.
		if (!this.hasLegend){
			return;
		}

		let depth = 0;								

		this.legendItems
			.data(this.chartData, (d) => d.name )
			.style("top", (d,i,nodes) => {					
				let returnDepth = depth;
				depth += $(nodes[i]).height() + 5;
				return returnDepth+"px";	
			});
		this.legendItems
			.data(this.chartData, (d) => d.name )
			.exit()
			.style("top", (d,i,nodes) => {					
				let returnDepth = depth;
				depth += $(nodes[i]).height() + 5;
				return returnDepth + "px";	
			});		
		
	}

	//////////////////////////////////////////////////////////////////////////////////
	///// NAV BUTTONS.
	//////////////////////////////////////////////////////////////////////////////////  	

	
	renderMultiButtons (){
		if (!this.multiDataColumns){
			return;
		}
		//click event for nav buttons
		this.$(".chart-nav .btn").on("click", (evt) => {

				let $el = $(evt.currentTarget);
                let thisID = $el.attr("dataid");

                let i = this.$(".chart-nav .btn").index($el)
				//set the ytick labels to the right index in array, or to the first one, if not defined for this position.
				if (this.YTickLabel[i]){
					this.dataLabels = this.YTickLabel[i];
				}else{
					this.dataLabels = this.YTickLabel[0];					
				}
				//if a change in transform of data, need to update datatype.
				if (this.multiTransforms){
					this.dataType = thisID;
				}
				//swithc out data, make new chartdata and update
				this.data = this[thisID]
				this.chartData = this.makeChartData (this.data)

				this.update();    		
		})		
		
	}
	
	renderChartLayoutButtons(){

    	if (!this.chartLayoutLabels){ 
	    	return;
    	}
    	//for chart layout button updates. find current chartlayout, last one by default.
    	this.chartLayout = this.chartLayoutLabels[this.chartLayoutLabels.length -1]

		this.$(".layoutNavButtons").on("click", (evt) => {
			let $el = $(evt.currentTarget);
			if ($el.hasClass("selected")){return;}
			
			let thisID = $el.attr("dataid");
			$el.addClass("selected").siblings().removeClass("selected");
			//update the current chartlayout base don what clicked.
		    this.chartLayout= thisID;
			
			let index = this.chartLayoutLabels.indexOf(thisID);

			//get the right data labels
			if (this.YTickLabel[index]){
				this.dataLabels = this.YTickLabel[index];
			}else{
				this.dataLabels = this.YTickLabel[0];					
			}				//and override them if it's stack percent
			if (this.chartLayout == "stackPercent"){
				this.dataLabels = ["","%"];
			}				

			//run the updater    		    
	    	this.update ();	
		})

		
	}	
	
	//////////////////////////////////////////////////////////////////////////////////
	///// TOOLTIPS.
	//////////////////////////////////////////////////////////////////////////////////  	

	renderTooltips(){
		this.emit("chart:renderingTooltip", this)
		
        if (this.showTip == "off"){return}
		//sets up mechanism to find where cursor is in SVG
		this.baseElement = document.getElementById(this.targetDiv).querySelector('svg');
		this.svgFind = this.baseElement;		
		this.pt = this.svgFind.createSVGPoint();
		this.xPointCursor = 0 - this.margin[this.leftOrTop]-500;
		
		this.addCursorLine();
		this.addTooltip();
		this.tooltipEvents();
		
		this.emit("chart:tooltipsRendered", this)
		
	}
	
	addCursorLine(){
		//appends the line that moves across
		this.cursorLine = this.svg.append('svg:line')
			.attr('class','cursorline')
			.attr("clip-path", `url(#clip${this.targetDiv})`)
			.attr(`${this.xOrY}1`, this.xPointCursor)
			.attr(`${this.xOrY}2`, this.xPointCursor)
			.attr(`${this.yOrX}1`,0)
			.attr(`${this.yOrX}2`,this[this.heightOrWidth]);				
		
	}
	
	
	addTooltip() {
		//adds a tooltip div.  turns it off or on depending on options.
		this.tooltip = d3.select(`#${this.chartDiv}`).append("div")
			.attr("class", "reuters-tooltip")
            .styles({
		        opacity:0,
		        display: () => {
			        if (this.showTip == "off"){
				        return "none";				        
			        }
			        if (this.chartType == "scatter"){return "block"}
			        if (this.showTip || !this.hasLegend){
				        return "block";
			        }
			        return "none";
		        }
	        });  	
	}
	
	tooltipEvents(){
		//mouse and touch events.
		this.svgmove = this.svgFind.addEventListener('mousemove', (evt) => { return this.tooltipMover(evt); },false);
		this.svgtouch = this.svgFind.addEventListener('touchmove',(evt) => { return this.tooltipMover(evt); },false);
		this.svgout = this.svgFind.addEventListener('mouseout',(evt) => { return this.tooltipEnd(evt); },false);
		this.svgtouchout = this.svgFind.addEventListener('touchend',(evt) => { return this.tooltipEnd(evt); },false);				
	}
	
	tooltipMover(evt){
		//calculate location of mouse or finger.
		this.loc = this.cursorPoint(evt);
		this.xPointCursor = this.loc[this.xOrY];
		this.yPointCursor = this.loc[this.yOrX];		
		this.widthsOver = 0;			
		this.closestDate = null;
		this.indexLocation = this.xPointCursor - parseFloat(this.margin[this.leftOrTop]);
		
		//positions are different if side by side.
		this.calcSidebySideTipPositions();
		//find the closest value to where you are positioned.  different for categories.
		if (this.xValue == "category"){
			this.findTipValueCat();
		}else{
			this.findTipValue();
		}
		this.moveCursorLine();
		
		this.highlightCurrent();
		this.updateTooltipContent();
		this.updateLegendContent();
		this.setLegendPositions();
		this.tooltip.style("opacity",1)

	}
	
	tooltipEnd(){
		//on exiting the hover, reset everything back to non-existant.
		this.cursorLine
			.attr(`${this.xOrY}1`, 0- this.margin[this.leftOrTop] -10 )
			.attr(`${this.xOrY}2`, 0-this.margin[this.leftOrTop]-10);

		this.tooltip.style("opacity",0)
		
		if (this.hasLegend && this.chartType != "scatter"){
			this.legendItems.selectAll(".valueTip")			
				.html("<br>");

			this.legendDate.html("<br>");
 			this.setLegendPositions();
		}
		if (this.tipHighlight){
			this.tipHighlight.remove();
		}			
		if (this.chartType == "bar"){
			this.barChart.selectAll(".bar")
				.classed("lighter", false);			
		}
		if (this.chartType == "scatter"){
			this.scatterPlot
			.classed("lighter",false);
		}

	
		
	}	
	
	cursorPoint (evt){
		//calc out where you are.
		if ((evt.clientX)&&(evt.clientY)) {
			this.pt.x = evt.clientX; this.pt.y = evt.clientY;
		} else if (evt.targetTouches) {
			this.pt.x = evt.targetTouches[0].clientX; this.pt.y = evt.targetTouches[0].clientY;			
			this.pt.deltaX = Math.abs(this.pt.x - this.pt.lastX)
			this.pt.deltaY = Math.abs(this.pt.y - this.pt.lastY)
			if(this.pt.deltaX > this.pt.deltaY){
			  evt.preventDefault();				
			}
			this.pt.lastY = this.pt.y
			this.pt.lastX = this.pt.x
		}
		return this.pt.matrixTransform(this.svgFind.getScreenCTM().inverse());
	}
	
	calcSidebySideTipPositions (){
		//if you are in a side by side layout, has to figure out what set of data to look through.
		if (this.chartLayout == "sideBySide"){
			let eachChartWidth = (this[this.widthOrHeight] / this.numberOfObjects());
			for (i = 0; i < this.numberOfObjects();  i++ ){
				if ((this.xPointCursor - this.margin[this.leftOrTop]) > eachChartWidth){
					this.xPointCursor = this.xPointCursor - eachChartWidth;
					this.widthsOver = this.widthsOver + eachChartWidth ;
				}
			}
			
			this.widthOfEach = this.width / this.numberOfObjects()
				if (this.indexLocation > this.widthOfEach*2){
					this.indexLocation = this.indexLocation - this.widthOfEach * 2
				}
				if (this.indexLocation > this.widthOfEach){
					this.indexLocation = this.indexLocation - this.widthOfEach
				}			
			
		}		
		
	}	
	
	findTipValueCat(){
		//finds closes value on category chart
		let closestRange = null;
		let rangeArray = []
		this.scales.x.domain().forEach( (d) => {
			rangeArray.push(this.scales.x(d))
		})
		rangeArray.forEach( (d,i) => {
			if ( closestRange === null || Math.abs(d-this.indexLocation) < Math.abs(closestRange - this.indexLocation)){
				closestRange = d;
			}
		});
		let closestIndex = rangeArray.indexOf(closestRange);
		this.closestDate = this.scales.x.domain()[closestIndex];
	}
	
	findTipValue(){
			//finds closest value on all other charts.  need to test this for not date.
			this.locationDate = this.scales.x.invert(this.indexLocation);
			this.chartData[0].values.forEach( (d,i) => {
				let include = false;
				this.columnNames.forEach( (col) => { if (d[col]){include = true} })

				if (!include && !this.showZeros){return}				

				if (this.closestDate === null || Math.abs(d[this.xValue] - this.locationDate) < Math.abs(this.closestDate - this.locationDate)){ this.closestDate = d[this.xValue]; }			
			});

			
			//MATT
/*
			if (this.timelineData){
				this.closestDate = null;				
				this.timelineData.forEach(function(d,i){
					if (this.closestDate === null || Math.abs(d.closestDate - this.locationDate) < Math.abs(this.closestDate - this.locationDate)){
						this.closestDate = d.closestDate;
					}			
				});
			}		
*/
		
	}
	
	moveCursorLine() {
		//actally move the line along.
		let sideBySideMod = 0;
		if (this.chartLayout == "sideBySide"){ 
			sideBySideMod = this.widthOfBar() / 2
		}
		this.cursorLine
			.attr(`${this.xOrY}1`, (this.scales.x(this.closestDate) + this.widthsOver +sideBySideMod ))
			.attr(`${this.xOrY}2`, this.scales.x(this.closestDate) + this.widthsOver + sideBySideMod);		
	}
	
	makeTipData (){
		//tooltips and legends need to be passed only the data the matches your current location and is visible.		
		let tipData = [];
		this.chartData.forEach( (d) => {
			let name = d.name;
			let displayName = d.displayName;
			let timeFormatter = d3.timeFormat("%m/%d/%Y %H:%M:%S");
			let matchingValues = d.values.filter( (d) => {
				if (this.xValue == "date"){
					return timeFormatter(d[this.xValue]) == timeFormatter(this.closestDate)			
				}				
				return d[this.xValue] == this.closestDate;
			});	
			matchingValues.forEach( (d) => {
				_.extend(d, {name:name,displayName:displayName});
				tipData.push(d);	
			});
			
		});

		return tipData;		
		
	}

	updateTooltipContent(){
		//update the html of the tooltip, and also position it.  logic decides if it's left or right of line, above or below cursor point.
		this.tooltip
			.html( (d) => this.tipTemplate({this:this, data:this.makeTipData()}) )
			.style(this.leftOrTop, (d) => {
				let tipWidth = this.$(".reuters-tooltip").outerWidth();

				if (this.horizontal){
					tipWidth = this.$(".reuters-tooltip").outerHeight();
				}
				if (this.xPointCursor < (this.margin[this.leftOrTop] + this[this.widthOrHeight] + this.margin[this.rightOrBottom]) / 2){
					return (this.margin[this.leftOrTop] + this.scales.x(this.closestDate) + this.widthsOver + 15) + "px";
				}else{
					return (this.scales.x(this.closestDate) - tipWidth +15)  + "px";
				}						
			})
			.style(this.topOrLeft, (d) => {
				let toolTipHeight = this.$(".reuters-tooltip").height();
				if (this.horizontal){
					 toolTipHeight = this.$(".reuters-tooltip").outerWidth();
				}
				let fullWidth = this.margin[this.topOrLeft] + this[this.heightOrWidth] + this.margin[this.bottomOrRight];
				
				if (this.yPointCursor > (fullWidth * 2 / 3)){
					return this.yPointCursor - toolTipHeight -20 + "px";
				} 					
				if (this.yPointCursor < (fullWidth / 3)){
					return this.yPointCursor  + "px";
				}
				
				return this.yPointCursor - toolTipHeight/2 + "px";


			});
		
	}

	updateLegendContent(){
		//update the html of the legend. logic varies if it's date or category, or quarters
		if (this.hasLegend){				
			let legendData = this.makeTipData();			

			d3.select(`#${this.legendDiv}`).selectAll(".valueTip")
				.data(legendData, (d) => d.name )
				.html( (d,i) => {
					if (this.chartLayout == "stackPercent"){
						return this.tipNumbFormat(d.y1Percent - d.y0Percent);
					}
					return this.tipNumbFormat(d[this.dataType]);
				});

			this.legendDate.html( () => {
				
				if (this.xValue == "date"){
					if (legendData[0].quarters){
	                    return legendData[0].quarters + legendData[0].displayDate;
	                }				
					return legendData[0].displayDate 
				}
				if (this.xValue == "category"){
					return legendData[0].category;
				}
				return legendData[0][this.xValue]
								
			});
						
			this.setLegendPositions();
		}		
	}
	
	highlightCurrent (){
		//for bars, classes all the other bars to be lighter so this one stands out.
		if (this.chartType == "bar"){
			this.barChart.selectAll(".bar")
				.classed("lighter", (d) => {
					if (d.date == this.closestDate || d.category == this.closestDate){
						return false;		
					}
					return true;		
				});			
		}
		//for lines, adds a circle in at current point.
		if (this.chartType == "line" ){
			if (this.tipHighlight){
				this.tipHighlight.remove();
			}

			this.tipHighlight = this.lineChart.selectAll(".tipHighlightCircle")
				.data(this.makeTipData())
				.enter()
				.append("circle")
				.attr("class","tipHighlightCircle")
				.attr(`c${this.xOrY}`, (d,i) => this.scales.x(d[this.xValue]) )
				.attr(`c${this.yOrX}`, (d,i) => {
			    	if (this.chartLayout == "stackTotal"){
						if (!d.y1Total){return this.scales.y(0)}	
			    		return this.scales.y(d.y1Total); 		    	
			    	}		    	
				    if (this.chartLayout == "stackPercent"){
					   	if (!d.y1Percent){return this.scales.y(0)} 
					   	return this.scales.y(d.y1Percent);
					}				
					if (!d[this.dataType]){return this.scales.y(0)}
	
				    return this.scales.y(d[this.dataType]);
				})
				.attr("r", (d,i,nodes) => {
					let j = +nodes[i].parentNode.getAttribute("data-index");
					if (j != i){ return 0}
					if ( isNaN(d[this.dataType])){return 0;} 
					 return 5;
				})
				.style("fill", (d) => this.colorScale(d.name) )//1e-6
				

		}		
		
	}

	
	
	renderEvents(){
		this.emit("chart:renderingEvents", this)

		//on scroll, can run animate.  on resize  checks to see if width changed.  if so checks the breakpoint, then updates.
		$(window).scroll( () => {
            this.scrollAnimate();
        });
				
		$(window).on("resize", _.debounce( (event) => {
			let width = this.$el.width();
			if (width == this.masterWidth){
				return;
			}
			this.masterWidth = width;
			this.checkLegendBreakpoint();
			this.update();
		},100));
		this.emit("chart:eventsRendered", this)
		
		
		
	}
	
	scrollAnimate(){
		//this is off if is pymed.  otherwise, scrolly math and runs either in or out.
		if(this.hasPym || !this.animateOnScroll){return;}
		
		let scrollTop = $(window).scrollTop();
		let offset = this.$el.offset().top;
		let height = $(window).height();
		let triggerPoint = scrollTop + (height*.8);
		let visiblePosition = "offScreen"
		if (triggerPoint > offset){
			visiblePosition = "onScreen";
		}
		if (this.visiblePosition == visiblePosition){ return}

		if (triggerPoint > offset){
			this.animateIn()
		}else{
			this.animateOut()
		}

		this.visiblePosition = visiblePosition		
		
	}
	
	animateIn (){
		//transitions the bars in.
		if (this.barChart){
			this.barChart.selectAll(".bar")
				.transition()
				.duration(1000)
				.attrs({
					[this.yOrX]: (d) => { return this.yBarPosition(d)}, 
					[this.heightOrWidth]: (d) => { return this.barHeight(d)},	
					[this.widthOrHeight]: (d,i,nodes) => { 
						let j = +nodes[i].parentNode.getAttribute("data-index");
						
						return this.barWidth(d,i,j) 
					},
					[this.xOrY]:(d,i,nodes) => {
						let j = +nodes[i].parentNode.getAttribute("data-index");
						return this.xBarPosition(d,i,j)
					}
				})

		}
		//transitions the lines and areas in.
		if (this.lineChart){
			this.lineChart.selectAll("path.line")
				.transition()
				.duration(1500)
				.delay( (d, i) => (i * 100) )
				.attrTween('d',  (d) => {
					let interpolate = d3.scaleQuantile()
						.domain([0,1])
						.range(d3.range(1, d.values.length + 1));
					return (t) => {
						return this.line(d.values.slice(0, interpolate(t)));
					};
				});	
			
			this.lineChart.selectAll("path.area")
				.transition()
				.duration(1500)
				.delay( (d, i) => ( i * 100) )
				.attrTween('d', (d) => {
					let interpolate = d3.scaleQuantile()
						.domain([0,1])
						.range(d3.range(1, d.values.length + 1));
					return (t) => {
						return this.area(d.values.slice(0, interpolate(t)));
					};
				});								
		}
	}

	animateOut (){
		//transition both back out.
		if (this.barChart){
			this.barChart.selectAll(".bar")
				.transition()
				.duration(1000)
				.attr(this.heightOrWidth, 0)
				.attr(this.yOrX, this.scales.y(0))

		}
		if (this.lineChart){
			this.lineChart.selectAll("path.line").transition()
				.attr("d", (d) => this.line([d.values[0]]) )

			
			this.lineChart.selectAll("path.area").transition()
				.attr("d", (d) => this.area([d.values[0]]) )	
		}

	}
		

	//////////////////////////////////////////////////////////////////////////////////
	///// BASE UPDATE.
	//////////////////////////////////////////////////////////////////////////////////  	


	
	baseUpdate (duration){

		this.emit("chart:updatingBase", this)

		if (!duration){duration = 1000;}
		this.setWidthAndMargins();
		this.setLegendPositions();
		this.barCalculations();
		this.updateCursorLine();
		this.udpateSVG (duration);	
		this.updatePlot (duration);	
		this.updateClip (duration);	
		this.scales = {
			x: this.getXScale(),
			y: this.getYScale()
		};

		if (this.includeXAxis){
			this.updateXScales();
			this.updateXAxis(duration);
			this.updateSideLayoutAxis();
		}
		if (this.includeYAxis){		
			this.updateYScales();
			this.updateYAxis(duration);
		}

		if (this.zeroLine){
			this.updateZeroLine(duration);
		}
		this.updateRecessions(duration);
		this.labelUpdate()

		this.emit("chart:baseUpdated", this)
				
	}
	
	updateZeroLine (duration){
		//updates the zero line
		this.zeroLine
			.transition()
			.duration(duration)		
			.attrs({
				[`${this.xOrY}1`]:() => {
					if (this.horizontal || this.yAxisLineLength == "long" || this.yAxisLineLength == "short"){return 0;}
					return -this.margin[this.leftOrTop];				
				},
				[`${this.xOrY}2`]:() =>{ 
					if (this.yorient == "Right" && this.yAxisLineLength != "long" && this.yAxisLineLength != "short"){return this[this.widthOrHeight] + this.margin.right - 8}
					return this[this.widthOrHeight]
				},
				[`${this.yOrX}1`]:this.scales.y(0),
				[`${this.yOrX}2`]:this.scales.y(0)
			})		
		
	}
	
	updateRecessions (duration){
		//updates recessions
		this.svg.selectAll(".recessionBox")
			.transition()
			.duration(duration)		
			.attrs({
				[this.xOrY]:(d) => (this.scales.x(this.recessionDateParse(d.start))),
				[this.yOrX]:0,
				[this.widthOrHeight]:(d) => (this.scales.x(this.recessionDateParse(d.end))) - (this.scales.x(this.recessionDateParse(d.start))),
				[this.heightOrWidth]:this[this.heightOrWidth]
			});	
	}
	
	setWidthAndMargins(){
		//maths to determine essentially how wide to make left margin.
		//length of largest tick
		let maxWidth = -1;
		$(`#${this.targetDiv} .y.axis`).find("text").not(".topTick").each(function(){
			maxWidth = maxWidth > $(this).width() ? maxWidth : $(this).width();
		});
		if (maxWidth === 0){
			$(`#${this.targetDiv} .y.axis`).find("text").not(".topTick").each(function(){
				maxWidth = maxWidth > $(this)[0].getBoundingClientRect().width ? maxWidth : $(this)[0].getBoundingClientRect().width;
			});
		}
		this.options.margin = this.options.margin || {};
		if (!this.options.margin.left && this.options.margin.left !== 0){
			this.margin.left = 13 +  maxWidth
			if (this.yorient == "Right"){
				this.margin.left = 5
			}
		}

		if (!this.options.margin.right && this.yorient == "Right" && this.options.margin.right !== 0){
				this.margin.right = 20 + maxWidth
		}
		
		if (this.xorient == "Top"){
			if (!this.options.margin.top && this.options.margin.top !== 0){
				this.margin.top = 30;				
			}
			if (!this.options.margin.bottom && this.options.margin.bottom !== 0){
				this.margin.bottom = 15;			
			}			
		}
		
		this.setOptWidth()
		this.setOptHeight();		


		if (this.scaleLabels){
			this.updateScaleLabels();
		}				
		
	}
	
	updateCursorLine(){
		//make sure cursor line is full height and off screen on resize
		this.svg.selectAll('.cursorline')
			.attrs({
			[`${this.yOrX}1`]:0,
			[`${this.yOrX}2`]:this[this.heightOrWidth]
			})
	}
	
	udpateSVG(duration){

		//update the base svg and g tag
		this.baseSVG
			.transition("baseTransform")
			.duration(duration)
			.attrs({
				width: this.width + this.margin.left + this.margin.right,
				height:this.height + this. margin.top + this.margin.bottom
				})

		this.svg
			.transition("mainGTransorm")
			.duration(duration)
			.attrs({
				width:this.width,
				height:this.height,
			})		
			.attr("transform", `translate(${this.margin.left},${this.margin.top})`);				
	}
	
	updatePlot(duration){
		//update the plot rectangle
		this.svg.selectAll(".plot")
			.transition()
			.duration(duration)		
			.attrs({
				width:this.width,
				height:this.height,
			});		
		
	}

	updateClip(duration){
		//update clipping path.
		 this.clip
			.transition()
			.duration(duration)		 
		    .attrs({
			    x: - this.margin.left,
			    y: -4,
			    width:this.width + this.margin.left + 8,
			    height:this.height +8
		    });		
		
	}
	
	updateXScales(){
		//update the scale in the axis (since width has maybe changed, or data has maybe changed) or number of ticks has maybe changed.
		this.xAxis.scale(this.scales[this.xOrY]);
		this.xAxis.ticks(this[`${this.xOrY}ScaleTicks`]);		
	}	
	
	updateYScales(){
		//update y axis scales, same reason.
		this.yAxis.scale(this.scales[this.yOrX]);
		//this[`${this.yOrX}Axis`].tickSize(0-this[this.widthOrHeight]);
		this.yAxis.ticks(this[`${this.yOrX}ScaleTicks`]);
	}
	
	updateXAxis(duration){
		//recall the x axis.  feel like i should not have to repeat the custom axis, but something was wonky thee and needed to.
		if (this.updateCount > 0 || this.firstRun){
			this.adjustXTicks()
		}

		this.customXAxis(d3.selectAll(`#${this.targetDiv} .x.axis`)
			.transition("xAxisTransition")
			.duration(duration)	    
	        .attr("transform", (d,i) => {
				let toptrans = this.height;
				if (this.xorient == "Top"){
					toptrans = 0;
				}
				let sideAdjust = 0;
				if (this.chartLayout == "sideBySide" && !this.horizontal){
					sideAdjust = this.widthOfBar()/2				
				}				
				if (this.chartLayout != "sideBySide"){ i = 0;}
			    return `translate(${((i * (this[this.widthOrHeight] / this.numberOfObjects()))+sideAdjust)},${toptrans})`	
		     })
		)
		     

	}	
	
	updateYAxis(duration){
		//recall the y axis. 
	    this.addYAxis
			.transition()
			.duration(duration)	    
        	.attr("transform", (d,i) => {
	        	if (this.yorient == "Right"){
		        	return `translate(${this.width},0)`	        			        	
	        	}
	        	if (this.chartLayout == "sideBySide" && this.horizontal){
					let	heightFactor = (i * (this[this.widthOrHeight] / this.numberOfObjects()))+this.widthOfBar()/2;
					let	widthFactor = 0;
		        	return `translate(${widthFactor},${heightFactor})`
	        	}

        	})
			.on("end", (d) => {
				//ok, this is bizarre.  but basically i need to run the update twice, right?  to readjust for the left margin.  but i don't want the second to run and cancel out all of the transitions.  In newer d3, i can probbaly get around this by naming all the transitions, but not there yes.  so basically this waits for the transition of this axis to end, and then re-runs the update.  some logic w/ update count and first run keeps this from happening over and over forever.
				this.topTick(this.dataLabels)						
				if (this.firstRun){
					this.firstRun = false;					
					this.labelUpdate()
					return;
				}

				if (this.updateCount === 0){
					this.updateCount++;
					setTimeout( () => {
						this.update();					
					}, 10); 
				}else{
					this.updateCount = 0;
				}

			});					

			this.topTick(this.dataLabels)						
	    	 	
		this.customYAxis(this.addYAxis)
		
	}	

	updateSideLayoutAxis(){
		//if it's side by side, need to filter out other axis if it's no longer needed, otherwise need to update it.
		if (this.chartLayout =="sideBySide"){
			if (!this.axisIsCloned){
				this.createSideLayoutAxis();
				return
			}	
			let $xaxis = this.$(`.${this.xOrY}.axis`)			

			$xaxis.each((i)=>{
				if (i == 0){return}
				let heightFactor = this.height;
				
				let widthFactor = (i * (this[this.widthOrHeight] / this.numberOfObjects())) +this.widthOfBar()/2;
				if (this.horizontal){
					heightFactor = (i * (this[this.widthOrHeight] / this.numberOfObjects())) + (this.widthOfBar()/2);
					widthFactor = 0;
				}
				if (i > this.chartData.length - 1){
					$xaxis.eq(i).css({display:"none"})
				}else{
					$xaxis.eq(i).css({display:"block"})
				}
				$xaxis.eq(i).attr("transform",`translate(${widthFactor},${heightFactor})`)				
				
			})

		}
		if (this.chartLayoutLabels){
			if (this.chartLayoutLabels.indexOf("sideBySide") > -1 && this.chartLayout !="sideBySide"){
				let $xaxis = this.$(`.${this.xOrY}.axis`)			
	
				$xaxis.each((i)=>{
					if (i == 0){return}
					$xaxis.eq(i).css({display:"none"})
				})
			}
			
		}
			
			
	}
	
	updateScaleLabels(){

		this.xLabel
			.attr("x", 0)
			.attr("y", this.height + this.margin.top + this.margin.bottom +17)
			.text(this.scaleLabels.x)
			.attr("class", "axislabel x")

		this.yLabel
			.attr("x", -this.height - this.margin.top - this.margin.bottom -5)
			.attr("y",-2)
			.attr("transform", "rotate (270)")					
			.text(this.scaleLabels.y)
			.attr("class", "axislabel y")

		let xLength = $('.axislabel.x').width() || $('.axislabel.x')[0].getBoundingClientRect().width 
		let yLength = $('.axislabel.y').width() || $('.axislabel.y')[0].getBoundingClientRect().height 
		this.yArrow
			.attr("x1", 0)
			.attr("x2",0)
			.attr("y1",this.height + this.margin.top + this.margin.bottom +5 )
			.attr("y2",this.height + this.margin.top + this.margin.bottom - yLength - 10)
			.attr("class", "scatter-arrow")
			.attr("marker-end", "url(#triangle)");
					

		this.xArrow
			.attr("x1", 0)
			.attr("x2",xLength +10)
			.attr("y1",this.height + this.margin.top + this.margin.bottom +5 )
			.attr("y2",this.height + this.margin.top + this.margin.bottom +5 )
			.attr("class", "scatter-arrow")						
			.attr("marker-end", "url(#triangle)");		
		
	}	
	
	//Locales!!	
	locales(lang) {
		let locales = {
			en:{
				decimal:".",
				thousands:",",
				grouping:[3],
				currency:["$",""],				
			  "dateTime": "%x, %X",
			  "date": "%-m/%-d/%Y",
			  "time": "%-I:%M:%S %p",
			  "periods": ["AM", "PM"],
			  "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
			  "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
			  "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			  "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
			},
			
			es:{
				"decimal": ",",
				"thousands": ".",
				"grouping": [3],
				"currency": ["$", ""],				
			  "dateTime": "%x, %X",
			  "date": "%d/%m/%Y",
			  "time": "%-I:%M:%S %p",
			  "periods": ["AM", "PM"],
			  "days": ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
			  "shortDays": ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
			  "months": ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
			  "shortMonths": ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
			},
			
			fr:{
				"decimal": ",",
				"thousands": ".",
				"grouping": [3],
				"currency": ["$", ""],				
			  "dateTime": "%A, le %e %B %Y, %X",
			  "date": "%d/%m/%Y",
			  "time": "%H:%M:%S",
			  "periods": ["AM", "PM"],
			  "days": ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
			  "shortDays": ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
			  "months": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
			  "shortMonths": ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
			},
		
			ch:{
				decimal:".",
				thousands:",",
				grouping:[3],
				currency:["¥",""],				
				dateTime:"%a %b %e %X %Y",
				date:"%d/%m/%Y",
				time:"%H:%M:%S",
				periods:["AM","PM"],
				days:["周日","周一","周二","周三","周四","周五","周六"],
				shortDays:["周日","周一","周二","周三","周四","周五","周六"],
				months:["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
				"shortMonths":["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]
			},	
		
			pt:{
				"decimal": ",",
				"thousands": ".",
				"grouping": [3],
				"currency": ["$", ""],				
				"dateTime": "%a %b %e %X %Y",
				"date": "%m/%d/%Y",
				"time": "%H:%M:%S",
				"periods": ["AM", "PM"],
				"days": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes","Sábado"],
				"shortDays": ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
				"months": ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
				"shortMonths": ["Jan", "Fev", "Mar", "Abr", "Maio", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
			},
			ar:{
		        decimal:".",
		        thousands:",",
		        grouping:[3],
		        currency:["$",""],				
		        dateTime:"%a %b %e %X %Y",
		        date:"%m/%d/%Y",
		        time:"%H:%M:%S",
		        periods:["صباحا","مسا؛ا"],
		        days:[" الأحد"," الإثنين "," الثلاثاء "," الأربعاء "," الخميس "," الجمعة "," السبت "],
		        shortDays:[" أحد "," إثنين "," ثلاثاء "," أربعاء ","لخميس"," الجمعة "," سبت "],
		        months:[" يناير"," فبراير "," مارس "," أبريل ","مايو"," يونيو "," يوليو "," أغسطس "," سبتمبر "," اكتوبر "," نوفمبر "," ديسمبر "],
		        "shortMonths":[" يناير"," فبراير "," مارس "," أبريل ","مايو"," يونيو "," يوليو "," أغسطس "," سبتمبر "," اكتوبر "," نوفمبر "," ديسمبر "],
			},
			ja:{
		        decimal:".",	
		        thousands:",",	
		        grouping:[3],	
		        currency:["¥",""],				
		        dateTime:"%a %b %e %X %Y",	
		        date:"%Y/%m/%d",	
		        time:"%H:%M:%S",	
		        periods:["午前","午後"],	
		        days:["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"],	
		        shortDays:["（日）","（月）","（火）","（水）","（木）","（金）","（土曜）"],	
		        months:["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],	
		        "shortMonths":["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]	
			},
			bg:{
				decimal:".",
				thousands:" ",
				grouping:[3],
				currency:["$",""],				
				dateTime:"%a %b %e %X %Y",
				date:"%m/%d/%Y",
				time:"%H:%M:%S",
				periods:["AM","PM"],
				days:["неделя","понеделник","вторник","сряда","четвъртък","петък","събота"],
				shortDays:["нед.","пон.","вт.","ср.","чет.","пет.","съб."],
				months:["януари","февруари","март","април","май","юни","юли","август","септември","октомври","ноември","декември"],
				"shortMonths":["ян.","фев.","март","апр.","май","юни","юли","авг.","септ.","окт.","нов.","дек."]
			}
		}		
		return locales[lang]	
	}


	
	labelAdder(){
		this.emit("chart:addingAnnotations", this)

		//lets add in some annotations.
		this.annotationData = this.annotations()

		this.makeAnnotations = d3.annotation()
			.editMode(this.annotationDebug)
			.type(this.annotationType)
			.annotations(this.annotationData)		  
			.notePadding(this.annotationNotePadding)
			.accessors({
			[this.xOrY]:(d) => {
				if (this.xValue == "date"){
					return this.scales.x(this.dateParse(d.date))
				}
				return this.scales.x(d[this.xValue])
			
			},
			[this.yOrX]: d => {
			    return this.scales.y(d.value)
			  }
			})
			.accessorsInverse({
			[this.xValue]: (d) => {
				if (!this.scales.x.invert){
					return d.x
				}
				if (this.xValue == "date"){
					return this.dateFormat(this.scales.x.invert(d.x))												
				}				     
				return this.scales.x.invert(d.x)					
			},
			value: (d) => {
					if (!this.scales.y.invert){
					return d.y
				}
			
			    return this.scales.y.invert(d.y)
			   }
			})

		this.annotationGroup = this.svg
		  .append("g")
		  .attr("class", "annotation-group")
		  .call(this.makeAnnotations)	
		  
		 this.svg.select(".annotation-group").classed("active",true)	
		
		this.emit("chart:AnnotationsAdded", this)		 
	}

	labelUpdate ()  {
		//and update those same.
		if (!this.annotationGroup){return;}
		this.annotationData = this.annotations()

		this.makeAnnotations
			.annotations(this.annotationData)				
		
		this.makeAnnotations.updatedAccessors()			
		this.svg.select("g.annotation-group")
			.call(this.makeAnnotations)			
	}
	
}

export { ChartBase }
//POLL, TIMELINE, ANNOTATIONS, ANIMATE CHART IN