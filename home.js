var context = {
	output: ""
};

var xhr = new XMLHttpRequest();
xhr.open("POST", "https://api.levelmoney.com/api/v2/hackathon/get-all-transactions", true);
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.setRequestHeader('Accept', 'application/json');
xhr.onloadend = function() {
    var parsed = JSON.parse(this.response);
    var pretty = JSON.stringify(parsed, null, 2);
    context.allTransactions = parsed.transactions;
    context.categoryMap = bucketCategories(context.allTransactions);
    context.categoryMetricsMap = {};
    for (category in context.categoryMap)
    {
    	context.categoryMetricsMap[category] = getCategoryMetrics(context.categoryMap[category]);
    	context.output += generateRow(category, context.categoryMetricsMap[category]);
    }
    document.getElementById('list').innerHTML = context.output;
};
xhr.onerror = function(err) {
    document.getElementById('outrpc19').textContent = "ugh an error. i can't handle this right now.";
};
args = {"args": {"uid":  1110568334, "token":  "D0DB1D91A11E653436B622173E381F41", "api-token":  "HackathonApiToken"}};
xhr.send(JSON.stringify(args));

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

var getCategoryMetrics = function(transactionArray)
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
			(1000*60*60*24*365 / (categoryMetrics.newestTimestamp - categoryMetrics.oldestTimestamp));
	categoryMetrics.oldestTimestamp = new Date(categoryMetrics.oldestTimestamp);
	categoryMetrics.newestTimestamp = new Date(categoryMetrics.newestTimestamp);
	return categoryMetrics;
}

var generateRow = function(category, categoryMetrics)
{
  var view = {
  	category: category,
  	burnRate: numberWithCommas((categoryMetrics.annualAmortized / 10000).toFixed(2))
  };

  return Mustache.render("<li>Your rate of spending in {{category}} is ${{burnRate}}</li>", view);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}





