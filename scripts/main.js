import { GraphicUtils } from './GraphicUtils.js' //always import
import 'bootstrap'; //always import, removing will mess up navigation in the header bar.
import { ReutersPym } from './ReutersPym.js' //always import, unless DEFNITELY NOT embedable. test if pym active with pymObject.hasPym
let pymObject = new ReutersPym();

//import { ReutersUtils } from './utils.js' //Import if using extra things from Investigates. These can be handy.
//let srepUtils = new ReutersUtils();

//import * as d3 from "d3";
let formatter = require("d3-format")
let d3 = Object.assign(formatter, require("d3-fetch"), require("d3-time-format"));

// require("waypoints/lib/jquery.waypoints.js")

//specifically require the templates you want.
import basicChartLayout from '../templates/basicChartLayout.html'
$(".main").html(basicChartLayout({data:"this is the data"}))


//import ReutersCharter from "ReutersCharter"
import { ScatterChart } from './ScatterChart.js'
import { LineChart } from './LineChart.js'
import { BespokeChart } from './BespokeChart.js'



/*
let stockChart = new LineChart({
	el: "#reutersGraphic-chart1",
	hasPym: pymObject.hasPym,
	dataURL: 'data/1timeseries.csv',
	height:220,
	//yorient:"Right",
	//xorient:"Top",	
	//horizontal:true,
	yAxisLineLength:"long",
	//xAxisLineLength:"long",
	//chartLayout:"sideBySide",
	//annotations:annotations,
	//multiDataColumns:["value","percentChange"]
		
})
*/

import { annotations } from './annotations'

