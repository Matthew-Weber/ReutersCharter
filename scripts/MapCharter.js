import EventEmitter from 'events'
import { mcolor } from './color.js'
let d3formatter = require("d3-format");
let d3 = Object.assign(d3formatter, require("d3-fetch"), require("d3-time-format"), require("d3-scale"), require("d3-axis"), require("d3-color"), require("d3-path"), require("d3-selection"), require("d3-selection-multi"), require("d3-shape"), require("d3-transition"), require("d3-time"), require("d3-svg-annotation"), require("d3-geo"));

import * as topojson from "topojson-client"
import textures from "textures"
import mapLegendTemplate from '../templates/mapLegendTemplate.html'
import mapTipTemplate from '../templates/mapTipTemplate.html'


class MapCharter extends EventEmitter {
		
	constructor(opts){
		super();	
		
		//object of defaults that get applied to the class			
		this.defaults = {
			projection: "mercator",
			legendTemplate:mapLegendTemplate,
			tooltipTemplate:mapTipTemplate,
			smallCountries:["Andorra", "Jersey", "Liechtenstein","Malta", "Monaco","San Marino", "Vatican City"],
			spikeLabels:["block 42", "block 44", "block 46","block 48","block 50","block 52"],
			colors:[red1,red2,red3,red4,red5,red6]
		}
		_.each(this.defaults, (item, key) => {
			this[key] = item;
		});
		
		this.options = opts;				
		_.each(opts, (item, key) => {
			this[key] = item;
		});
		//after defaults and options from charter block applied, load data
		d3.json(this.mapShapeURL).then( (mapShape) => {
			this.mapShape = mapShape;
			this.loadData();
		});

		
		
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
		this.emit("data:parsing", this)
		
		//make deep copy of data, in case using object in several charts
		this.mapData = JSON.parse(JSON.stringify(data));


		let geography = topojson.feature(this.mapShape, this.mapShape.objects[this.objectName]).features;

		geography.forEach( (d) => {
			this.mapData.forEach( (item) => {					
				if (d.id == item[this.dataIdProperty]){
					_.each(item, (value,key) => {
						d.properties[key] = value;
					});
				}					
			});		
		});

		this.data = geography;
		
		
		this.render()

		
		this.emit("data:parsed", this)
		
	}

	setOpts(){
		this.setColorScale();
		this.setSelectors()
		this.setWidthAndHeight();
		this.setHashValue();
	}
	
	setHashValue(){
		if (!this.hashValueDisplay){
			this.hashValueDisplay = this.hashValue;
		}	
	}
	
	setColorScale(){
		
		if (this.scaleType != "Threshold"){
			if (!this.columnNames){
				this.columnNames = _.uniq(_.map(this.mapData,this.colorValue))
				this.columnNamesDisplay = this.columnNames;
			}
			if (_.isObject(this.columnNames) && !_.isArray(this.columnNames)){
				this.columnNamesDisplay = _.values(this.columnNames);
				this.columnNames = _.keys(this.columnNames);
			}
			if (_.isArray(this.columnNames) && !this.columnNamesDisplay){
				this.columnNamesDisplay = this.columnNames;
			}			
	
			this.colorDomain = this.columnNames;
			this.scaleDisplay = this.columnNamesDisplay;
			
	
			if (_.isObject(this.colors) && !_.isArray(this.colors)){
				this.colorDomain = _.keys(this.colors);
				this.colorRange = _.values(this.colors);
			}
			if (_.isArray(this.colors)){
				this.colorRange = this.colors;
			}		
		}else{
			if (!this.colorRange){
				if (_.isObject(this.colors) && !_.isArray(this.colors)){
					this.colorDomain = _.keys(this.colors);
					this.colorRange = _.values(this.colors);
				}
				if (_.isArray(this.colors)){
					this.colorRange = this.colors;
					this.colorDomain = this.jenks(this.mapData.map( (d) => { 
						return +d[this.colorValue]; 
					}), this.colors.length - 1 )
					this.colorDomain.pop()
					console.log(this.colorRange, this.colorDomain)

				}		
			}

			this.scaleDisplay = [];
			this.colorDomain.forEach( (d,i) => {
				if (i == 0){
					this.scaleDisplay.push("< " +d)
					return
				}
				this.scaleDisplay.push(this.colorDomain[i-1]+" - "+d)
			})
			this.scaleDisplay.push("> "+this.colorDomain[this.colorDomain.length - 1])
		}
				
		this.colorScale= d3[`scale${this.scaleType}`]()
			.domain(this.colorDomain)
			.range(this.colorRange);
		
		
	}
	
