import { ChartBase } from './ChartBase.js'
let d3formatter = require("d3-format");
let d3 = Object.assign(d3formatter, require("d3-fetch"), require("d3-time-format"), require("d3-scale"), require("d3-axis"), require("d3-color"), require("d3-path"), require("d3-selection"), require("d3-selection-multi"), require("d3-shape"), require("d3-transition"), require("d3-array"));


class LineChart extends ChartBase {
	constructor(opts){
		super(opts);
		this.chartType = "line"	
	}

	xScaleMin (){
		return d3.min(this.chartData, (c) =>  (d3.min(c.values, (v) => v[this.xValue])) );
	}
	
	xScaleMax (){
		return d3.max(this.chartData, (c) => ( d3.max( c.values, (v) => v[this.xValue] ) ) );
	}
	
	xScaleRange (){
		let range = [0, this[this.widthOrHeight]]
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
		return d3[`scale${this.xScaleType}`]()
			.domain(this.xScaleDomain())
			.range(this.xScaleRange());

	}
	
	yScaleMin (){
		let theValues = this.dataType;
		if (this.chartLayout == "stackTotal"){theValues = "stackTotal";}
		let min = d3.min(this.chartData, (c) => (d3.min(c.values, (v) => v[theValues] ) ) );
		if (this.chartlayout == "fillLines"){ if (min > 0){min = 0;}}
		if (this.chartLayout == "stackTotal" || this.chartLayout == "stackPercent"){min = 0;}
		return min;
	}
	
	yScaleMax (){
		let theValues = this.dataType;
		if (this.chartLayout == "stackTotal"){theValues = "stackTotal";}
		let max = d3.max(this.chartData, (c) => (d3.max(c.values, (v) => v[theValues] ) ) );
		if (this.chartLayout == "stackPercent"){max = 100;}
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
		if (this.yScaleType == "Point" || this.yScaleType == "Band"){
			domain = this.chartData[0].values.map( (d) => d.category)
		}
		return domain;
	}
			
