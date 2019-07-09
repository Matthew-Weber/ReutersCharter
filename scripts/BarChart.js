import { ChartBase } from './ChartBase.js'
let d3formatter = require("d3-format");
let d3 = Object.assign(d3formatter, require("d3-fetch"), require("d3-time-format"), require("d3-scale"), require("d3-axis"), require("d3-color"), require("d3-path"), require("d3-selection"), require("d3-selection-multi"), require("d3-shape"), require("d3-transition"), require("d3-array"));
import textures from "textures"

class BarChart extends ChartBase {
	constructor(opts){
		super(opts);
		this.chartType = "bar"	
	}

	//////////////////////////////////////////////////////////////////////////////////
	///// set scales.
	//////////////////////////////////////////////////////////////////////////////////  	

	xScaleMin (){
		//get x min
		return d3.min(this.chartData, (c) =>  (d3.min(c.values, (v) => v[this.xValue])) );
	}
	
	xScaleMax (){
		//get x max
		return d3.max(this.chartData, (c) => ( d3.max( c.values, (v) => v[this.xValue] ) ) );
	}
	
	xScaleRange (){
		//figure range for chart, will vary if is stacked bars.
		let objectNumber = this.numberOfObjects();
		if (this.chartLayout == "stackPercent" ||  this.chartLayout == "stackTotal"){objectNumber = 1;}
		let range = [(this.widthOfBar() * objectNumber) / 2, this[this.widthOrHeight] -  ( (this.widthOfBar()/2) * objectNumber)];
		if (this.chartLayout == "sideBySide"){
			range = [0, (this[this.widthOrHeight]/(this.chartData.length * (1 + (2 / (this.chartData[0].values.length) ) ) ) )];
		}
		return range;
	}

	xScaleDomain (){
		//domain is probably just min and max, but if it's a category chart, than it's a map of all the categories. if x scale vals, then it's first and last.
		if (this.xScaleVals){
			return [this.xScaleVals[0],this.xScaleVals[this.xScaleVals.length - 1]]
		}
		let domain = [this.xScaleMin(),this.xScaleMax()];
		if (this.xScaleType == "Point" || this.xScaleType == "Band"){
			domain = this.chartData[0].values.map( (d) => d.category)
		}
		return domain;
	}
		
	getXScale () {	
		//create the scales, 
		return d3[`scale${this.xScaleType}`]()
			.domain(this.xScaleDomain())
			.range(this.xScaleRange())
	}
	
	yScaleMin (){
		//find y min.  Is different if stacked.  also, if greater than 0, return 0.
		let theValues = this.dataType;
		if (this.chartLayout == "stackTotal"){theValues = "stackMin";}
		let min = d3.min(this.chartData, (c) => (d3.min(c.values, (v) => v[theValues] ) ) );
		if (this.chartLayout == "stackPercent"){min = 0;}
		if (min > 0){min = 0;}
		return min;
	}
	
	yScaleMax (){
		//find max, account for stacks.
		let theValues = this.dataType;
		if (this.chartLayout == "stackTotal"){theValues = "stackTotal";}
		let max = d3.max(this.chartData, (c) => (d3.max(c.values, (v) => v[theValues] ) ) );
		if (this.chartLayout == "stackPercent"){max = 100;}
		if (max < 0){ max = 0;}		
		return max;
	}
	
	yScaleRange (){
		//return the range, horizontal is inverted.
		let fullHeight = this[this.heightOrWidth];
		let rangeLow = fullHeight;
		let rangeHigh = 0;
		if (this.horizontal){
			rangeLow = 0;
			rangeHigh = fullHeight ;
		}
		return [rangeLow,rangeHigh];		
	}
	
	yScaleDomain (){
		//determine the domain.
		let domain = [this.yScaleMin(),this.yScaleMax()];
		if (this.yScaleType == "Point" || this.yScaleType == "Band"){
			domain = this.chartData[0].values.map( (d) => d.category)
		}
		return domain;
	}
			
	getYScale () {
		//return the scales
		if (!this.yScaleVals || this.hasZoom){			
			return d3[`scale${this.yScaleType}`]()
				.domain(this.yScaleDomain())
				.range(this.yScaleRange())
				.nice(this.yScaleTicks)						
		}else{			
			return d3[`scale${this.yScaleType}`]()
				.domain([this.yScaleVals[0],this.yScaleVals[this.yScaleVals.length - 1]])
				.range(this.yScaleRange())
		}
	}
	
