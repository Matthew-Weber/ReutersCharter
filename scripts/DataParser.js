const EventEmitter = require('events');        
const d3 = Object.assign({}, require("d3-fetch"), require("d3-time-format"), require("d3-scale"), require("d3-axis"), require("d3-color"), require("d3-format"), require("d3-path"), require("d3-selection"), require("d3-shape"), require("d3-transition"));

class DataParser extends EventEmitter {
		
	constructor(opts){
		super();
		//defaults		
		this.defaults = {
			data:undefined,
			dateFormat: d3.timeFormat("%b %Y"),
			dateParse:	d3.timeParse("%d/%m/%y"),
			chartType:undefined,
			xValue:"date",
			yValue:"value",
			columnNames:undefined,
			columnNamesDisplay:undefined,
			divisor:1,
			categorySort:"none",
			groupSort:"ascending",
			dataType:"value"											
		}
		//apply defaults
		_.each(this.defaults, (item, key) => {
			this[key] = item;
		});
		
		//apply options
		this.options = opts;				
		_.each(opts, (item, key) => {
			this[key] = item;
		});
		
		//if this is not creating the initial data, and is only resorting the data because elements have been removed, then just run the resort
		if (this.resorting){
			return this.reSort(this.data);
		}
		return this.parseDataPoint(this.data);				
		
		

	}
	
	parseDataPoint (data) { 
		this.emit("data:parsing", this)
		
		//loop through and parse the date, try to parse all other values into numbers
		data.forEach( (point,index) => {
			if (point.date){
				point.rawDate = point.date;
				point.date = this.dateParse(point.date);
				point.displayDate = this.dateFormat(point.date);
			}
			//will parse all the numbers into numbers
			_.each(point, (value,key) => {
				if ( !isNaN( parseFloat(value) )  && key != "rawDate" && key != "date" && key != "displayDate" && key != "category"){
					point[key] = parseFloat(value);
				}
			})
			point.uniqueid = index;
			point.visible = true;

		})

		this.emit("data:parsed", this)		
		return this.sortData(data);
	}
	

	sortData(data){
		this.emit("data:sorting", this)
		
		//Sort for items in series will attempt to be via Xvalue.  (what order does the line connect in?)
		if (this.xValue != "category" && this.xValueSort != "none"){
			data.sort( (a,b) => {
				if (a[this.xValue] < b[this.xValue]){return -1}
				if (a[this.xValue] > b[this.xValue]){return 1}
				return 0	
			})
		}
						
		this.emit("data:sorted", this)		
		
		//scatter charts do not have to be setup into series.
		if (this.chartType == "line" || this.chartType == "bar"){
			return this.reGroupData(data)
		}
		if (this.categorySort != "none"){
			return this.simpleCatSort(data)
		}
		return data
	}
	
	reGroupData(data){
		this.emit("data:reGrouping", this)
		
		//set data up into array of arrays of values.
		let groupedData = this.columnNames.map( (key,i) => {
			return {
				name:key, 
				displayName:this.columnNamesDisplay[i],
				visible:true, 
				values:data.map( (dataPoint,index) => {
					let obj = {}
					_.each(dataPoint, (item,key) => {
						obj[key] = item;
					})
					obj.value = parseFloat(dataPoint[key]) / this.divisor;
					obj.name = key;
					return obj
				})
			}
		})

				
		this.emit("data:reGrouped", this)		
		
		return this.calculateTransofmations(groupedData)		
		
	}

	calculateTransofmations(data){
		
		if (this.xValue == "category"){
			if (this.dataType != "value"){console.log("DATA TRANSFORMATIONS ARE NOT AVAILABLE FOR CATEGORY CHARTS.")}
			data.forEach( (dataGroup) => {
				dataGroup.values.forEach( (currentItemInLoop,index) => {
					let currentValue = currentItemInLoop.value; 
					currentItemInLoop.changePrePeriod = currentValue;
					currentItemInLoop.cumulativeTotal = currentValue;
					currentItemInLoop.cumulativeChange = currentValue;
					currentItemInLoop.percentChange = currentValue;			
				})
			})
			return this.categorySorter(data)

		}
		//if not a category chart, will calculate out all the data transofrmation. 
		this.emit("data:calculatingTransofmations", this)
		//matt test this with lots of other data sets and holes.
		data.forEach( (dataGroup) => {
			let name = dataGroup.name;
			let firstItem = dataGroup.values[0];
			let firstValue = firstItem.value;
			let totalChange = 0;
			let cumulate = 0;
			
			dataGroup.values.forEach( (currentItemInLoop,index) => {
				let previousItem = dataGroup.values[index - 1];
				let currentValue = currentItemInLoop.value; 

				if (index > 0){
					let previousValue = previousItem.value;
					if (isNaN(previousValue)){
						previousValue = currentValue;
					}
					
					let change = currentValue - previousValue;
					totalChange += change;
					cumulate += currentValue;
					let percent = ((currentValue / firstValue) - 1) * 100;
					currentItemInLoop.changePrePeriod = change;
					currentItemInLoop.cumulativeTotal = cumulate;
					currentItemInLoop.cumulativeChange = totalChange;
					currentItemInLoop.percentChange = percent;
					//currentItemInLoop.value = currentValue / this.divisor;
				}else{
					currentItemInLoop.changePrePeriod = 0;
					currentItemInLoop.cumulativeTotal = currentValue;
					currentItemInLoop.cumulativeChange = 0;
					currentItemInLoop.percentChange = 0;
					//currentItemInLoop.value = currentValue / this.divisor;
					cumulate += currentValue;
				}
			})			
		})

		
		this.emit("data:calculatingTransofmations", this)


		
		return this.makeStacks(this.groupSorter(data));		
		
	}
	
