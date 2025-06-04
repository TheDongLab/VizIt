import ReactECharts from "echarts-for-react";
import PropTypes from "prop-types";

const EChartMetaScatter = ({gene, exprData, metaData, group}) => {

    if (Object.keys(metaData).length === 0) return "Sample not found in the MetaData";

    const scatterData = Object.entries(metaData).map(([key, meta]) => {
        return [meta[group], exprData?.[key] ?? 0];
    })

    // console.log("scatterData: ", scatterData);

    const options = {
        title: {
            text: `${gene} - ${group}`,
            left: 'center',
            top: 0
        },
        xAxis: {
            name: group,
            nameLocation: 'middle',
            nameGap: 30,
            nameTextStyle: {
              fontSize: 16
            },
            splitLine: {
                show: true
            }
        },
        yAxis: {
            name: "Expression",
            nameLocation: 'middle',
            nameGap: 30,
            nameTextStyle: {
                fontSize: 16
            },
            splitLine: {
                show: true
            }
        },
        series: [
            {
                type: "scatter",
                symbolSize: 3,
                data: scatterData,
            },
        ]
    }

    return <ReactECharts
        key={`${gene}-${group}`}
        option={options}
        notMerge={true} lazyUpdate={true} theme="light"
        // showLoading={true}
        style={{width: "100%", height: "100%"}}
        autoResize={true}/>;
}

EChartMetaScatter.propTypes = {
    gene: PropTypes.string.isRequired,
    exprData: PropTypes.object.isRequired,
    metaData: PropTypes.object.isRequired,
    group: PropTypes.string.isRequired,
};

export default EChartMetaScatter

// https://www.npmjs.com/package/echarts-for-react
// https://github.com/hustcc/echarts-for-react?tab=readme-ov-file
// <ReactECharts
//     notMerge={true}
//     lazyUpdate={true}
//     theme="light"
//     // showLoading={true}
//
//     option={options}
//     style={{ width: '100%'}}
//     autoResize={true}
//     opts={{renderer: 'canvas'}} // use canvas to render the chart.
// />