	//////////////////////////////////////////////////////////////////////////////////
	///// position and fill bars.
	//////////////////////////////////////////////////////////////////////////////////  	

	
	xBarPosition (d, i, j) {
		//because bars in d3 are wonky, i adjust the x position based on how many columns of data we are plotting, and the layout of the chart.
		//j in this function is the index of the parent group.  It no longer is passed in natively in d3, so i'm saving it onto the parent as a data attribute and accessing that.
		let barPosition = this.scales.x(d[this.xValue]);
		let positionInsideGroup = barPosition - ( j * this.widthOfBar() )			
		let halfOfGroupWidth = (this.numberOfObjects() / 2) * this.widthOfBar()
		let halfOfBar = (this.widthOfBar()/2)
		
		if(this.chartLayout == "basic"){
			return  positionInsideGroup  - this.widthOfBar() + halfOfGroupWidth
		} 
		
		if (this.chartLayout == "onTopOf"){
			return (barPosition - halfOfGroupWidth)+( (this.widthOfBar()/(j+1)) * j/2 );  
		}
		
		return barPosition - halfOfBar;  					
	
	}
	
	yBarPosition (d,textPosition) {
		//y position needs to account for whether it's a stack or not, and whther it's horizontal or not.  piggybacking on this function for labels on bars, however, they need a small adjustment on horizontal.
		if ( isNaN(d[this.dataType])){
			return 0;				
		}
		let positioner = "y1";
		if ((this.horizontal || d.y1Total < 0) && !textPosition){ positioner = "y0";}
		if (this.horizontal && d.y1Total < 0 ){ positioner = "y1";}
		if (this.chartLayout == "stackTotal"){ 
			return this.scales.y(d[`${positioner}Total`]);
		}
		if (this.chartLayout == "stackPercent"){
			return this.scales.y(d[`${positioner}Percent`]);					
		}
		let minOrMax = "max";
		if (this.horizontal){
			minOrMax = "min";
			if (textPosition){
				minOrMax = "max"
			}
		}
		return this.scales.y(Math[minOrMax](0, d[this.dataType])); 
	}
	
	barHeight (d){
		//how big is your bar, usual caveats on stacks, et cetera.
		if ( isNaN(d[this.dataType])){
			return 0;				
		}
		if (this.chartLayout == "stackTotal"){ 
			return Math.abs(this.scales.y(d.y0Total) - this.scales.y(d.y1Total));
		}
		if (this.chartLayout == "stackPercent"){
			return Math.abs(this.scales.y(d.y0Percent) - this.scales.y(d.y1Percent));
		}
		return Math.abs(this.scales.y(d[this.dataType]) - this.scales.y(0));
	}
	
	barFill (d,i,j){
		//see prior note, re: j. color up down just returns the first and second items of the color range. outline bar will put none on the second item. hash after checks the date, and applies textures if past a certain point.
		let color = this.colorScale(d.name);
		if (this.colorByCat){
			color = this.colorScale(d.category);			
		}
		if (this.colorUpDown){
			if (d[this.dataType] > 0){
				color = this.colorScale.range()[0];
			}else{
				color =  this.colorScale.range()[1];
			}					  						  	
		}
		if(this.chartLayout == "outlineBar"){
			if (j == 1){return "none"}  			
		}

		if (this.hashAfterDate){
			let cutoffDate = this.dateParse(this.hashAfterDate);
            let strokecolor = d3.rgb(color).darker(0.8);
            this.t = textures.lines().size(7).stroke(strokecolor).background(color);
            this.svg.call(this.t);
            if (d.date > cutoffDate){
                return this.t.url()
            }
            return color;
		}
		return color;
		
	}
	
	barWidth (d,i,j){
		//width of the bar.  tier doesn't currently exist. mostly we are just returning widthOfBar, but exceptions made for ontopOf
		//a number of the calculations in here, and above should really just bein the widthOfBar function.  Note to self, MATT.
		if (this.chartLayout == "tier"){
			return this.widthOfBar() * this.numberOfObjects();
		}

		if (this.chartLayout == "onTopOf" ){
			return (this.widthOfBar()) / (j + 1);
		}
			
		return this.widthOfBar();
		
	}

	//////////////////////////////////////////////////////////////////////////////////
	///// render.
	//////////////////////////////////////////////////////////////////////////////////  	