	simpleCatSort(data){

			let plusMinus = 1;
			let sortValue = this.xValue;
			if (sortValue == "category"){
				sortValue = this.yValue;
			}
			if (this.categorySort == "descending"){plusMinus = -1}
			if (this.categorySort == "alphabetical"){sortValue = "category"; plusMinus = -1}

			//sort each of the values arrays first, but now they are not going to match
			data.sort( (a,b) => {
					if (a[sortValue] > b[sortValue]){return 1 * plusMinus}
					if (a[sortValue] < b[sortValue]){return -1 * plusMinus}
					return 0;
			})
			if (!Array.isArray(this.categorySort)){
				this.categorySort = [];
				data.forEach( (d) => {
					this.categorySort.push(d.category);
				});
			}
			data.sort( (a,b) => {
					let aValue = this.categorySort.indexOf(a.category);
					let bValue = this.categorySort.indexOf(b.category);
					if (aValue > bValue){return 1}
					if (aValue < bValue){return -1}
					return 0;
				})
				
				return data				
					
	}
	
	categorySorter(data){
		
		this.emit("data:sortingCategories", this)
		
		//if a category chart, have to sort the categories.
		if (this.categorySort != "none"){			
			let plusMinus = 1;
			let sortValue = "value"
			if (this.categorySort == "descending"){plusMinus = -1}
			if (this.categorySort == "alphabetical"){sortValue = "category"}

			//sort each of the values arrays first, but now they are not going to match
			data.forEach( (dataGroup) => {				
				dataGroup.values.sort( (a,b) => {
					if (a[sortValue] > b[sortValue]){return 1 * plusMinus}
					if (a[sortValue] < b[sortValue]){return -1 * plusMinus}
					return 0;
				})				
			})
			
			//the categories are preliminarily sorted, which means we can sort the groups now.  After groups sorted, we will RESORT the categories to match across each set.
			data = this.groupSorter(data);

			//determine at this point, if you want an explicit array, if not base array on last group 			
			if (!Array.isArray(this.categorySort)){
				this.categorySort = [];
				data[data.length-1].values.forEach( (d) => {
					this.categorySort.push(d.category);
				});
			}
			
			//sort all of them to match the newly created specific array.
			data.forEach( (dataGroup) => {				
				dataGroup.values.sort( (a,b) => {
					let aValue = this.categorySort.indexOf(a.category);
					let bValue = this.categorySort.indexOf(b.category);
					if (aValue > bValue){return 1}
					if (aValue < bValue){return -1}
					return 0;
				})				
			})						


		}else{
			data = this.groupSorter(data);			
		}
		this.emit("data:categoriesSorted", this)
		

		return this.makeStacks(data)
	}
	
	groupSorter (data){
		
		this.emit("data:sortingGroups", this)

		//sort the groups.  use a negative multiplier to determine whether ascending or descending.  
		let plusMinus = 1;
		if (this.groupSort == "descending"){plusMinus = -1}
		if (this.groupSort == "none"){return data}
		
		data.sort( (a,b) => {

			let aValue = a.values[a.values.length - 1][this.dataType];
			let bValue = b.values[b.values.length - 1][this.dataType];
			//check if user asking for specific sort
			if (Array.isArray(this.groupSort)){
				aValue = this.groupSort.indexOf(a.name);
				bValue = this.groupSort.indexOf(b.name);			
			}

			if (!a.visible){
				aValue = -1 * plusMinus;
			}
			if (!b.visible){
				bValue = -1 * plusMinus;
			}
			
			if (aValue > bValue){return 1 * plusMinus}
			if (aValue < bValue){return -1 * plusMinus}
			return 0;
		})
		
		this.emit("data:GroupsSorted", this)

		return data
	}
	
	makeStacks(data){
		
		let filtered = data.filter( (d) => {
			return d.visible
		})
		
		filtered.forEach( (eachGroup, indexofKey) => {
			let name = eachGroup.name;

			eachGroup.values.forEach( (d,i) => {
				let masterPositive = 0;
				let masterNegative = 0;
				let stackTotal = 0;
				let masterPercent = 0;
				let stackMin = 0;
				let thisValue = d[this.dataType]; 
				let counter;

				filtered.forEach( (collection,counter) => {
					let loopNmae = collection.name;
					let currentValue = collection.values[i][this.dataType];
					if (currentValue >=0) {
						stackTotal = stackTotal + currentValue;
					}else{
						stackMin = stackMin + currentValue;							
					}
				})


				for (counter = indexofKey; counter< filtered.length; counter++){					
					let loopName = filtered[counter].name;
					let currentValue = filtered[counter].values[i][this.dataType];
					if ( currentValue > 0){	
						masterPositive = masterPositive + currentValue;
						masterPercent = masterPercent + (currentValue/stackTotal)*100;
					}else{						
						masterNegative = masterNegative + currentValue;
					}
				}							
				let y0Total = masterPositive - thisValue;
				let y1Total = masterPositive;
				if (thisValue < 0){
					y0Total = masterNegative - thisValue;
					y1Total = masterNegative;
				}									
				_.extend(d, {
					y0Total:y0Total, 
					y1Total:y1Total, 
					stackTotal:stackTotal, 
					stackMin:stackMin, 
					y0Percent:masterPercent-((thisValue/stackTotal)*100), 
					y1Percent:masterPercent
				})
			})
		})
		
		return data
	}
	
	reSort(data){
		if (this.xValue == "category"){
			return this.categorySorter(data)
		}else{
			return this.makeStacks(this.groupSorter(data))
		}		
	}
		

	
}

export { DataParser }