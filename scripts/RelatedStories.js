import EventEmitter from 'events'
import relatedStoriesTemplate from '../templates/relatedStoriesTemplate.html'

class RelatedStories extends EventEmitter {
		
	constructor(opts){
		super();	

		this.defaults ={
			templateData:[],
			index:0,
			headerText:"Related content"
		}
		_.each(this.defaults, (item, key) => {
			this[key] = item;
		});


		this.options = opts;				
		_.each(opts, (item, key) => {
			this[key] = item;
		});

		if (this.data){
			this.getInfo(0)
		}else{
			this.headerText = "More from Reuters Graphics"
			this.fetchDataSheet();
		}
		
		return this;	
	}
	
	fetchDataSheet () {	

		$.ajax({url: "https://d3sl9l9bcxfb5q.cloudfront.net/json/mw-highlights", success: (result) => {
			this.data = []
			result.forEach((d,i) => {
				if (i < 4){
					this.data.push(d.link)
				}
				
			})

			this.getInfo(0);
		}})	
	}
	
	getInfo (index){

		let secure
		if (location.protocol === 'https:') {
		    secure = true;
		}

		let title;
		let description;
		let image
		let link = this.data[index]
		if (!secure){
			link = link.replace("https","http")
		}

		$.get(link, (page) => {
		   
		   $(page).each(function(){

			   if( $(this).attr("itemprop") == "description"){
				   description = $(this).attr("content")
			   }
			   if( $(this).attr("itemprop") == "name"){
				   title = $(this).attr("content")
			   }
			   if( $(this).attr("itemprop") == "image"){
				   image = $(this).attr("content")
					if (secure){
						if (image.indexOf("https") < 0){
							image = image.replace("http","https")							
						}

					}				   
			   }
		   
		   })
		
			this.templateData.push({
				title:title,
				description:description,
				image:image,
				link:link	
			})
			
			if (this.index == this.data.length - 1){
				this.runTemplate()
			}else{
				this.index ++
				this.getInfo(this.index);
			}
		
		
		})
		.fail( () => {
			if (this.index == this.data.length - 1){
				this.runTemplate()
			}else{
				this.index ++
				this.getInfo(this.index);
			}

		});				
	}
	
	runTemplate () {
		$(this.el).html(relatedStoriesTemplate({data:this.templateData, headerText:this.headerText}))		
	}

}

export { RelatedStories }
//POLL, TIMELINE, ANNOTATIONS, ANIMATE CHART IN