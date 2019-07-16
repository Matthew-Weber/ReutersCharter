//PASS IN AN ARRAY OF URLS, AND IT WILL SURFACE THOSE.
//IF NO DATA PASSED IN, WHILE TAKE THE FOUR MOST RECENT STORIES FROM HOME PAGE graphics.reuters.com

// let relatedData = ["https://graphics.reuters.com/HONGKONG-EXTRADITIONS-TACTICS/0100B0790FL/index.html","https://graphics.reuters.com/HONGKONG-EXTRADITION-SIGNS/0100B0630BZ/index.html","https://graphics.reuters.com/HONGKONG-EXTRADITION-CROWDSIZE/0100B05W0BE/index.html","https://graphics.reuters.com/HONGKONG-EXTRADITION-PROTESTS/0100B01001H/index.html"]

let related = new ReutersCharter.RelatedStories({
	el: "#reutersGraphic-footer",
	//data: relatedData,
})