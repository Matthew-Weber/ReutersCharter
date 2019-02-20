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

		d3.timeFormatDefaultLocale(this.locales(gettext("en")))
		d3.formatDefaultLocale(this.locales(gettext("en")));
					
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
			recessionDateParse :d3.timeParse("%d/%m/%Y"),
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
			annotationDebug:false					    
		    
		}
		_.each(this.defaults, (item, key) => {
			this[key] = item;
		});
		
		this.options = opts;				
		_.each(opts, (item, key) => {
			this[key] = item;
		});
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

		if (this.dataURL.indexOf("csv") == -1 && !_.isObject(this.dataURL)){
			d3.json(this.dataURL).then( (data) => {
			  this.parseData (data);
			});
		} 
		if (this.dataURL.indexOf("csv") > -1){
			d3.csv(this.dataURL).then( (data) => {
			  this.parseData (data);
			});
		}
		if (_.isObject(this.dataURL)){
			setTimeout( () => {
				this.parseData (this.dataURL);											
			}, 100);
		}		
		
	}

	parseData (data) {
		data = JSON.parse(JSON.stringify(data));

		this.setDataStream(data);		
		this.setOptions(this.data);
		
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

		this.chartData = this.makeChartData (this.data)
		
		this.baseRender();
		this.render()

		
		//console.log(this.chartData)
		
		this.emit("data:parsed", this)
		
	}
	
	setDataStream(data){
		if (this.dataStreamOpts){
			//if (!_.isObject(this.dataStreamOpts)){this.dataStreamOpts = {}}
			this.dataStreamOpts.data = data;
			this.data = new DataStreamParse(this.dataStreamOpts)
		}else{
			this.data = data;
		}		
	}
	
	
	makeChartData (data){
		
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
		this.$el = $(this.el)
		this.setOptPolling();			
		this.setOptMultiData(data);		
		this.setOptCategory(data);
		this.setOptScaleTypes ();
		this.setOptHorizontal();
		this.setOptDataTransforms ();
		this.setOptDateParse(data);
		this.setOptChartColumns(data);
		this.setOptColorScales();
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

	}

	tipNumbFormat (d) {
		if (isNaN(d) === true){return "N/A";}else{
			return `${this.dataLabels[0]}${this.numbFormat(d)}${this.dataLabels[1]}` ;				
		}				
	}

	setOptMultiData (data){

		if (_.isObject(this.multiDataColumns) && !_.isArray(this.multiDataColumns)){
			this.multiDataLabels = _.values(this.multiDataColumns);
			this.multiDataColumns = _.keys(this.multiDataColumns);
		}
		
		if (data[0].type && !this.multiDataColumns){
			this.multiDataColumns = _.uniq(_.map(data, 'type'));
		}
		if (this.multiDataColumns && !data[0].type){
			this.dataType = this.multiDataColumns[this.multiDataColumns.length-1]
			this.multiTransforms = true;
		}
		if (!this.multiDataLabels && this.multiDataColumns){
			this.multiDataLabels = this.multiDataColumns;
		}
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
		if (this.xValue == "category"){ this.xScaleType = "Point"; }
		if (this.yValue == "date"){ this.yScaleType = "Time"; }
		if (this.yValue == "category"){ this.yScaleType = "Point"; }		
	}
	
	setOptHorizontal(){
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
		if (!this.columnNames){
			this.columnNames = _.keys(data[0]).filter( (d) => (d != "date" && d != "category"  && d !== "type"  && d !== "rawDate" && d !== "displayDate") );
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
		if (this.columnNames.length == 1 && !this.options.hasLegend){
			this.hasLegend = false;
		}		
	}	
	
	renderBaseTemplate(){
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
	
	checkLegendBreakpoint(){
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
	
	setOptBreakpoint (){
		if (this.topLegend){
			this.chartBreakPoint = 3000;
		}
	}
	
	setOptDataLabels(){
		this.dataLabels = this.YTickLabel[this.YTickLabel.length-1];				
	}
	
	setOptQuarterFormat(){
		if (this.quarterFormat){
			this.dateFormat = this.quarterFormater
		}		
	}

	quarterFormater (d){
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

		this.baseUpdate(1);			

				
	}
	
	numberOfObjects (){ 
		if (this.chartLayout == "onTopOf" || this.chartLayout == "outlineBar"){ return 1; }else{
			return this.chartData.length;
		}
	}

	widthOfBar (){
		if (this.chartLayout == "stackTotal" || this.chartLayout == "stackPercent"){
			return (this[this.widthOrHeight] / (this.dataLength)) - (this[this.widthOrHeight] / (this.dataLength)) * 0.2;
		}else{				
			return (this[this.widthOrHeight] / (this.dataLength*this.numberOfObjects())) - (this[this.widthOrHeight] / (this.dataLength * this.numberOfObjects())) * 0.2;
		}
	}
	
	barCalculations(){
		this.dataLength = 0;		
		this.chartData.forEach( (d) => {
			if( d.values.length > this.dataLength){
				this.dataLength = d.values.length;
			}
		});
	}	
	
	appendSVG(){
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
		this.svg.append("svg:rect")
			.attrs({
				width:this.width,
				height:this.height,
				class:"plot"
			});		
		
	}

	appendClip(){
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
	
	makeZeroLine (){

		this.zeroLine = this.svg.append("line")
			.attrs({
				"class":"zeroAxis",
				"clip-path":`url(#clip${this.targetDiv})`,
				[`${this.xOrY}1`]:() => {
					if (this.horizontal){return 0;}
					return -this.margin[this.leftOrTop];				
				},
				[`${this.xOrY}2`]:this[this.widthOrHeight],
				[`${this.yOrX}1`]:this.scales.y(0),
				[`${this.yOrX}2`]:this.scales.y(0)
			})
	}
	

	getRecessionData (){		
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
				x:(d) => (this.scales.x(this.recessionDateParse(d.start))),
				y:0,
				width:(d) => (this.scales.x(this.recessionDateParse(d.end))) - (this.scales.x(this.recessionDateParse(d.start))),
				height:this.height
			});		
	}

	//////////////////////////////////////////////////////////////////////////////////
	///// AXIS.
	//////////////////////////////////////////////////////////////////////////////////  	

	yTickFormat (d,i,nodes) {
		if (this[`${this.yOrX}Value`] == "date"){
			if (this.quarterFormat){
				return this.quarterAxisFormater(d);
			}					
			return this.multiFormat(d)
		}
		let s = this.numbFormat(d)
		if (this[`${this.yOrX}Value`] == "category"){ s = d}
		if (!this.horizontal){
			return nodes[i].parentNode.nextSibling
				? "\xa0" + s
				: this.dataLabels[0] + s;					
		}else{ return s }
    }
    
	xTickFormat  (d,i,nodes)  {
		if (this[`${this.xOrY}Value`] == "date"){
			if (this.quarterFormat){
				return this.quarterAxisFormater(d);
			}
			return this.multiFormat(d)
		}
		let s = this.numbFormat(d)
		if (this[`${this.xOrY}Value`] == "category"){ s = d}
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
		
		//change the tic size if it's sideways    
		if (this.horizontal){
			this.xAxis.tickSize(0 - this.height).tickPadding(12);
		}

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

		if (this.yorient == "Right"){
			this.yAxis
			.tickPadding(20);
		}	
		
		if (!this.horizontal){
			this.yAxis.tickSize(0-this.width);
		}else{
			this.yAxis.tickSize(0);
		}				

		//if autoScale ing then let it use the default auto scale.  hasZoom and multiData automatically get auto-scaling
		if (this.yScaleVals && !this.hasZoom){	
			this[`${this.yOrX}Axis`].tickValues(this.yScaleVals);
		}
			
	}
	
	appendXAxis(){
		this.customXAxis = (g) =>{
			let s = g.selection ? g.selection() : g;
			g.call(this.xAxis)
			s.select(".domain").remove();
			if (this.horizontal){
				s.selectAll(".tick:last-of-type text").attr("text-anchor", "end")
			}
			if (s !== g) g.selectAll(".tick text").attrTween("x", null).attrTween("dy", null);		
		}
		
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
	        .call(this.customXAxis);				
	}
	
	appendYAxis(){
		this.customYAxis = (g) =>{
			let s = g.selection ? g.selection() : g;
			g.call(this.yAxis)
			s.select(".domain").remove();
			s.selectAll(".tick line").attr("x1", -this.margin.left)
			s.selectAll(".tick text").attr("x", -8).attr("dy", -4);
			if (this.horizontal){
				s.selectAll(".tick line").attr("x1", 0)				
				s.selectAll(".tick text").attr("x", -8).attr("dy", 0);
			}
			if (s !== g) g.selectAll(".tick text").attrTween("x", null).attrTween("dy", null);		
		}


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
	    	.call(this.customYAxis); 	

	    				
	}
	

	adjustXTicks (){
 
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
			if (this.horizontal){
				this[`${this.xOrY}Axis`].ticks(3);				
			}else{
				this[`${this.xOrY}Axis`].ticks(2);				
			}

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
		let paddedLabel = tickLabels[1]
		if (paddedLabel != "%" && paddedLabel != ""){paddedLabel = "\u00A0"+"\u00A0"+tickLabels[1]}
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
		
		this.getXAxis();
		this.getYAxis();
		this.appendXAxis();
		this.appendYAxis();		
		this.adjustXTicks();
		this.topTick(this.dataLabels);
		this.createSideLayoutAxis();

	}
	
	updateVisibility (data,id,$el){
		let currentData =  _.find(data,{name:id})  
		if($el.hasClass("clicked")){
			currentData.visible = true
		}else{
			currentData.visible = false
		}
		
		
	}

	//////////////////////////////////////////////////////////////////////////////////
	///// LEGEND.
	//////////////////////////////////////////////////////////////////////////////////  	

	
	renderLegend(){
		if(!this.hasLegend){
			return;
		}

		this.$legendEl.html(this.legendTemplate({data:this.chartData,self:this}));
		
		this.$(".legendItems").on("click", (evt) =>{
			let $el = $(evt.currentTarget);
			let id = $el.attr("data-id")
			
			this.updateVisibility(this.data,id,$el)

			this.multiDataColumns.forEach( (dataType) => {
				this.updateVisibility(this[dataType],id,$el)
			})
			
			$el.toggleClass("clicked");									
			this.chartData = this.makeChartData (this.data)				
			this.update ();  		

		})

		this.legendItems = d3.selectAll(`#${this.legendDiv} .legendItems`)
			.data(this.chartData)


		this.legendValues = d3.select(`#${this.legendDiv}`).selectAll(".valueTip")
			.data(this.chartData);
			
		this.legendDate = d3.selectAll(`#${this.legendDiv} .dateTip`);
		
		this.setLegendPositions();		

	}
	
	setLegendPositions(){

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
		this.$(".chart-nav .btn").on("click", (evt) => {

				let $el = $(evt.currentTarget);
                let thisID = $el.attr("dataid");

                let i = this.$(".chart-nav .btn").index($el)

				if (this.YTickLabel[i]){
					this.dataLabels = this.YTickLabel[i];
				}else{
					this.dataLabels = this.YTickLabel[0];					
				}
				
				if (this.multiTransforms){
					this.dataType = thisID;
				}

				this.data = this[thisID]
				this.chartData = this.makeChartData (this.data)

				this.update();    		
		})		
		
	}
	
	renderChartLayoutButtons(){

    	if (!this.chartLayoutLabels){ 
	    	return;
    	}
    	
    	this.chartLayout = this.chartLayoutLabels[this.chartLayoutLabels.length -1]

		this.$(".layoutNavButtons").on("click", (evt) => {
			let $el = $(evt.currentTarget);
			if ($el.hasClass("selected")){return;}
			
			let thisID = $el.attr("dataid");
			$el.addClass("selected").siblings().removeClass("selected");
			
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
        if (this.showTip == "off"){return}

		this.baseElement = document.getElementById(this.targetDiv).querySelector('svg');
		this.svgFind = this.baseElement;		
		this.pt = this.svgFind.createSVGPoint();
		this.xPointCursor = 0 - this.margin[this.leftOrTop]-500;
		
		this.addCursorLine();
		this.addTooltip();
		this.tooltipEvents();
		
	}
	
	addCursorLine(){
		this.cursorLine = this.svg.append('svg:line')
			.attr('class','cursorline')
			.attr("clip-path", `url(#clip${this.targetDiv})`)
			.attr(`${this.xOrY}1`, this.xPointCursor)
			.attr(`${this.xOrY}2`, this.xPointCursor)
			.attr(`${this.yOrX}1`,0)
			.attr(`${this.yOrX}2`,this[this.heightOrWidth]);				
		
	}
	
	
	addTooltip() {
		this.tooltip = d3.select(`#${this.chartDiv}`).append("div")
			.attr("class", "reuters-tooltip")
            .styles({
		        opacity:0,
		        display: () => {
			        if (this.showTip == "off"){
				        return "none";				        
			        }
			        if (this.showTip || !this.hasLegend){
				        return "block";
			        }
			        return "none";
		        }
	        });  	
	}
	
	tooltipEvents(){
		this.svgmove = this.svgFind.addEventListener('mousemove', (evt) => { return this.tooltipMover(evt); },false);
		this.svgtouch = this.svgFind.addEventListener('touchmove',(evt) => { return this.tooltipMover(evt); },false);
		this.svgout = this.svgFind.addEventListener('mouseout',(evt) => { return this.tooltipEnd(evt); },false);
		this.svgtouchout = this.svgFind.addEventListener('touchend',(evt) => { return this.tooltipEnd(evt); },false);				
	}
	
	tooltipMover(evt){
		this.loc = this.cursorPoint(evt);
		this.xPointCursor = this.loc[this.xOrY];
		this.yPointCursor = this.loc[this.yOrX];		
		this.widthsOver = 0;			
		this.closestDate = null;
		this.indexLocation = this.xPointCursor - parseFloat(this.margin[this.leftOrTop]);
		
		this.calcSidebySideTipPositions();
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

		this.cursorLine
			.attr(`${this.xOrY}1`, 0- this.margin[this.leftOrTop] -10 )
			.attr(`${this.xOrY}2`, 0-this.margin[this.leftOrTop]-10);

		this.tooltip.style("opacity",0)
		
		if (this.hasLegend){
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

	
		
	}	
	
	cursorPoint (evt){

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
		closestIndex = rangeArray.indexOf(closestRange);
		this.closestDate = this.scales.x.domain()[closestIndex];
	}
	
	findTipValue(){

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
		let sideBySideMod = 0;
		if (this.chartLayout == "sideBySide"){ 
			sideBySideMod = this.widthOfBar() / 2
		}
		this.cursorLine
			.attr(`${this.xOrY}1`, (this.scales.x(this.closestDate) + this.widthsOver +sideBySideMod ))
			.attr(`${this.xOrY}2`, this.scales.x(this.closestDate) + this.widthsOver + sideBySideMod);		
	}
	
	makeTipData (){
				
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
		if (this.chartType == "bar"){
			this.barChart.selectAll(".bar")
				.classed("lighter", (d) => {
					if (d.date == this.closestDate || d.category == this.closestDate){
						return false;		
					}
					return true;		
				});			
		}
		if (this.chartType == "line" && this.chartLayout != "sideBySide"){
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
				.attr("r", (d,i) => {
					if ( isNaN(d[this.dataType])){return 0;} 
					 return 5;
				})
				.style("fill", (d) => this.colorScale(d.name) )//1e-6
				

		}		
		
	}

	
	
	renderEvents(){

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
		
		
	}
	
	scrollAnimate(){

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
		//console.log("base updating")
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
		this.updateXScales();
		this.updateYScales();
		this.updateXAxis(duration);
		this.updateYAxis(duration);
		this.updateSideLayoutAxis();
		if (this.zeroLine){
			this.updateZeroLine(duration);
		}
		this.updateRecessions(duration);
		this.labelUpdate()		
	}
	
	updateZeroLine (duration){
		
		this.zeroLine
			.transition()
			.duration(duration)		
			.attrs({
				[`${this.xOrY}1`]:() => {
					if (this.horizontal){return 0;}
					return -this.margin[this.leftOrTop];				
				},
				[`${this.xOrY}2`]:this[this.widthOrHeight],
				[`${this.yOrX}1`]:this.scales.y(0),
				[`${this.yOrX}2`]:this.scales.y(0)
			})		
		
	}
	
	updateRecessions (duration){
		this.svg.selectAll(".recessionBox")
			.transition()
			.duration(duration)		
			.attrs({
				x:(d) => (this.scales.x(this.recessionDateParse(d.start))),
				y:0,
				width:(d) => (this.scales.x(this.recessionDateParse(d.end))) - (this.scales.x(this.recessionDateParse(d.start))),
				height:this.height
			});			
	}
	
	setWidthAndMargins(){

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
		if (!this.options.margin.left){
			this.margin.left = 9 +  maxWidth
			if (this.yorient == "Right"){
				this.margin.left = 5
			}
		}

		if (!this.options.margin.right && this.yorient == "Right"){
				this.margin.right = 20 + maxWidth
		}
		
		if (this.xorient == "Top"){
			if (!this.options.margin.top){
				this.margin.top = 30;				
			}
			if (!this.options.margin.bottom){
				this.margin.bottom = 15;			
			}			
		}
		
		this.setOptWidth()
		this.setOptHeight();		
				
		
	}
	
	updateCursorLine(){
		this.svg.selectAll('.cursorline')
			.attrs({
			[`${this.yOrX}1`]:0,
			[`${this.yOrX}2`]:this[this.heightOrWidth]
			})
	}
	
	udpateSVG(duration){


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
			.attr("transform", `translate(${this.margin.left},${this.margin.top})`);				
	}
	
	updatePlot(duration){
		this.svg
			.transition()
			.duration(duration)		
			.attrs({
				width:this.width,
				height:this.height,
			});		
		
	}

	updateClip(duration){
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
		this.xAxis.scale(this.scales[this.xOrY]);
		this.xAxis.ticks(this[`${this.xOrY}ScaleTicks`]);		
	}	
	
	updateYScales(){
		this.yAxis.scale(this.scales[this.yOrX]);
		this[`${this.yOrX}Axis`].tickSize(0-this[this.widthOrHeight]);
		this.yAxis.ticks(this[`${this.yOrX}ScaleTicks`]);
	}
	
	updateXAxis(duration){
		if (this.updateCount > 0 || this.firstRun){
			this.adjustXTicks()
		}
		this.customXAxis = (g) =>{
			let s = g.selection ? g.selection() : g;
			g.call(this.xAxis)
			s.select(".domain").remove();
			if (this.horizontal){
				s.selectAll(".tick:last-of-type text").attr("text-anchor", "end")
			}
			if (s !== g) g.selectAll(".tick text").attrTween("x", null).attrTween("dy", null);		
		}		

	    d3.selectAll(`#${this.targetDiv} .x.axis`)
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
	        .call(this.customXAxis);					
	}	
	
	updateYAxis(duration){

		this.customYAxis = (g) =>{
			let s = g.selection ? g.selection() : g;
			g.call(this.yAxis)
			s.select(".domain").remove();
			s.selectAll(".tick line").attr("x1", -this.margin.left)
			s.selectAll(".tick text").attr("x", -8).attr("dy", -4);
			if (this.horizontal){
				s.selectAll(".tick line").attr("x1", 0)				
				s.selectAll(".tick text").attr("x", -8).attr("dy", 2);
			}
			
			if (s !== g) g.selectAll(".tick text").attrTween("x", null).attrTween("dy", null);		
		}

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
	    	.call(this.customYAxis)
			.on("end", (d) => {

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
	    	 	
		
		
	}	

	updateSideLayoutAxis(){
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
	}

	labelUpdate ()  {

		if (!this.annotationGroup){return;}
		this.annotationData = this.options.annotations()

		this.makeAnnotations
			.annotations(this.annotationData)				
		
		this.makeAnnotations.updatedAccessors()			
		this.svg.select("g.annotation-group")
			.call(this.makeAnnotations)			
	}
	
}

export { ChartBase }
//POLL, TIMELINE, ANNOTATIONS, ANIMATE CHART IN