let stockChart = new ScatterChart({
	el: "#reutersGraphic-chart1",
	hasPym: pymObject.hasPym,
	
	////////////////////////////
	///// DATA PROCESSING //////
	////////////////////////////
	
	dataURL: '//d3sl9l9bcxfb5q.cloudfront.net/json/mw-disney-earns',
	dataURL: 'data/circledata.csv',
	//dataTransformation:"none", //none, changePrePeriod, cumulatitveTotal, cumulativeChange, percentChange
	//divisor:.001,	
	//multiDataColumns:{"gpd":"GDP","unemployment":"Unemployment"}, //can set as an object, or as two arrays below.
	//multiDataColumns:["gpd","unemployment"],//can use value, changePrePeriod, cumulatitveTotal, cumulativeChange, percentChange
	//multiDataLabels:[gettext("VALUE"),gettext("PERCENT")],
	//xValue:'google', //for scatter plots, or two linear scales of line charts.
	//yValue:'date',
	//xValueSort:"none", //will not sort bespoke xValues

	///////////////////////////////////
	///// COLOR AND WHAT TO PLOT //////
	///////////////////////////////////

	//columnNames:{google:gettext("Google"), apple:gettext("Apple")}, // undefined uses sheet headers, object will map, array matches columnNamesDisplay
	//colors: [blue3, purple3,orange3, red3,yellow3],  //array or mapped object
	//columnNamesDisplay:[gettext("Bob"),gettext("Jerry")], // only use this if you are using an array for columnNames

	///////////////////////////////////
	///// CHART DIMENSIONS       //////
	///////////////////////////////////

	//margin:{top:100},
	height:220, //if < 10 - ratio , if over 10 - hard height.  undefined - square

	///////////////////////////////////
	///// AXIS AND TICKS         //////
	///////////////////////////////////
	
	//YTickLabel: [[gettext("$"),gettext("cows")]], //  \u00A0  - use that code for a space.
	//xScaleTicks: 5,
	//yScaleTicks:5,
	//yScaleVals: [0,100],
	//xScaleVals: [parseDate("1/1/16"),parseDate("6/1/16"),parseDate("1/1/17")],	
	//tickAll:true,
	//yorient:"Right",
	//xorient:"Top",
	//yTickFormat (d,i,nodes) {
	//	return d
    //},    
	//xTickFormat  (d,i,nodes)  {
	//	return d
    //},	
    //includeXAxis:false,
    //includeYAxis:false,
	//xAxisLineLength:"short", //long or short. long will go all the way across, but not under the tick numbers
	//yAxisLineLength:"short",				
    	

	///////////////////////////////////
	///// SORTING                //////
	///////////////////////////////////
	
	//categorySort:"none", //ascending, descending, alphabetical, none, array
	//groupSort:"descending", //ascending, descending,  none, array IF NONE: will match order of column names above. if those undefined, will be order in data.

	///////////////////////////////////
	///// DATE PARSE AND FORMAT  //////
	///////////////////////////////////

	//dateFormat:d3.timeFormat("%b %Y"),
	//dateParse:d3.timeParse("%d/%m/%y"),
	//quarterFormat:true,					

	///////////////////////////////////
	///// CHARTING OPTIONS       //////
	///////////////////////////////////

	//colorUpDown:true,
	//hashAfterDate:"01/01/2016",
	//markDataPoints:true,
	//lineType: "linear",//Step, StepAfter, StepBefore
	//hasRecessions: true,	
	
	///////////////////////////////////
	///// LEGEND                 //////
	///////////////////////////////////
	
	//hasLegend: false,
	//topLegend:true,
	chartBreakPoint:800, //when do you want the legend to go up top
	//navSpacer:true,

	///////////////////////////////////
	///// LAYOUT                 //////
	///////////////////////////////////
	
	//horizontal:true,
	//chartLayout:"sideBySide", // basic,stackTotal, stackPercent, fillLines, sideBySide, onTopOf, outlineBar
	//chartLayoutLabels:["basic", "sideBySide"], //define this, and buttons appear
	//animateOnScroll:true,

	///////////////////////////////////
	///// TOOLTIP                //////
	///////////////////////////////////

	//showTip:"off",	//tip will come on if no legend.  tip will come on if showTip:true. Tip will not come on at all if showTip:"off"
	//showZeros:true, //tooltip will not skip over zero values
	//tipNumbFormat (d)  {		
	//	if (isNaN(d) === true){return "N/A";}else{
	//		return this.dataLabels[0] + this.numbFormat(d) + " " + this.dataLabels[1] ;				
	//	}				
	//},
	//numbFormat: d3.format(",.2f"),

	///////////////////////////////////
	///// TEMPLATES              //////
	///////////////////////////////////

	//tipTemplate:Reuters.Graphics.Template.tooltip,
	//chartTemplate:Reuters.Graphics.Template.chartTemplate,
	//legendTemplate: Reuters.Graphics.Template.legendTemplate,
	//timelineTemplate:Reuters.Graphics.Template.tooltipTimeline,	

	///////////////////////////////////
	///// DATASTREAM             //////
	///////////////////////////////////

	//dataStreamOpts:{
	//	dataSeries:3,
	//	lookup:{
	//		"PCHV#(GOLDUSD,YTD)":gettext("Gold"),
	//		"(1/(JAPAYE$))":gettext("another thing")
	//	}					
	//}
	
	/////////////////////////
	///// POLLING     //////
	////////////////////////
	//IF HORIZONTAL BAR, REQUIRES YOU SET COLUMN NAME AND COLOR AS OBJECT
	//isPoll:true,
	//moeColumn:"ci",
	//leftBarCol:"contact",
	//rightBarCol:"leaks",
	//centerCol:"dk",
	
	//annotationNotePadding:15,
	//annotationDebug:false,
	//annotations:annotations,

	/////////////////////////
	///// scatter     //////
	////////////////////////
	//idField:"id",
	//colorValue:"colors",
	//hardRadius:10,
	//radiusModifier:40,
	//rValue:"circlesize",
	//xValue:'google', 
	//yValue:'apple',
	//scaleLabels:{
	//	x:"Inflation",
	//	y:"Unemployment"
	//}
	// how you want these field displayed, "none" turns them off, can also turn off date:"none",category:"none",colorValue:"none"
	//tipValuesDisplay:{rValue:"GDP",xValue:"Range",yValue:"Price"}, 
	//hasLegend:"off", //legend will appear if you have a color value, you can force it off if you so desire.
})

stockChart.on("data:parsed", ()=>{
	//console.log(stockChart.colors)
})









/*
import { DataStreamParse } from './DataStreamParse.js'

d3.json("//graphics.reuters.com/COMMODITIES-METALS/0100317Z2RY/assetperformance.json").then( (data) => {
		
	let commodData = new DataStreamParse({data:data})
	console.log(commodData);

	const dataStreamData = new DataStreamParse({
		data:data,
		dataSeries:3,
		lookup:{
			"PCHV#(GOLDUSD,YTD)":gettext("Gold"),
			"(1/(JAPAYE$))":gettext("another thing")
		}
	})
	
	console.log(dataStreamData)

})
*/














