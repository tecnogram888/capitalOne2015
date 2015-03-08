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
    renderPurchaseConsideration(context.categoryMap);

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

// ============ User Event Handlers =================

function onSubmitInputItem() {
	var itemName = document.getElementById('inputName').value;
	var cost = document.getElementById('inputCost').value;
	var days = document.getElementById('inputDays').value;
	var category = document.getElementById('inputCategory').value;
	var itemAmortizedCost = (cost*365/days).toFixed(2);

	document.getElementById('considerations').innerHTML += 
		'<td>' + itemName + '</td>' +
		'<td>' + category + '</td>' +
		'<td>' + (context.categoryMetricsMap[category].annualAmortized /10000).toFixed(2) + '</td>' +
		'<td>' + itemAmortizedCost + '</td>';
}

// ============ Render Helpers ==================

var renderPurchaseConsideration = function(categoryMap) {
	var pcHTML = 'Category of item: <select id="inputCategory">'
	for (property in categoryMap)
	{
		pcHTML += '<option value="' + property + '">' + property + '</option>';
	}
	pcHTML += '</select><br>' + 
		'Item Name: <input id="inputName" type="text" name="itemName"><br>' +
		'Cost of Item: <input id="inputCost" type="text" name="cost"><br>' +
    'How Long will it Last in Days: <input id="inputDays" type="text" name="days"><br>' + 
    '<input type="submit" value="Submit" onclick="onSubmitInputItem()">'

  document.getElementById('inputItem').innerHTML = pcHTML;
}

var renderTable = function(timeframe)
{
	var output = "";
	for (category in context.categoryMap)
	{
		context.categoryMetricsMap[category] = getCategoryMetrics(context.categoryMap[category], timeframe);
		output += generateTableRow(category, context.categoryMetricsMap[category]);
	}
	document.getElementById('list').innerHTML = output;
}

var generateTableRow = function(category, categoryMetrics)
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

/**
	* annualAmortized
	* oldest/newestTimestamp
	*/
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
	categoryMetrics.annualAmortized = (categoryMetrics.totalCentocents * 
			(1000*60*60*24*timeframe / (categoryMetrics.newestTimestamp - categoryMetrics.oldestTimestamp))).toFixed(2);
	categoryMetrics.oldestTimestamp = new Date(categoryMetrics.oldestTimestamp);
	categoryMetrics.newestTimestamp = new Date(categoryMetrics.newestTimestamp);
	return categoryMetrics;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


