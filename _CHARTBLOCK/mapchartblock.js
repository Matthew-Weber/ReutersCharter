import MapCharter from "ReutersCharter-MapCharter"


	//US MAP
	let map = new MapCharter({
		el: "#reutersGraphic-chart1",
		mapShapeURL: "//graphics.thomsonreuters.com/mapshapes/us-simple.json",
		dataURL:"data/mapdata.csv",
		projection: "Mercator",
		objectName:"states",
		dataIdProperty:"fips",
		labelColumn:"STATEAP",
		center:[ -98.5561,37.8106],
		rotate:[-2.0,0],
		scaleModifier:.95,
		heightModifier:.59,
//		legendTemplate:Reuters.Graphics.Template.maplegend,
//		tooltipTemplate:Reuters.Graphics.Template.maptooltip,
		scaleType:"Threshold", // can be Ordinal
		colorValue:"numbers",		

		//FOR ORDINAL SCALES
		//columnNames:{Y:gettext("Google"), N:gettext("Apple")}, // object or array, values are values from property set in colorValue
		//colors: {Y:red5, N:green2},  //array or mapped object
		//columnNamesDisplay:[gettext("Bob"),gettext("Jerry")], // only use this if you are using an array for columnNames		
		
		//FOR THRESHOLD SCALES - NEED ONE MORE COLOR THAN VALUES. 
		//IF YOU DON'T SET DOMAIN AND RANGE, IT WILL USE JENKS BREAKS, TO LET YOU SEE YOUR DATA, BASED ON DEFAULT COLOR SCALE.
		//colorDomain:[2,3,6,10,18,25],
		//colorRange:[red1,red2,red3,red4,red5,red6,blue5],

		
		//tipValuesDisplay:{tasers:"Has tasers",numbers:"Number of tasers"}, 		
		//hashValue:"hash",
		//hashValueDisplay:"Allows Force"
	
	}); 
	
	
	//EUROPE MAP
	let europemap = new MapCharter({
		el: "#reuters-map",
		mapShapeURL: "//graphics.thomsonreuters.com/mapshapes/europe.json",
		dataURL:"//d3sl9l9bcxfb5q.cloudfront.net/json/cc_scotus_abortion_map_county",
		projection: "Mercator",
		objectName:"countries",
		dataIdProperty:"iso",
		labelColumn:"displaynam",
		center:[15.75, 55.75],
		rotate:[-1.4,0],
		scaleModifier:1,
		heightModifier:1.25,
		
//		legendTemplate:maplegend,
//		tooltipTemplate:maptooltip,
		scaleType:"Threshold", // can be Ordinal
		colorValue:"numbers",		

		//FOR ORDINAL SCALES
		//columnNames:{Y:gettext("Google"), N:gettext("Apple")}, // object or array, values are values from property set in colorValue
		//colors: {Y:red5, N:green2},  //array or mapped object
		//columnNamesDisplay:[gettext("Bob"),gettext("Jerry")], // only use this if you are using an array for columnNames		
		
		//FOR THRESHOLD SCALES - NEED ONE MORE COLOR THAN VALUES. 
		//IF YOU DON'T SET DOMAIN AND RANGE, IT WILL USE JENKS BREAKS, TO LET YOU SEE YOUR DATA, BASED ON DEFAULT COLOR SCALE.
		//colorDomain:[2,3,6,10,18,25],
		//colorRange:[red1,red2,red3,red4,red5,red6,blue5],

		
		//tipValuesDisplay:{tasers:"Has tasers",numbers:"Number of tasers"}, 		
		//hashValue:"hash",
		//hashValueDisplay:"Allows Force"	
	}); 


	//WORLD MAP
	letworldMap = new MapCharter({
		el: "#reuters-map",
		mapShapeURL: "//graphics.thomsonreuters.com/mapshapes/world.json",
		dataURL:"//d3sl9l9bcxfb5q.cloudfront.net/json/cc_zika_world",
		projection: "Mercator",
		objectName:"countries",
		dataIdProperty:"colorid",
		labelColumn:"displaynam",
		center:[ 1,30],
		rotate:[-1.4,0],
		scaleModifier:.16,
		heightModifier:.6,
//		legendTemplate:maplegend,
//		tooltipTemplate:maptooltip,
		scaleType:"Threshold", // Can be Ordinal
		colorValue:"numbers",		

		//FOR ORDINAL SCALES
		//columnNames:{Y:gettext("Google"), N:gettext("Apple")}, // object or array, values are values from property set in colorValue
		//colors: {Y:red5, N:green2},  //array or mapped object
		//columnNamesDisplay:[gettext("Bob"),gettext("Jerry")], // only use this if you are using an array for columnNames		
		
		//FOR THRESHOLD SCALES - NEED ONE MORE COLOR THAN VALUES. 
		//IF YOU DON'T SET DOMAIN AND RANGE, IT WILL USE JENKS BREAKS, TO LET YOU SEE YOUR DATA, BASED ON DEFAULT COLOR SCALE.
		//colorDomain:[2,3,6,10,18,25],
		//colorRange:[red1,red2,red3,red4,red5,red6,blue5],

		
		//tipValuesDisplay:{tasers:"Has tasers",numbers:"Number of tasers"}, 		
		//hashValue:"hash",
		//hashValueDisplay:"Allows Force"

		
	}); 
	