import { LineChart } from './LineChart.js'
import { BarChart } from './BarChart.js'
import { ScatterChart } from './ScatterChart.js'
import { DataStreamParse } from './DataStreamParse.js'
import { BespokeBase } from './BespokeBase.js'

let ReutersCharter = {
	LineChart:LineChart,
	BarChart:BarChart,
	DataStreamParse:DataStreamParse,
	ScatterChart:ScatterChart,
	BespokeBase:BespokeBase,
}

export { MapCharter } from './MapCharter.js'
export default ReutersCharter
