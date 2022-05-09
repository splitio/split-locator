
		const splitMatch = 'getTreatment';
		const regex = new RegExp(splitMatch);
		const line = 'Split.getTreatment(\'AAA\')';

			  	if(regex.test(line)) {
			  		const splitNameMatch = new RegExp('getTreatment.*\((.*)\)');
			  		let found = splitNameMatch.exec(line);

			  		const splitNameFilter = new RegExp('[\'\"]+(.*)[\'\"]')
			  		let found2 = splitNameFilter.exec(found);
			  		if(found2) {
				  		console.log('found');
						
				  	}else {
						console.log('not found');
					}
				}
