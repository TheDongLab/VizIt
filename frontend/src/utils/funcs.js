export function isCategorical(arr, uniqueThreshold = 30) {
    // ======================
    // // Example usage:
    // const categoricalData = [1, 2, 1, 2, 3, 3, 3]; // Few unique integers
    // const continuousData = [1.1, 2.3, 3.5, 4.7];    // Decimal values
    // const stringData = ["red", "blue", "green"];     // Non-numeric
    //
    // console.log(isCategorical(categoricalData)); // true
    // console.log(isCategorical(continuousData));  // false
    // console.log(isCategorical(stringData));      // true
    // ======================

    // Edge case: Empty array
    if (arr.length === 0) return true;

    // Edge case: Single value
    if (arr.length === 1) return true;

    // Edge case: All values are the same
    if (arr.every(x => x === arr[0])) return true;

    // Check if all values are non-numeric
    const allNonNumeric = arr.every(x => typeof x !== 'number');
    if (allNonNumeric) return true; // Definitely categorical

    const hasStrings = arr.some(x => typeof x === 'string');
    if (hasStrings) return true;

    // Check unique values for numeric arrays
    const uniqueValues = new Set(arr).size;
    let isFewUniques = false
    if (uniqueThreshold < 1) {
        isFewUniques = uniqueValues / arr.length <= uniqueThreshold;
    } else {
        isFewUniques = uniqueValues <= uniqueThreshold;
    }

    // Check if values are integers (common for categorical data)
    const allIntegers = arr.every(x => Number.isInteger(x));

    return isFewUniques && allIntegers;
}


// Safe calculation for min/max
export const calculateMinMax = (arr) => {
    if (arr.length === 0) return [0, 0];

    let min = Infinity;
    let max = -Infinity;

    for (const val of arr) {
        if (typeof val === 'number' && !isNaN(val)) {
            if (val < min) min = val;
            if (val > max) max = val;
        }
    }

    return [min === Infinity ? 0 : min, max === -Infinity ? 0 : max];
};


export function sortObjectByKey(object) {
    const sortedKeys = Object.keys(object).sort();
    const sortedObject = {};
    sortedKeys.forEach(key => {
        sortedObject[key] = object[key];
    });
    return sortedObject;
}

export function transformSplitFormat(splitData) {
    // Input:
    // {
    //   "index": ["row1", "row2"],
    //   "columns": ["col1", "col2"],
    //   "data": [[1, 0.5], [2, 0.75]]
    // }

    // Output:
    // {
    //   "row1": { "col1": 1, "col2": 0.5 },
    //   "row2": { "col1": 2, "col2": 0.75 }
    // }

    const {index, columns, data} = splitData;
    const result = {};

    index.forEach((rowKey, rowIndex) => {
        result[rowKey] = {};
        columns.forEach((colKey, colIndex) => {
            result[rowKey][colKey] = data[rowIndex][colIndex];
        });
    });

    return result;
}

export function transformSplitFormatToArray(splitData) {
    // Input:
    // {
    //   "index": ["row1", "row2"],
    //   "columns": ["col1", "col2"],
    //   "data": [[1, 0.5], [2, 0.75]]
    // }

    // Output:
    // [ { "col1": 1, "col2": 0.5 },{ "col1": 2, "col2": 0.75 }]

    const {index, columns, data} = splitData;
    const result = [];

    index.forEach((rowKey, rowIndex) => {
        const row = {};
        columns.forEach((colKey, colIndex) => {
            row[colKey] = data[rowIndex][colIndex];
        });
        result.push(row);
    });

    return result;
}
