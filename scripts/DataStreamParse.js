const EventEmitter = require('events');        


class DataStreamParse extends EventEmitter {
		
	constructor(opts){
		super();		
		this.defaults = {
			data:undefined,
			dataSeries:undefined,
			lookup:{}
		}
		_.each(this.defaults, (item, key) => {
			this[key] = item;
		});
		
		this.options = opts;				
		_.each(opts, (item, key) => {
			this[key] = item;
		});
		//bring in all the options, run parse data.
		return this.parseData(this.data);				
		
		

	}
	
	parseData (data) { 
		data = JSON.parse(JSON.stringify(data));
		this.rawData = data;
		this.emit("data:parsing", this)
		//determine if is a single repsonse, or a bundle.  And run the format data for each.
		if (this.rawData.DataResponses){
			this.formattedData = {}
			this.rawData.DataResponses.forEach( (response, index) => {
				this.formattedData["series"+index] = this.formatData(response)			    	
			})				
		}
	
		if (this.rawData.DataResponse){
			this.formattedData = this.formatData(this.rawData.DataResponse)
		}
		
		this.emit("data:parsed", this)		
		//return either all of the data, or if there is a dataSeries user wants, just that dataSeries.
		if (this.dataSeries || this.dataSeries === 0){
			return this.formattedData[`series${this.dataSeries}`]
		}
		return this.formattedData;
	}
	
	formatData (response){
		this.emit("data:formatting", this)
		
		let newArray = []
		
		response.Dates.forEach( (d,i) => {					
			let obj={}

			let newDate = d.replace(/\//g, '').replace('Date(','').replace(')','').replace('+0000','')
			let date = new Date(+newDate)
			let betterDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000)
			let formatDate = (betterDate.getMonth()+1)+"/"+betterDate.getDate()+"/"+betterDate.getFullYear()

			obj.date = formatDate
			response.DataTypeValues[0].SymbolValues.forEach( (item,index) => {
				let name = response.DataTypeValues[0].SymbolValues[index].Symbol;					
				let values = response.DataTypeValues[0].SymbolValues[index].Value

				if (this.lookup[name]){
					name = this.lookup[name]
				}

				if (_.isArray(values)){
					obj[name] = values[i];								
				}else{
					obj.values = obj.values || []

					let newObj = {
						category:name,
						value:values
					}
					obj.values.push(newObj)
				}
			})
			
			if (obj.values){
				newArray = obj.values;
			}else{
				newArray.push(obj)							
			}
			
		})
		return newArray

		this.emit("data:formatted", this)

	}		

	
}

export { DataStreamParse }