import { LineChart } from './LineChart.js'
import { BarChart } from './BarChart.js'
import { ScatterChart } from './ScatterChart.js'
import { DataStreamParse } from './DataStreamParse.js'
import { BespokeBase } from './BespokeBase.js'
import { MapCharter } from './MapCharter.js'

let ReutersCharter = {
	LineChart:LineChart,
	BarChart:BarChart,
	DataStreamParse:DataStreamParse,
	ScatterChart:ScatterChart,
	BespokeBase:BespokeBase,
	MapCharter:MapCharter
}

export default ReutersCharter
