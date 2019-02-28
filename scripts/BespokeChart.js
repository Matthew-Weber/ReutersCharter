import ReutersCharter from "ReutersCharter"
let d3formatter = require("d3-format");
let d3 = Object.assign(d3formatter, require("d3-fetch"), require("d3-time-format"), require("d3-scale"), require("d3-axis"), require("d3-color"), require("d3-path"), require("d3-selection"), require("d3-selection-multi"), require("d3-shape"), require("d3-transition"), require("d3-array"));
import textures from "textures"

//import bespokeChartLegendTemplate from '../templates/bespokeChartLegendTemplate.html'
//import bespokeChartTipTemplate from '../templates/bespokeChartTipTemplate.html'

class BespokeChart extends ReutersCharter.BespokeBase {
	constructor(opts){
		super(opts);
		this.chartType = "bespoke";	
		//this.legendTemplate = bespokeChartLegendTemplate;
		//this.tipTemplate = bespokeChartTipTemplate;
		this.hasLegend = false;
	}

	
	setOptColorScales(data){		
/*
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
*/	
	}


	highlightCurrent (){
/*
		this.scatterPlot
			.classed("lighter", (d) => {
				if (d[this.xValue] == this.closestDate){
					return false;		
				}
				return true;		
			});	
*/		
	}
				
	xScaleMin (){
		let startMin = d3.min(this.chartData, (d) => {
			return d.start;
		}) 
		let endMin = d3.min(this.chartData, (d) => {
			return d.end;
		})
		return Math.min(startMin,endMin); 
	}
	
	xScaleMax (){
		let startMax = d3.max(this.chartData, (d) => {
			return d.start;
		}) 
		let endMax = d3.max(this.chartData, (d) => {
			return d.end;
		})
		return Math.max(startMax,endMax);
	}

		

	//////////////////////////////////////////////////////////////////////////////////
	///// render.
	//////////////////////////////////////////////////////////////////////////////////  	


	render (){
		this.emit("chart:rendering", this)		

		this.addLines = this.svg.selectAll(".connect-lines")
			.data(this.chartData)
			.enter()
			.append("line")
			.attrs({
				x1:(d) => this.scales.x(d.start),
				x2:(d) => this.scales.x(d.end),
				y1:(d) => this.scales.y(d.category),
				y2:(d) => this.scales.y(d.category),
				class:"connect-lines"
			})

		this.addStarts = this.svg.selectAll(".start-points")
			.data(this.chartData)
			.enter()
			.append("circle")
			.attrs({
				cx:(d) => this.scales.x(d.start),
				cy:(d) => this.scales.y(d.category),
				r:5,
				fill:gray4,
				class:"start-points"
			})

		this.addEnds = this.svg.selectAll(".end-points")
			.data(this.chartData)
			.enter()
			.append("circle")
			.attrs({
				cx:(d) => this.scales.x(d.end),
				cy:(d) => this.scales.y(d.category),
				r:5,
				fill:red4,
				class:"end-points"
			})


				
		this.emit("chart:rendered", this)		
	}

	//////////////////////////////////////////////////////////////////////////////////
	///// UDPATE.
	//////////////////////////////////////////////////////////////////////////////////  	
	
	update(){		
		this.baseUpdate();
		this.emit("chart:updating", this)		

		this.addLines
			.transition()
			.duration(1000)
			.attrs({
				x1:(d) => this.scales.x(d.start),
				x2:(d) => this.scales.x(d.end),
				y1:(d) => this.scales.y(d.category),
				y2:(d) => this.scales.y(d.category),
			})

		this.addStarts 			
			.transition()
			.duration(1000)
			.attrs({
				cx:(d) => this.scales.x(d.start),
				cy:(d) => this.scales.y(d.category),
			})

		this.addEnds
			.transition()
			.duration(1000)		
			.attrs({
				cx:(d) => this.scales.x(d.end),
				cy:(d) => this.scales.y(d.category),
			})


		this.emit("chart:updated", this)					
		
	}
	

	
	
	
	
}

export { BespokeChart }
