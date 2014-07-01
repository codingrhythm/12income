var monthly_report = [];
var category_report = [];
var _months = [];
function load_charts(year)
{
   $.ajax({
      url: '/api/get_annual_reports/'+year+'/',
      data: {},
      type:"GET",
      dataType:"json",
      error:function(){},
      success: function(data) {
          if (data.success)
          {
            _months = [];
            var report_expense = [];
            var report_income = [];
            monthly_report = [];
            category_report = [];
	    var total_expenses = 0;
	    var total_incomes = 0;
            for (var i = 0; i < data.monthly_report.length; i++)
            {
               var item = data.monthly_report[i];
               _months.push(months_short[parseInt(item.month)-year*100-1]);
               
               report_expense.push(parseFloat(item.expense));
	       total_expenses += parseFloat(item.expense);
               report_income.push(parseFloat(item.incomes));
	       total_incomes += parseFloat(item.incomes);
            }
	    
	    $('#total-incomes').html(format_currency(total_incomes));
	    $('#total-expenses').html(format_currency(total_expenses));
	    
	    for (var i = 0; i < data.category_report.length; i++)
	    {
		var item = data.category_report[i]
		var amount = parseFloat(item[1]);
		if (amount > 0)
		{
		    item[1] = amount;
		    category_report.push(item);
		}
	    }
            
            monthly_report.push({name:'Incomes',data:report_income});
			monthly_report.push({name:'Expenses',data:report_expense});
            
            var monthly_chart = new Highcharts.Chart({
					chart: {
						renderTo: 'monthly-chart',
						defaultSeriesType: 'line',
						marginRight: 130,
						marginBottom: 25
					},
					title: {
						text: 'Monthly Expenses/Incomes',
						x: -20 //center
					},
					subtitle: {
						text: 'Year '+year,
						x: -20
					},
					xAxis: {
						categories: _months
					},
					yAxis: {
						title: {
							text: 'Amount'
						},
						plotLines: [{
							value: 0,
							width: 1,
							color: '#EEEEEE'
						}]
					},
					tooltip: {
						formatter: function() {
				                return this.x+' '+format_currency(this.y);
						}
					},
					legend: {
						layout: 'vertical',
						align: 'right',
						verticalAlign: 'top',
						x: -10,
						y: 100,
						borderWidth: 0
					},
					series: monthly_report
				});
			
			var expense_chart = new Highcharts.Chart({
					chart: {
						renderTo: 'expense-chart',
						plotBackgroundColor: null,
						plotBorderWidth: null,
						plotShadow: false
					},
					title: {
						text: 'Expenses of '+selected_year+' by Categories '
					},
					tooltip: {
						formatter: function() {
				            return '<b>'+ this.point.name +'</b>: '+ format_currency(this.y)+'('+ parseInt(this.percentage) +'%)';
						}
					},
					plotOptions: {
						pie: {
							allowPointSelect: true,
							cursor: 'pointer',
							dataLabels: {
								enabled: true,
								formatter: function() {
								   return '<b>'+ this.point.name +'</b>: '+ parseInt(this.percentage) +' %';
								}
						   }
						}
					},
					series: [{
						type: 'pie',
						name: 'Expense Categories',
						data: category_report
					 }]
				});
          }
          else
          {
            alert('Failed!');
          }
      }
    });
}

var selected_year = 2012;
var display_year = 2012;
$(function() {
	var now = new Date();
	selected_year = now.getFullYear();
	display_year = now.getFullYear();
	$('#year-ctrl .strip').html(init_year_ctrl());
    bind_year_ctrl_events();
	
	$('#year-ctrl #arrow-left').click(function(){
        switch_year(-1);
    });
    
    $('#year-ctrl #arrow-right').click(function(){
        switch_year(1);
    });
	
    load_charts(selected_year);
});



function init_year_ctrl()
{
    var result = '';
	var start_year = display_year - 7;
	var end_year = display_year + 7
    for (var i = start_year; i <= end_year; i++)
    {
        var extra_class = '';
        var year_name = '';
            
        if (i == selected_year)
        {
            extra_class = ' active';
        }
        
        
        if (i > today.getFullYear())
        {
            extra_class += ' disable';
        }
        
        var item = '<span class="month year-item'+extra_class+'" year="'+i+'">' + i +'</span>';
        
        result += item;
    }
    
    return result;
}

function switch_year(change)
{
    display_year += change*15;
    
    $('#year-ctrl .mask').append('<div class="next-strip"></div>');
    $('#year-ctrl .next-strip').html(init_year_ctrl());
    if (change > 0)
    {
        // next year
        $('#year-ctrl .next-strip').css('left',$('#year-ctrl .next-strip').width()+'px');
    }
    else
    {
        // previous year
        $('#year-ctrl .next-strip').css('left',-$('#year-ctrl .next-strip').width()+'px');
    }
    
    $('#year-ctrl .strip').stop().animate({left:$('#year-ctrl .strip').width()*-change},555,function(){$(this).remove()});
    $('#year-ctrl .next-strip').stop().animate({left:0},555,function(){$(this).removeClass('#year-ctrl next-strip');$(this).addClass('#year-ctrl strip');bind_year_ctrl_events();});
    
}

function bind_year_ctrl_events()
{
    $('.year-item').each(function(){
        if (!$(this).hasClass('disable'))
        {
            $(this).click(function(){
                selected_year = parseInt($(this).attr('year'));
                
                $('#year-ctrl .strip').html(init_year_ctrl());
                
                bind_year_ctrl_events();
				
				load_charts(selected_year);
            });
        }
    });
}