	getYScale () {
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
	
	render (){
		this.setLineGenerator();
		this.setAreaGenerator();
		this.appendLineGs();
		this.lineGMouseover();
		this.lineGSideBySide();
		this.appendLinePaths();
		this.appendAreaPaths();
		this.appendPointCircles();
		this.makeZeroLine();
		
		console.log('rendering')

	}

	setLineGenerator(){
		this.line = d3.line()
	    	[this.xOrY]( (d) => this.scales.x(d[this.xValue]) )
		    [this.yOrX]( (d) => {
		    	if (this.chartLayout == "stackTotal"){
		    		return this.scales.y(d.y1Total); 		    	
		    	}
			    if (this.chartLayout == "stackPercent"){ 
				    return this.scales.y(d.y1Percent);
				}				
				return this.scales.y(d[this.dataType]);
		    				    
		    })
			.curve( d3[`curve${this.lineType}`] )
			.defined( (d) => !isNaN(d[this.dataType]) );
	}
	
	setAreaGenerator(){
		let lineType = this.lineType;		
		this.area = d3.area()
	    	[this.xOrY]( (d) => this.scales.x(d[this.xValue]) )
		    [`${this.yOrX}0`]( (d) => { 
			    if (this.isPoll){
			    	return this.scales.y(d[this.dataType] - parseFloat(d[this.moeColumn]))				    
			    }
		    	if (this.chartLayout == "stackTotal"){
		    		return this.scales.y(d.y0Total); 		    	
		    	}
			    if (this.chartLayout == "stackPercent"){ 
				    return this.scales.y(d.y0Percent)				    
			    }
				return this.scales.y(0)
		    })
		    [`${this.yOrX}1`]( (d) => {
			    if (this.isPoll){
			    	return this.scales.y(d[this.dataType] + parseFloat(d[this.moeColumn]))
			    }			    
		    	if (this.chartLayout == "stackTotal"){
		    		return this.scales.y(d.y1Total); 		    	
		    	}
			    if (this.chartLayout == "stackPercent"){ 
				    return this.scales.y(d.y1Percent);
				}
				return this.scales.y(d[this.dataType]);
		     })
			.curve ( d3[`curve${this.lineType}`] )
			.defined( (d) => !isNaN(d[this.dataType]) );
	}
	
	appendLineGs(){
		this.lineChart = this.svg.selectAll(".lineChart")
			.data(this.chartData, (d) => d.name )
			.enter().append("g")
			.attrs({
				"clip-path":`url(#clip${this.targetDiv})`,
				class: "lineChart",
				id:(d) => {return `${this.targetDiv}${d.displayName.replace(/\s/g, '')}-line`; }
			})

	}

	lineGMouseover (){
		this.lineChart.on("mouseover", (d,i,nodes) => {			
			//put the line we've hovered on on top=
			this.lineChart.sort( (a,b) => {
				if (a.name == d.name){
					return 1;
				}else{return -1;}
			}).order();
			
			this.$(".lineChart").addClass("notSelected");
			$(nodes[i]).removeClass("notSelected");
		})
		.on("mouseout",  (d) => {
			this.$(".lineChart").removeClass("notSelected");
		});
	}
	
	lineGSideBySide	(){	
		if (this.chartLayout == "sideBySide"){
			this.lineChart.attr("transform", (d,i) =>{
				if (!this.horizontal){
					return 	`translate(${(i * (this[this.widthOrHeight] / this.numberOfObjects())) + this.widthOfBar()/2},0)`;				  	
				}else{
					return 	`translate(0,${(i * (this[this.widthOrHeight] / this.numberOfObjects())) + +this.widthOfBar()/2})`;				  						
				}
			});
		}else{
			this.lineChart.attr("transform", (d,i) => "translate(0,0)");	
		}				
	}
	
	appendLinePaths(){
		this.lineChart.append("path")
			.attrs({
				"class":"line",
				"d":(d) => {return this.line([d.values[0]]); }
			})
			.style("stroke", (d) => this.colorScale(d.name) )
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
	}
	
	appendAreaPaths(){
		this.lineChart.append("path")
			.attrs({
				"class":(d) => {
					if (this.isPoll){return "area pollArea"}
					return "area"
				},
				"d":(d) => {return this.area([d.values[0]]); }
				
			})
			.styles({
				"fill": (d) => { return this.colorScale(d.name); },
				"display": (d) => {
					if (this.chartLayout == "stackTotal" || this.chartLayout == "stackPercent" || this.chartLayout == "fillLines"){
						return "block";
					}else{return "none";}			      	
				}				
			})
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
	
	appendPointCircles(){
		if (!this.markDataPoints){return}
		this.lineChart.selectAll(".tipCircle")
			.data( (d) => d.values)
			.enter()
			.append("circle")
			.attr("class","tipCircle")
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
			.style('opacity', 1)
			.style("fill", (d) => this.colorScale(d.name) )//1e-6
/*
			.classed("timeline", function(d){
				let theScale = 'category';
				if (this.hasTimeScale) {
					theScale = 'date';
				}
				if (this.xScaleColumn){
					theScale = this.xScaleColumn
				}										
				if (this.timelineDataGrouped){
					if (this.timelineDataGrouped[this.timelineDate(d[theScale])]){
						return true;
					}					
				}
				return false
			});
*/
	}

	
	update(){
		this.baseUpdate();
		console.log('updating')
		this.updateLineGs();
		this.exitLinesGenerator();
		this.exitAreaGenerator();
		this.updateExitingLines();
		this.updateExitingAreas();
		this.updateExitingCircles();
		this.updateLines();
		this.updateAreas();
		this.updateCircles();
		this.updateExitCirclePoints();
		this.updateEnterCirclePoints();
		
	}


	updateLineGs(){
		this.lineChart
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
	
	exitLinesGenerator(){
		this.exitLine = d3.line()
	    	[this.xOrY]( (d) => this.scales.x(d[this.xValue]) )
			[this.yOrX]( (d) => (this.margin[this.bottomOrRight]+this[this.heightOrWidth]+this.margin[this.topOrLeft]+10) )
			.curve( d3[`curve${this.lineType}`] )

	}

	exitAreaGenerator(){
		this.exitArea = d3.area()
	    	[this.xOrY]( (d) => this.scales.x(d[this.xValue]) )
			[this.yOrX+"0"]( (d) => (this.margin[this.bottomOrRight]+this[this.heightOrWidth]+this.margin[this.topOrLeft]+10) )
			[this.yOrX+"1"]( (d) => (this.margin[this.bottomOrRight]+this[this.heightOrWidth]+this.margin[this.topOrLeft]+10) )
			.curve( d3[`curve${this.lineType}`] )
	}

	updateExitingLines(){
		this.lineChart
			.data(this.chartData, (d) => d.name )
	        .exit()
			.selectAll(".line")
	        .transition()
	        .attr("d", (d,i) => { 
	      	    return this.exitLine(d.values); 
	         });
	}

	updateExitingAreas(){
		this.lineChart
			.data(this.chartData, (d) => d.name )
	        .exit()
			.selectAll(".area")
	        .transition()
	        .attr("d", (d,i) => { 
	      	    return this.exitArea(d.values); 
	         });
	}

	updateExitingCircles(){
		if (!this.markDataPoints){return}
		
	    this.lineChart
			.data(this.chartData, (d) => d.name )
			.exit()
			.selectAll(".tipCircle")
			.transition()
			.attr("r",0);
			
	}

	updateLines(){
	    this.lineChart.selectAll(".line")
			.data(this.chartData, (d) => d.name )
	        .transition()
	        .duration(1000)
	        .attr("d", (d,i) => { 
	      	    return this.line(d.values); 
	         });		

	}

	updateAreas(){
	    this.lineChart.selectAll(".area")
			.data(this.chartData, (d) => d.name )
	        .style("display", (d) => {
		      	if (this.chartLayout == "stackTotal" || this.chartLayout == "stackPercent" || this.chartLayout == "fillLines"){
				  	return "block";
			  	}else{return "none";}			      	
	      	})
	        .transition()
	        .duration(1000)
	        .attr("d", (d,i) => { 
	      	    return this.area(d.values); 
	         });
	}

	updateCircles(){
		if (!this.markDataPoints){return}
		
		this.lineChart
			.data(this.chartData, (d) => d.name )
	        .selectAll(".tipCircle")
	        .data( (d) => d.values )
	        .transition()
	        .duration(1000)
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
			.attr(`c${this.xOrY}`, (d,i) => this.scales.x(d[this.xValue]) )
			.attr("r", (d,i) =>  {
				if ( isNaN(d[this.dataType])){return 0;} 
				 return 5;
			});
	}
	
	updateExitCirclePoints(){
		if (!this.markDataPoints){return}
		
		this.lineChart
			.data(this.chartData, (d) => d.name )
	        .selectAll(".tipCircle")
	        .data( (d) => d.values )
	        .exit()
	        .transition()
	        .duration(1000)
		    .attr("r",0)
		    .on("end", (d,i,nodes) => {
			    d3.select(nodes[i]).remove();
		    });		
		
	}

	updateEnterCirclePoints(){
		if (!this.markDataPoints){return}
		
		this.lineChart
			.data(this.chartData, (d) => d.name )
	        .selectAll(".tipCircle")
	        .data( (d) => d.values )
	        .enter()
			.append("circle")
			.attr("class","tipCircle")
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
			.style('opacity', 1)
			.style("fill", (d) => { return this.colorScale(d.name); })//1e-6		    					 								 				
		    .attr("r",0)
	        .transition()
	        .duration(1000)
			.attr("r", (d,i) => {
				if ( isNaN(d[this.dataType])){return 0;} 
				 return 5;
			}); 		
		
	}
	
	
}

export { LineChart }