	render (){
		this.emit("chart:rendering", this)		
		this.appendBarGs();
		this.lineGSideBySide();
		this.appendBars();

		this.makeZeroLine();		
		if (this.isPoll){
			this.addMoe();	
		}
		if (this.markDataPoints){
			this.addBarLabels();
		}
		if (this.annotations){
			this.updateAnnotationOrder()
		}		
				
		this.emit("chart:rendered", this)		
	}

	updateAnnotationOrder(){
		this.svg.selectAll("g.annotation-group, g.barChart")
			.sort(function(a,b){
				let aValue = 0;
				let bValue = 0;
				if (a){aValue = 1};
				if (b){bValue = 1};
				if (aValue < bValue){return 1}
				if (aValue > bValue){return -1}
			})
			.order()
		
		
	}
	
	appendBarGs(){
		//a g for each column of data.  data-index will return index of these parent elements to be used in subsequent calculations.
		this.barChart = this.svg.selectAll(".barChart")
			.data(this.chartData, (d) => d.name )
			.enter().append("g")
			.attrs({
				"clip-path":`url(#clip${this.targetDiv})`,
				class: "barChart",
				"data-index": (d,i) =>{return i},
				id:(d) => {return `${this.targetDiv}${d.displayName.replace(/\s/g, '')}-bar`; }
			})

	}
	
	lineGSideBySide	(){	
		//side by side layout require translation.
		if (this.chartLayout == "sideBySide"){
			this.barChart.attr("transform", (d,i) =>{
				if (!this.horizontal){
					return 	`translate(${(i * (this[this.widthOrHeight] / this.numberOfObjects())) + this.widthOfBar()/2},0)`;				  	
				}else{
					return 	`translate(0,${(i * (this[this.widthOrHeight] / this.numberOfObjects())) + +this.widthOfBar()/2})`;				  						
				}
			});
		}else{
			this.barChart.attr("transform", (d,i) => "translate(0,0)");	
		}				
	}
	
	appendBars(){
		//let's drop in some bars.
		this.barChart.selectAll(".bar")
			.data( (d) => d.values)
			.enter().append("rect")
			.style("fill", (d,i,nodes) => {
				let j = +nodes[i].parentNode.getAttribute("data-index");
				return this.barFill(d,i,j)
				
			})
			.attrs({
				"class":"bar",
				[this.heightOrWidth]:0,
				[this.yOrX]: this.scales.y(0),
				[this.widthOrHeight]: (d,i,nodes) => { 
					let j = +nodes[i].parentNode.getAttribute("data-index");
					
					return this.barWidth(d,i,j) 
				},
				[this.xOrY]:(d,i,nodes) => {
					let j = +nodes[i].parentNode.getAttribute("data-index");
					return this.xBarPosition(d,i,j)
				}
			})
			.classed("outline", (d,i,nodes) => {
				let j = +nodes[i].parentNode.getAttribute("data-index");
				if(this.chartLayout == "outlineBar" && j == 1){ return true}
				return false
			})
			.transition()
			.duration(1000)
			.attrs({
				[this.yOrX]: (d) => { return this.yBarPosition(d)}, 
				[this.heightOrWidth]: (d) => { return this.barHeight(d)}	
			})
		
		
	}

	addBarLabels(){
		//if mark data points, i'll put in som elabels on each bar.  SHould maybe an option for white on bar, or black off bar? MATT
		this.barChart.selectAll(".barLabel")
			.data( (d) => d.values)
			.enter().append("text")
			.attrs({
				"class":"barLabel",
				[this.yOrX]: (d) => { 
					let mod = 15;
					if (this.horizontal){mod = -15}
					return this.yBarPosition(d, true) + mod
				}, 
				[this.xOrY]:(d,i,nodes) => {
					let j = +nodes[i].parentNode.getAttribute("data-index");
					return this.xBarPosition(d,i,j) + this.widthOfBar()/2
				},
				"dy":(d) =>{
					if (this.horizontal){return 3}
				}
			})
			.text((d)=> this.numbFormat(d.value))
		
	}

	//////////////////////////////////////////////////////////////////////////////////
	///// UDPATE.
	//////////////////////////////////////////////////////////////////////////////////  	
	
