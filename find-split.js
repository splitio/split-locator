import * as github from '@actions/github';
import * as core from '@actions/core';
import * as glob from '@actions/glob';
import * as fs from 'fs';

async function run() {
	try {
		// not using this yet
		const sampleInput = core.getInput('sample-input');

		const splitMatch = 'getTreatment';
		const regex = new RegExp(splitMatch);

		// assumes a getTreatment method with the first parameter as split name
		const patterns = ['**/*.html', '**/*.js']
		const globber = await glob.create(patterns.join('\n'))

		const splits = [];
		for await (const file of globber.globGenerator()) {
	  		// console.log(file)

	  		let lineNo = 0;
			fs.readFile(file, (err, fi) => {
			  if (err) throw err;

			  // no support for windows line endings
			  fi.toString().split('\n').forEach(line => {
			  	lineNo++;
			  	if(regex.test(line)) {
			  		const splitNameMatch = new RegExp('getTreatment.*\((.*)\)');
			  		let found = splitNameMatch.exec(line);

			  		const splitNameFilter = new RegExp('[\'\"]+(.*)[\'\"]')
			  		let found2 = splitNameFilter.exec(found);
			  		if(found2) {
				  		const s = {
				  			name: found2[1],
				  			file: file,
				  			lineNo: lineNo
				  		}
				  		splits.push(s);
				  	}
			  	}
			  });
			});
		}
		if(splits.length > 0) {
			function compare( a, b ) {
			  if ( a.name < b.name ){
			    return -1;
			  }
			  if ( a.name > b.name ){
			    return 1;
			  }
			  return 0;
			}

			splits.sort( compare );	

			for(const s of splits) {
				console.log(s.name + ':' + s.file + ':' + s.lineNo);
			}
			core.setOutput('splits', s);
		} else {
			console.log('no splits found');
		}
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();