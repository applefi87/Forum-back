import _ from 'lodash';
import fs from 'fs';
import converter from 'json-2-csv';

// Convert Chinese keys to English (unified)
export default async function convertCsvToCode(csv, rule) {
    const translate = rule.transformTable;
    
    // Normalize line endings in the CSV
    const formattedCsv = csv.replace(/\r\n/g, '\n').replace(/\r/g, '');

    try {
        const parsedCsv = await csv2json(formattedCsv);
        return processCsvData(parsedCsv, translate, rule.cols);
    } catch (err) {
        console.error('ERROR:', err.message);
        throw new Error('CSV conversion error');
    }
}

// Convert CSV to JSON format
async function csv2json(csvData) {
    return await converter.csv2jsonAsync(csvData, {
        // Delimiters can be specified here if needed
    });
}

// Process the CSV data and transform based on provided translation map
function processCsvData(csvArray, translate, cols) {
    // Pre-process template definition requires Boolean/numbers, etc., which can't be directly created from a csv file 
    // (because I judge with _.isEqual, objects/arrays can't be compared, so I leave it as a string for now)
    const preFormatCols = getPreFormatCols(cols);

    return csvArray.map(obj => {
        const processedObj = {};

        Object.keys(translate).forEach(k => {
            const value = obj[translate[k]['zhTW']];
            
            // If the field is empty/non-existent, don't fill it in. Otherwise, even 0 should be included
            if (value !== "" && value !== undefined) {
                processedObj[k] = formatValueBasedOnType(value, preFormatCols[k]);
            }
        });

        return processedObj;
    });
}

// Get the predefined column formats
function getPreFormatCols(cols) {
    return cols.reduce((acc, it) => {
        if ([0, 1, 2, 3].includes(it.t)) {
            acc[it.c] = it.t;
        }
        return acc;
    }, {});
}

// Format the value based on its specified type
function formatValueBasedOnType(value, type) {
    switch (type) {
        case 0:
            return ['有', '是', 'yes', 'true', 'TRUE', true].includes(value);
        case 1:
        case 2:
            return value.toString();
        case 3:
            const number = Number(value);
            return isNaN(number) ? undefined : number;
        default:
            return value;
    }
}