	update(){		
		this.baseUpdate();
		this.emit("chart:updating", this)		
		
		this.updateBarGs();
		this.updateBars();
		this.updateBarsExit();
		this.appendBars();		
		if (this.isPoll){
			this.updateMoe();	
		}
		if (this.markDataPoints){
			this.updateBarLabels();
			this.updateBarLabelsExit();
		}	
		this.emit("chart:updated", this)					
		
	}


	
	updateBars(){
		//updates the bars themselves.
		this.svg.selectAll(".barChart")					
			.data(this.chartData, (d) => d.name )
			.selectAll(".bar")
			.data((d) => d.values)
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
			.style("fill", (d,i,nodes) => {
				let j = +nodes[i].parentNode.getAttribute("data-index");
				return this.barFill(d,i,j)
				
			})
			
	}
	
	updateBarsExit(){
		//removes the exiting bars.
		this.barChart
			.data(this.chartData, (d) => d.name )
			.exit()
			.selectAll(".bar")
			.transition()
			.attr(this.heightOrWidth, 0)
			.attr(this.yOrX, this.scales.y(0));	
						
	}
	


	updateBarGs(){
		//update the master g tags, transforms them if side by side.
		this.barChart
			.data(this.chartData, (d) => d.name )
			.order()
			.attr("data-index", (d,i) => i)
			.transition()	        
			.duration(1000)
			.attr("transform", (d,i) => {
				if (this.chartLayout == "sideBySide"){
					if (!this.horizontal){
						return 	`translate(${(i * (this[this.widthOrHeight] / this.numberOfObjects())) + this.widthOfBar()/2},0)`;				  	
					}					
					return 	`translate(0,${(i * (this[this.widthOrHeight] / this.numberOfObjects())) + this.widthOfBar()/2})`;
				}
				return 	"translate(0,0)";
			
			});
			
	}
	
	updateBarLabels(){
		//if we have labels, have to update them too.
		this.barChart.selectAll(".barLabel")
			.data( (d) => d.values)
			.text((d)=> this.numbFormat(d.value))
			.transition()
			.duration(1000)
			.attrs({
				[this.yOrX]: (d) => { 
					let mod = 15;
					if (this.horizontal){mod = -15}
					return this.yBarPosition(d, true) + mod
				}, 
				[this.xOrY]:(d,i,nodes) => {
					let j = +nodes[i].parentNode.getAttribute("data-index");
					return this.xBarPosition(d,i,j) + this.widthOfBar()/2
				},
				"dy":(d) =>{
					if (this.horizontal){return 3}
				}
			})
	}	
	updateBarLabelsExit(){
		//and exiting labels.
		this.barChart
			.data(this.chartData, (d) => d.name )
			.exit()
			.selectAll(".barLabel")
			.transition()
			.attr(this.heightOrWidth, 0)
			.attr(this.yOrX, -2000);	
						
	}	
	
	//////////////////////////////////////////////////////////////////////////////////
	///// POLLING CHART.
	//////////////////////////////////////////////////////////////////////////////////  	

	addMoe () {
		this.emit("chart:addingMoe", this)		
		this.addMoeGs();
		this.addMoeBars();
		if (this.leftBarCol){
			this.addMoeLabels();
		}
		this.emit("chart:moeAdded", this)				
		
	}	
	
	addMoeGs(){
		//add margin of error g tags.
		this.moeChart = this.svg.selectAll(".moeChart")
			.data(this.chartData, (d) => d.name)
			.enter().append("g")
			.attrs({
				"data-index": (d,i) =>{return i},
				class:"moeChart",
				"clip-path": `url(#clip${this.targetDiv})`
			})				
	}
	
	addMoeBars(){
		//add margin of error bars, maths here a little different on Y and height.
		this.addMoe = this.moeChart.selectAll(".moebar")
			.data( (d) => d.values )
			.enter().append("rect")
			.attr("class", "moebar")
			.style("fill",  (d) =>  {
				return this.moeFill(d);
			})
			.attr(this.widthOrHeight,  (d, i, nodes) => {
				let j = +nodes[i].parentNode.getAttribute("data-index");				
				return this.barWidth(d, i, j);
			})
			.attr(this.xOrY,  (d, i, nodes) => {
				let j = +nodes[i].parentNode.getAttribute("data-index");				
				return this.xBarPosition(d, i, j);
			})
			.attr(this.yOrX,  (d) => {
				if (!this.leftBarCol){
					if (this.horizontal){
						return this.scales.y(d[this.dataType]) - (this.scales.y(d[this.moeColumn]));						
					}
					return this.scales.y(d[this.dataType] + parseFloat(d[this.moeColumn]))
				}
				if (d.name == this.leftBarCol) {
					return this.scales.y(d["y1Total"]) - this.scales.y(d[this.moeColumn]);
				}
				return this.scales.y(d["y0Total"]) - this.scales.y(d[this.moeColumn]);
			})
			.attr(this.heightOrWidth, (d) => { 
				if (this.horizontal){
					return this.scales.y(d[this.moeColumn]*2)
				}
				return Math.abs(this.scales.y(d[this.moeColumn]*2) - this.scales.y(0) )
			})		
		
	}
	