	setSelectors(){
		this.$el = $(this.el);
		this.targetDiv = this.$el.attr("id");
		this.graphicDiv = this.targetDiv+"graphic";
	}
	
	setWidthAndHeight(){
		this.width = $(this.el).width();
		this.height = this.width * this.heightModifier;

	}
	
	render (){
		this.emit("chart:rendering", this)		
		this.setOpts();
		this.renderTemplate();
		this.renderSVG();
		this.renderProjection();
		this.renderPath();
		this.renderG();
		this.renderMap();
		this.renderMapLabels();
		this.renderTooltips();
		
		this.emit("chart:rendered", this)		

		$(window).on("resize", _.debounce( (event) => {
			let width = this.$el.width();
			if (width == this.masterWidth){
				return;
			}
			this.masterWidth = width;
			this.update();
		},100));		
		
	}
	
	renderTemplate(){
		this.$el.html(this.legendTemplate({data:this.data,  self:this}));	
	}
	
	renderSVG(){
		this.svg = d3.select("#"+this.graphicDiv).append("svg")
		    .attrs({
			    "width":this.width,
			    height:this.height
			    })
		
	}
	
	renderProjection(){
		this.project = d3[`geo${this.projection}`]()
		    .center(this.center)
		    .rotate(this.rotate)
		    .scale(this.width*this.scaleModifier)
			.translate([this.width / 2, this.height / 2])
			.precision(0);
	}
	
	renderPath(){
		this.path = d3.geoPath()
			.projection(this.project);
		
	}
	
	renderG(){
		this.map = this.svg.append("g")
	        .attr("class", "map");
		
	}
	
	renderMap(){
		this.map.selectAll("path")
			.data(this.data)
	    	.enter()
			.append("path")
	    	.attr("d", this.path)
	    	.attr("class", "geography")
    		.attr("fill", (d) => {
				return this.geographyFill(d);
    		})
    		.attr("title", (d) => {
	    		return this.tooltipTemplate({d:d, self:this});
    		});
		
	}
	
	renderMapLabels(){
		this.mapLabels = this.map.append("g")
			.attr("id", "mapLabels")
			.selectAll(".geographyLabel")
		    .data(this.data)
			.enter().append("text")
		    .attr("class","geographyLabel")
		    .attr("transform", (d) => { return `translate(${this.path.centroid(d)})`; })
			.attr("dx", (d) => {
				if (this.mapShapeURL.indexOf("us-simple") > -1){return d.properties.dx;}
				if (d.properties.dx){return d.properties.dx * this.width;}				
			})	
			.attr("dy", (d) => {
				if (this.mapShapeURL.indexOf("us-simple") > -1){return d.properties.dy;}
				if (d.properties.dy){return d.properties.dy * this.width;}
				return 0;
			})	
		    .text((d,i) => { 
				if (this.spikeLabels.indexOf(d.properties.RefName) > -1){return;}

			    if (d.properties[this.labelColumn] == "District of Columbia"){ 
				    if (i == 51){ return "D.C.";}else{return "";}
			    }
			    return d.properties[this.labelColumn]; 
			})
			.classed("left-align", (d) => {
	    		if (this.smallCountries.indexOf(d.properties.displaynam) >-1){
		    		return true;
	    		}
    		});		
		
	}
	
	renderTooltips(){
		this.$('.geography').tooltip({
            html: true, 
            constraints: [
                {
                  to:'window',
                  attachment:"together",
                  pin: true
                }
              ]
        });
	}
	
	geographyFill(d){
		let strokecolor = d3.rgb(this.colorScale(d.properties[this.colorValue])).darker(0.8);
		this.t = textures.lines().size(7).stroke(strokecolor).background(this.colorScale(d.properties[this.colorValue]));
		
		this.svg.call(this.t);

		if (d.properties[this.hashValue]){
			return this.t.url();	
		}

		if (!d.properties[this.colorValue]){return gray1}

		return 	this.colorScale(d.properties[this.colorValue]);

		
	}
	
