import { ChartBase } from './ChartBase.js'
let d3formatter = require("d3-format");
let d3 = Object.assign(d3formatter, require("d3-fetch"), require("d3-time-format"), require("d3-scale"), require("d3-axis"), require("d3-color"), require("d3-path"), require("d3-selection"), require("d3-selection-multi"), require("d3-shape"), require("d3-transition"), require("d3-array"));
import textures from "textures"
import scatterChartLegendTemplate from '../templates/scatterChartLegendTemplate.html'
import scatterChartTipTemplate from '../templates/scatterChartTipTemplate.html'

class ScatterChart extends ChartBase {
	constructor(opts){
		super(opts);
		this.chartType = "scatter";	
		if (!this.options.tipTemplate){
			this.tipTemplate = scatterChartTipTemplate;			
		}
		if (!this.options.legendTemplate){
			this.legendTemplate = scatterChartLegendTemplate;
		}		this.hasLegend = false;
		if (!this.options.xAxisLineLength){
			this.xAxisLineLength = "long";			
		}
		if (!this.options.yAxisLineLength){
			this.yAxisLineLength = "long";				
		}
		if (!this.options.tipValuesDisplay){
			this.tipValuesDisplay = {};				
		}
		if (!this.tipValuesDisplay.xValue){this.tipValuesDisplay.xValue = this.xValue}
		if (!this.tipValuesDisplay.yValue){this.tipValuesDisplay.yValue = this.yValue}
		if (!this.tipValuesDisplay.rValue){this.tipValuesDisplay.rValue = this.rValue}		

	}

	//////////////////////////////////////////////////////////////////////////////////
	///// set scales.
	//////////////////////////////////////////////////////////////////////////////////  	

	xScaleMin (){
		if (this.xScaleVals){ return this.xScaleVals[0]}
		return d3.min(this.chartData, (d) => {
			return d[this.xValue];
		})
	}
	
	xScaleMax (){
		if (this.xScaleVals){ return this.xScaleVals[this.xScaleVals.length-1]}
		return d3.max(this.chartData, (d) => {
			return d[this.xValue];
		})	
	}
	
	xScaleRange (){
		//return range
		if (this.horizontal){
			return [this[this.widthOrHeight],0]			
		}
		return [0, this[this.widthOrHeight]]
	}

	xScaleDomain (){
		let domain = [this.xScaleMin(),this.xScaleMax()];
		if (this.xScaleType == "Point" || this.xScaleType == "Band"){
			domain = this.chartData.map( (d) => d[this.xValue])
		}
		return domain;	
	}
		
	getXScale () {	
		if (!this.xScaleVals || this.hasZoom ){			
			let scale =  d3[`scale${this.xScaleType}`]()
				.domain(this.xScaleDomain())
				.range(this.xScaleRange())
			if (this.xScaleType != "Point"){
				scale.nice(this.xScaleTicks)						
			}
			return scale;
				
		}else{			
			return d3[`scale${this.xScaleType}`]()
				.domain([this.xScaleVals[0],this.xScaleVals[this.xScaleVals.length - 1]])
				.range(this.xScaleRange())
		}			
	}
	
	yScaleMin (){
		//find y min.  Is different if stacked.  also, if greater than 0, return 0.
		if (this.yScaleVals){ return this.yScaleVals[0]}
		return d3.min(this.chartData, (d) => {
			return d[this.yValue];
		})
	}
	
	yScaleMax (){
		//find max, account for stacks.
		if (this.yScaleVals){ return this.yScaleVals[this.yScaleVals.length-1]}
		return d3.max(this.chartData, (d) => {
			return d[this.yValue];
		})	
	}
	
	yScaleRange (){
		if (this.horizontal){
			return [0,this[this.heightOrWidth]]
		}
		return [this[this.heightOrWidth],0];		
	}
	
	yScaleDomain (){
		//determine the domain.
		let domain = [this.yScaleMin(),this.yScaleMax()];
		if (this.yScaleType == "Point" || this.yScaleType == "Band"){
			domain = this.chartData.map( (d) => d[this.yValue])
		}
		return domain;
	}
			
