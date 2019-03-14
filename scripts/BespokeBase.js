import { ChartBase } from './ChartBase.js'
let d3formatter = require("d3-format");
let d3 = Object.assign(d3formatter, require("d3-fetch"), require("d3-time-format"), require("d3-scale"), require("d3-axis"), require("d3-color"), require("d3-path"), require("d3-selection"), require("d3-selection-multi"), require("d3-shape"), require("d3-transition"), require("d3-array"));
import textures from "textures"
import scatterChartLegendTemplate from '../templates/scatterChartLegendTemplate.html'
import scatterChartTipTemplate from '../templates/scatterChartTipTemplate.html'

class BespokeBase extends ChartBase {
	constructor(opts){
		super(opts);
		if (!this.options.tipTemplate){
			this.tipTemplate = scatterChartTipTemplate;			
		}
		if (!this.options.legendTemplate){
			this.legendTemplate = scatterChartLegendTemplate;
		}
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
	
	highlightCurrent (){}

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

	
	
	
}

export { BespokeBase }
