import { LineChart } from './LineChart.js'
import { BarChart } from './BarChart.js'
import { ScatterChart } from './ScatterChart.js'
import { DataStreamParse } from './DataStreamParse.js'
import { BespokeBase } from './BespokeBase.js'
import { RelatedStories } from './RelatedStories.js'

let ReutersCharter = {
	LineChart:LineChart,
	BarChart:BarChart,
	DataStreamParse:DataStreamParse,
	ScatterChart:ScatterChart,
	BespokeBase:BespokeBase,
	RelatedStories:RelatedStories
}

//export { MapCharter } from './MapCharter.js'
export default ReutersCharter