	getYScale () {
		//return the scales
		if (!this.yScaleVals || this.hasZoom ){			
			let scale =  d3[`scale${this.yScaleType}`]()
				.domain(this.yScaleDomain())
				.range(this.yScaleRange())
			if (this.yScaleType != "Point"){
				scale.nice(this.yScaleTicks)						
			}
			return scale;
				
		}else{			
			return d3[`scale${this.yScaleType}`]()
				.domain([this.yScaleVals[0],this.yScaleVals[this.yScaleVals.length - 1]])
				.range(this.yScaleRange())
		}
	}
	
	setOptColorScales(data){		
		//Define Color Scale
		//again, if object, make domain and range from object keys and values.  otherwise use columnNames from above as domain, and array of colors as colors.	
		if (!this.colorValue){return}
		this.colorScale = d3.scaleOrdinal();				
		if (_.isObject(this.colors) && !_.isArray(this.colors)){
			this.colorScale.domain(_.keys(this.colors));
			this.colorScale.range(_.values(this.colors));
		}
		if (_.isArray(this.colors)){
			let colorDomain = _.uniq(_.map(data, this.colorValue));
			this.colorScale.domain(colorDomain);
			this.colorScale.range(this.colors);
		}		
	}

	barCalculations(){}
	
	//////////////////////////////////////////////////////////////////////////////////
	///// LEGEND.
	//////////////////////////////////////////////////////////////////////////////////  	

	setOptHasLegend(){
		//turns off the legend if plotting only one thing.  Unless legend specifically asked for in block.
		this.hasLegend = false;
		if (this.colorValue && this.options.hasLegend != "off"){
			this.hasLegend = true;
		}		
	}			

	updateVisibility (data,id,$el){
		let currentData = data.filter((d) => {
			return id == d[this.colorValue]
		})
		if($el.hasClass("clicked")){
			currentData.forEach( (d) => {
				d.visible = true;
			})
		}else{
			currentData.forEach( (d) => {
				d.visible = false;
			})
		}
	}
	
	makeChartData (data){
		//reruns data sorts and stacks to account for new or removed data.
		let filtered = data.filter( (d) => d.visible )
		return filtered;
	}	
	
	setLegendPositions(){
		//want legend items on the right to sort based on what is included or not, so they all have a top style applied.
		if (!this.hasLegend){
			return;
		}
		let depth = 0;										
		$(".legendItems").each((i)=>{
			let $el =  $(".legendItems").eq(i);
			if ($el.hasClass("clicked") ){
				return
			}
			let returnDepth = depth
			depth += $el.height() +5
			$el.css({"top":returnDepth+"px"})
		})
		$(".legendItems.clicked").each((i)=>{
			let $el =  $(".legendItems.clicked").eq(i);
			let returnDepth = depth
			depth += $el.height() +5
			$el.css({"top":returnDepth+"px"})		
		})		
		
	}

	updateLegendContent(){}

