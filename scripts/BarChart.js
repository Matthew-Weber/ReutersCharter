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
		return d3.min(this.chartData, (c) =>  (d3.min(c.values, (v) => v[this.xValue])) );
	}
	
	xScaleMax (){
		return d3.max(this.chartData, (c) => ( d3.max( c.values, (v) => v[this.xValue] ) ) );
	}
	
	xScaleRange (){
		let objectNumber = this.numberOfObjects();
		if (this.chartLayout == "stackPercent" ||  this.chartLayout == "stackTotal"){objectNumber = 1;}
		let range = [(this.widthOfBar() * objectNumber) / 2, this[this.widthOrHeight] - this.widthOfBar() * objectNumber];
		if (this.chartLayout == "sideBySide"){
			range = [0, (this[this.widthOrHeight]/(this.chartData.length * (1 + (2 / (this.chartData[0].values.length) ) ) ) )];
		}
		return range;
	}

	xScaleDomain (){
		let domain = [this.xScaleMin(),this.xScaleMax()];
		if (this.xScaleType == "Point" || this.xScaleType == "Band"){
			domain = this.chartData[0].values.map( (d) => d.category)
		}
		return domain;
	}
		
	getXScale () {
		//matt
		
		return d3[`scale${this.xScaleType}`]()
			.domain(this.xScaleDomain())
			.range(this.xScaleRange())
			//.round(true)
			//.paddingInner(1)
			//.paddingOuter(1)

	}
	
	yScaleMin (){
		let theValues = this.dataType;
		if (this.chartLayout == "stackTotal"){theValues = "stackMin";}
		let min = d3.min(this.chartData, (c) => (d3.min(c.values, (v) => v[theValues] ) ) );
		if (this.chartLayout == "stackPercent"){min = 0;}
		if (min > 0){min = 0;}
		return min;
	}
	
	yScaleMax (){
		let theValues = this.dataType;
		if (this.chartLayout == "stackTotal"){theValues = "stackTotal";}
		let max = d3.max(this.chartData, (c) => (d3.max(c.values, (v) => v[theValues] ) ) );
		if (this.chartLayout == "stackPercent"){max = 100;}
		if (max < 0){ max = 0;}		
		return max;
	}
	
	yScaleRange (){
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
		let domain = [this.yScaleMin(),this.yScaleMax()];
		//MATT, what is this doing in terms of a y scale? 
		if (this.yScaleType == "Point" || this.yScaleType == "Band"){
			domain = this.chartData[0].values.map( (d) => d.category)
		}
		return domain;
	}
			
	getYScale () {

		//MATT - should you have XscaleVals as well?  Also, should all of these scale functions be in base chart? Are they going to in fact be different?
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
	
	yBarPosition (d) {
		if ( isNaN(d[this.dataType])){
			return 0;				
		}
		let positioner = "y1";
		if (this.horizontal || d.y1Total < 0 ){ positioner = "y0";}
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
		}
		return this.scales.y(Math[minOrMax](0, d[this.dataType])); 
	}
	
	barHeight (d){
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

		let color = this.colorScale(d.name)
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

		if (this.chartLayout == "tier"){
			return this.widthOfBar() * this.numberOfObjects();
		}
		if (this.chartLayout == "outlineBar"){
			return this.widthOfBar() 
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
		this.appendBarGs();
		this.lineGSideBySide();
		this.appendBars();

		this.makeZeroLine();
		this.createSideLayoutAxis();

		if (this.isPoll){
			this.addMoe();	
		}
				
		console.log('rendering')

	}

	
	appendBarGs(){
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

	udpateSideLayoutAxis(){
		//MATT need to make horizontal switcing to sidebyside work
		//Matt need sprite for side by side lines.
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
			
			
	}

	//////////////////////////////////////////////////////////////////////////////////
	///// UDPATE.
	//////////////////////////////////////////////////////////////////////////////////  	
	
	update(){
		this.baseUpdate();
		console.log('updating')
		
		this.updateBarGs();
		this.updateBars();
		this.updateBarsExit();
		this.appendBars();
		this.udpateSideLayoutAxis();
		if (this.isPoll){
			this.updateMoe();	
		}
		
	}


	
	updateBars(){
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
		this.barChart
			.data(this.chartData, (d) => d.name )
			.exit()
			.selectAll(".bar")
			.transition()
			.attr(this.heightOrWidth, 0)
			.attr(this.yOrX, this.scales.y(0));	
						
	}
	


	updateBarGs(){
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
	
	//////////////////////////////////////////////////////////////////////////////////
	///// POLLING CHART.
	//////////////////////////////////////////////////////////////////////////////////  	

	addMoe () {
		
		this.addMoeGs();
		this.addMoeBars();
		if (this.leftBarCol){
			this.addMoeLabels();
		}
		
	}	
	
	addMoeGs(){
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
		console.log(this.moeLabelObj)
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
		this.moeChart
			.data(this.chartData, (d) => d.name )
			.attr("data-index", (d,i) => i)			

		this.updateMoeBars();
		this.updateMoeG();

		if (this.leftBarCol){
			this.updateMoeLabels();
		}
	}
	
	updateMoeG(){
		this.moeChart
			.data(this.chartData, (d) => d.name )
			.exit()
			.selectAll(".moebar")
			.transition()
			.attr(this.heightOrWidth, 0)
			.attr(this.yOrX, this.scales.y(0));		
	}
	
	updateMoeBars(){
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