	moeFill(d){
		//the fill for the moe uses textures, a touch different
		let color = this.colorScale(d.name)
        let strokecolor = d3.rgb(color).darker(0.8);
		this.t = textures.lines().size(7).orientation("2/8").stroke(strokecolor);
		this.tother = textures.lines().size(7).orientation("6/8").stroke(strokecolor);
		this.svg.call(this.t);
		this.svg.call(this.tother);

		if (d.name == this.centerCol) {
			return "none";
		}
		if (d.name == this.leftBarCol) {
			return this.tother.url();
		}
		return this.t.url();		
	}
	
	addMoeLabels(){
		//add labels in, if it's a horizontal, two number poll question.
		this.addMoeLabels = this.svg.selectAll("moeLabels")
			.data([this.moeLabelObj[this.leftBarCol], this.moeLabelObj[this.rightBarCol]])
			.enter()
			.append("text")			
			.text( (d) => d )
			.attr("x",  (d,i) => {
				if (i==0){
					return 0;
				}
				return this.width;
			})
			.attr("text-anchor", (d,i) => {
				if (i==0){
					return "start";
				}
				return "end";				
			})
			.attr("dy", -4)
			.style("font-size",".8rem")
			.style("text-transform","uppercase")		
		
	}

	updateMoe (){
		this.emit("chart:updatingMoe", this)						
		this.moeChart
			.data(this.chartData, (d) => d.name )
			.attr("data-index", (d,i) => i)			

		this.updateMoeBars();
		this.updateMoeG();

		if (this.leftBarCol){
			this.updateMoeLabels();
		}
		this.emit("chart:moeUpdated", this)				
	}
	
	updateMoeG(){
		//update the exiting moe
		this.moeChart
			.data(this.chartData, (d) => d.name )
			.exit()
			.selectAll(".moebar")
			.transition()
			.attr(this.heightOrWidth, 0)
			.attr(this.yOrX, this.scales.y(0));		
	}
	
	updateMoeBars(){
		//update the bars
	    this.addMoe
			.data( (d) => d.values )	    
	    	.transition()
	    	.duration(1000)
			.attr(this.widthOrHeight,  (d, i, nodes) => {
				let j = +nodes[i].parentNode.getAttribute("data-index");				
				return this.barWidth(d, i, j);
			})
			.attr(this.xOrY,  (d, i, nodes) => {
				let j = +nodes[i].parentNode.getAttribute("data-index");				
				return this.xBarPosition(d, i, j);
			})
			.attr(this.yOrX,  (d) => {
				if (!this.leftBarCol){
					if (this.horizontal){
						return this.scales.y(d[this.dataType]) - (this.scales.y(d[this.moeColumn]));						
					}
					return this.scales.y(d[this.dataType] + parseFloat(d[this.moeColumn]))
				}
				if (d.name == this.leftBarCol) {
					return this.scales.y(d["y1Total"]) - this.scales.y(d[this.moeColumn]);
				}
				return this.scales.y(d["y0Total"]) - this.scales.y(d[this.moeColumn]);
			})
			.attr(this.heightOrWidth, (d) => { 
				if (this.horizontal){
					return this.scales.y(d[this.moeColumn]*2)
				}
				return Math.abs(this.scales.y(d[this.moeColumn]*2) - this.scales.y(0) )
			})			
	}
	
	updateMoeLabels(){
		//update the labels.
		this.addMoeLabels
	    	.transition()
	    	.duration(1000)		
			.attr("x", (d,i) => {
				if (i==0){
					return 0;
				}
				return this.width;
			})		
	}
	
	
	
	
	
	
}

export { BarChart }