	//////////////////////////////////////////////////////////////////////////////////
	///// tooltips
	//////////////////////////////////////////////////////////////////////////////////  	
	
	
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
			this.chartData.forEach( (d,i) => {
				if (this.closestDate === null || Math.abs(d[this.xValue] - this.locationDate) < Math.abs(this.closestDate - this.locationDate)){ this.closestDate = d[this.xValue]; }			
			});
		
	}
	
	makeTipData (){
		//tooltips and legends need to be passed only the data the matches your current location and is visible.		
		let timeFormatter = d3.timeFormat("%m/%d/%Y %H:%M:%S");
		let matchingValues = this.chartData.filter( (d) => {
			if (this.xValue == "date"){
				return timeFormatter(d[this.xValue]) == timeFormatter(this.closestDate)			
			}				
			return d[this.xValue] == this.closestDate;
		});	

		return matchingValues;		
		
	}	

	highlightCurrent (){
		//for bars, classes all the other bars to be lighter so this one stands out.
		this.scatterPlot
			.classed("lighter", (d) => {
				if (d[this.xValue] == this.closestDate){
					return false;		
				}
				return true;		
			});			
		
		
	}
				
	setOptRValue (){
		
		if (this.rValue){
			this.radiusModifier = this.rValue.multiplier;
			
			if (typeof this.rValue.data == "number"){
				this.hardRadius = this.rValue.data;
				this.rValue = false;
			}else{
				this.rValue = this.rValue.data;
			}	
		}
	}	

	//////////////////////////////////////////////////////////////////////////////////
	///// render.
	//////////////////////////////////////////////////////////////////////////////////  	


	render (){
		this.emit("chart:rendering", this)		

		this.$("svg").css({"overflow":"visible"});
		this.setOptRValue();
		this.appendCircles();
				
		this.emit("chart:rendered", this)		
	}

	setFill(d){
		if (this.noFill){return "none"}
		if (this.colorValue){
			return this.colorScale(d[this.colorValue]);			
		}
		return 
	}

	setStroke(d){
		if (this.noStroke){return "none"}

		if (this.colorValue){
			return this.colorScale(d[this.colorValue]);			
		}
		return
	}
	
	appendCircles(){
		this.scatterPlot = this.svg.selectAll("circle")
			.data(this.chartData)
			.enter()
			.append("circle")
			.attr("r", (d) => {
				if (this.rValue){
					return (Math.sqrt(d[this.rValue])/Math.PI) * this.radiusModifier;	   
				}else{
					return this.hardRadius;
				}
			})
			.attr(`c${this.yOrX}`, (d) => this.scales.y(d[this.yValue]))
			.attr(`c${this.xOrY}`, (d) => this.scales.x(d[this.xValue]))
			.attr("class", "scatter-dot")
			.style("fill", (d) => this.setFill(d))				
			.style("stroke", (d) => this.setStroke(d))
			
		if (this.simpleTips){
			this.scatterPlot.attr("title", (d) => this.tipTemplate({this:this, data:[d]}) )
		
			this.$(".scatter-dot").tooltip({html:true})
		}
	}
	

	


	//////////////////////////////////////////////////////////////////////////////////
	///// UDPATE.
	//////////////////////////////////////////////////////////////////////////////////  	
	
	update(){		
		this.baseUpdate();
		this.emit("chart:updating", this)		
		this.updateCircles();
		this.updateCirclesExit();
		this.updateCirclesEnter();

		this.emit("chart:updated", this)					
		
	}
	
	updateCircles(){
		this.svg.selectAll(".scatter-dot")
			.data(this.chartData, (d) => d[this.idField] )
			.transition()
			.duration(1000)
			.attr(`c${this.yOrX}`, (d) => this.scales.y(d[this.yValue]))
			.attr(`c${this.xOrY}`, (d) => this.scales.x(d[this.xValue]))
			.style("fill", (d) => this.setFill(d))				
			.style("stroke", (d) => this.setStroke(d))
			.attr("r", (d) => {
				if (this.rValue){
					return (Math.sqrt(d[this.rValue])/Math.PI) * this.radiusModifier;	   
				}else{
					return this.hardRadius;
				}
			})
			.attr("title", (d) => {
				if (this.simpleTips){
					return this.tipTemplate({this:this, data:[d]}) 
				}
			})
				
		if (this.simpleTips){
			this.$(".scatter-dot").tooltip({html:true})
		}			
						
	}
	
	updateCirclesExit(){
		this.svg.selectAll(".scatter-dot")
			.data(this.chartData, (d) => d[this.idField] )
			.exit()
			.transition()
			.duration(1000)
			.attr("r", 0)			
	}
	
	updateCirclesEnter(){
		this.svg.selectAll(".scatter-dot")
			.data(this.chartData, (d) => d[this.idField] )
			.enter()
			.append("circle")
			.attr(`c${this.yOrX}`, (d) => this.scales.y(d[this.yValue]))
			.attr(`c${this.xOrY}`, (d) => this.scales.x(d[this.xValue]))
			.style("fill", (d) => this.setFill(d))				
			.style("stroke", (d) => this.setStroke(d))
			.attr("class", "scatter-dot")
			.transition()
			.duration(1000)
			.attr("r", (d) => {
				if (this.rValue){
					return (Math.sqrt(d[this.rValue])/Math.PI) * this.radiusModifier;	   
				}else{
					return this.hardRadius;
				}
			})
			.attr("title", (d) => {
				if (this.simpleTips){
					return this.tipTemplate({this:this, data:[d]}) 
				}
			})
				
		if (this.simpleTips){
			this.$(".scatter-dot").tooltip({html:true})
		}			
						
	}	

	
	
	
	
}

export { ScatterChart }