	update(){
		this.emit("chart:updating", this)
		
		this.setWidthAndHeight();
		this.updateSVG();
		this.updateProjection();
		this.updatePath();
		this.updateMap();
		this.updateLables();
		
		this.emit("chart:updated", this)
	}
	
	updateSVG(){
		this.svg
			.transition()
			.duration(1000)
		    .attr("width", this.width)
		    .attr("height", this.height);
		
	}

	updateProjection(){
		this.project
			.scale(this.width*this.scaleModifier)
			.translate([this.width / 2, this.height / 2]);
		
	}
	
	updatePath(){
	    this.path = d3.geoPath()
	    	.projection(this.project);
			
	}
	
	
	updateMap(){
		this.map
		    .selectAll("path")
		    .transition()
			.duration(1000)
	    	.attr("d", this.path);				
	}
	
	updateLables(){
		this.mapLabels
			.transition()
			.duration(1000)
		    .attr("transform", (d) => { return `translate(${this.path.centroid(d)})` })
			.attr("dx", (d) => {
				if (this.mapShapeURL.indexOf("us-simple") > -1){return d.properties.dx;}
				if (d.properties.dx){return d.properties.dx * this.width;}				
			})	
			.attr("dy", (d) => {
				if (this.mapShapeURL.indexOf("us-simple") > -1){return d.properties.dy;}
				if (d.properties.dy){return d.properties.dy * this.width;}
				return 0;
			});
		
		
	}
	
	jenksMatrices (data, n_classes) {
		var lower_class_limits = [],
        variance_combinations = [],
        i, j,
        variance = 0;


		for (i = 0; i < data.length + 1; i++) {
			var tmp1 = [], tmp2 = [];
			for (j = 0; j < n_classes + 1; j++) {
				tmp1.push(0);
				tmp2.push(0);
            }
			lower_class_limits.push(tmp1);
			variance_combinations.push(tmp2);
        }
		for (i = 1; i < n_classes + 1; i++) {
            lower_class_limits[1][i] = 1;
            variance_combinations[1][i] = 0;
			for (j = 2; j < data.length + 1; j++) {
                variance_combinations[j][i] = Infinity;
            }
        }
		for (var l = 2; l < data.length + 1; l++) {

			var sum = 0, 
	        sum_squares = 0,
	        w = 0,
	        i4 = 0;
			for (var m = 1; m < l + 1; m++) {
				var lower_class_limit = l - m + 1,
	            val = data[lower_class_limit - 1];
	            w++;
	            sum += val;
	            sum_squares += val * val;
	            variance = sum_squares - (sum * sum) / w;
	            i4 = lower_class_limit - 1;
				if (i4 !== 0) {
					for (j = 2; j < n_classes + 1; j++) {
						if (variance_combinations[l][j] >=
	                        (variance + variance_combinations[i4][j - 1])) {
	                            lower_class_limits[l][j] = lower_class_limit;
	                            variance_combinations[l][j] = variance +
	                                variance_combinations[i4][j - 1];
	                        }
	                    }
	                }
	        }
            lower_class_limits[l][1] = 1;
            variance_combinations[l][1] = variance;
        }
		return {
            lower_class_limits: lower_class_limits,
            variance_combinations: variance_combinations
        };
    }
    
	jenks (data, n_classes) {
        data = data.slice().sort(function (a, b) { return a - b; });
		var matrices = this.jenksMatrices(data, n_classes),
        lower_class_limits = matrices.lower_class_limits,
        k = data.length - 1,
        kclass = [],
        countNum = n_classes;
        kclass[n_classes] = data[data.length - 1];
        kclass[0] = data[0];
		while (countNum > 1) {
            kclass[countNum - 1] = data[lower_class_limits[k][countNum] - 2];
            k = lower_class_limits[k][countNum] - 1;
            countNum--;
        }
		return kclass;
    }	
	
	
	

}

export { MapCharter }
//POLL, TIMELINE, ANNOTATIONS, ANIMATE CHART IN