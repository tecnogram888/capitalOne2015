var context = {
	output: ""
};

var xhr = new XMLHttpRequest();
xhr.open("POST", "https://api.levelmoney.com/api/v2/hackathon/get-all-transactions", true);
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.setRequestHeader('Accept', 'application/json');
xhr.onloadend = function() {
    var parsed = JSON.parse(this.response);
    context.allTransactions = parsed.transactions;
    context.categoryMap = bucketCategories(context.allTransactions);
    context.categoryMetricsMap = {};
    renderTable(365);

    document.getElementById('timeframe').onchange=function(e) {
    	switch(e.target.value) {
    		case 'daily':
    			return renderTable(1);
    		case 'weekly':
    			return renderTable(7);
    		case 'monthly':
    			return renderTable(31);
    		case 'annually':
    			return renderTable(365);
    	}
    };
};
xhr.onerror = function(err) {
    document.getElementById('outrpc19').textContent = "ugh an error. i can't handle this right now.";
};
args = {"args": {"uid":  1110568334, "token":  "D0DB1D91A11E653436B622173E381F41", "api-token":  "HackathonApiToken"}}; // default
//args = {"args": {"uid":  1110570166, "token":  "63C08C4AA6E3CB1A4B13C9C5299365C0", "api-token":  "HackathonApiToken"}}; // struggling
//args = {"args": {"uid":  1110570164, "token":  "119947F2D985C3788998543A3D3AD90C", "api-token":  "HackathonApiToken"}}; // comfortable
xhr.send(JSON.stringify(args));

// ============ Render Helpers =======

var renderTable = function(timeframe)
{
	var output = "";
	for (category in context.categoryMap)
	{
		context.categoryMetricsMap[category] = getCategoryMetrics(context.categoryMap[category], timeframe);
		output += generateRow(category, context.categoryMetricsMap[category]);
	}
	document.getElementById('list').innerHTML = output;
}

var generateRow = function(category, categoryMetrics)
{
  var view = {
  	category: category,
  	burnRate: numberWithCommas((categoryMetrics.annualAmortized / 10000).toFixed(2))
  };

  return Mustache.render("<tr><td>Your rate of spending in </td><td>{{category}}</td><td> is </td><td>${{burnRate}}</td></tr>", view);
}

// ============== Backend Calculations =========

var bucketCategories = function(allTransactions)
{
	var map = {}
	for (i = 0; i < allTransactions.length; i++)
	{
		var transaction = allTransactions[i];
		var categorizationArray = map[transaction.categorization]
		if (categorizationArray)
		{
			categorizationArray.push(transaction);
		}
		else
		{
			map[transaction.categorization] = [transaction];
		}
	}
	return map;
}

var getCategoryMetrics = function(transactionArray, timeframe)
{
	var categoryMetrics = {
		totalCentocents: 0,
		oldestTimestamp: new Date().getTime(),
		newestTimestamp: new Date(0).getTime()
	};

	// aggregate data
	for (i = 0; i < transactionArray.length; i++)
	{
		var transaction = transactionArray[i];
		categoryMetrics.totalCentocents += transaction['amount'];

		var transactionDate = new Date(transaction['transaction-time']).getTime();
		if (categoryMetrics.oldestTimestamp > transactionDate)
		{
			categoryMetrics.oldestTimestamp = transactionDate;
		}

		if (categoryMetrics.newestTimestamp <= transactionDate)
		{
			categoryMetrics.newestTimestamp = transactionDate;
		}
	}
	
	// reformat data for output
	categoryMetrics.annualAmortized = categoryMetrics.totalCentocents * 
			(1000*60*60*24*timeframe / (categoryMetrics.newestTimestamp - categoryMetrics.oldestTimestamp));
	categoryMetrics.oldestTimestamp = new Date(categoryMetrics.oldestTimestamp);
	categoryMetrics.newestTimestamp = new Date(categoryMetrics.newestTimestamp);
	return categoryMetrics;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}





