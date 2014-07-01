$(document).ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
});

$(function() {
    
    $("#loader").bind("ajaxSend", function(){
        $(this).show();
    }).bind("ajaxComplete", function(){
        $(this).hide();
    });
     
    $('#month-ctrl .strip').html(init_month_ctrl());
    
    bind_month_ctrl_events();
    
    load_records();
    
    $('#month-ctrl #arrow-left').click(function(){
        switch_month(-1);
    });
    
    $('#month-ctrl #arrow-right').click(function(){
        switch_month(1);
    });
    
    $('#btn-add').click(function(){
        add_item();
    });
    
    $('#input-item').keypress(function(e){
        if (e.keyCode == 13) add_item();
    });
    
    // fix input form
    var $win = $(window)
      , $input_form = $('#input-form')
      , navTop = $('#input-form').length && $('#input-form').offset().top - 40
      , isFixed = 0

    processScroll();

    $win.on('scroll', processScroll)

    function processScroll() {
      var i, scrollTop = $win.scrollTop()
      if (scrollTop >= navTop && !isFixed) {
        isFixed = 1
        $input_form.addClass('input-form-fixed')
      } else if (scrollTop <= navTop && isFixed) {
        isFixed = 0
        $input_form.removeClass('input-form-fixed')
      }
    }

});

function add_item()
{
    if ($('#input-item') == '')
    {
        alert('You cannot add an empty value');    
    }
    
    var data = {item:$('#input-item').val(),date:''};
    
    data.date = display_year+'-'+
                format_number(convert_month(selected_month.getMonth()))+'-'+
                format_number($('.day-active').attr('day')) + ' '+
                format_number(today.getHours())+':'+
                format_number(today.getMinutes())+':'+
                format_number(today.getSeconds());
    
    $.ajax({
        url: '/api/add_record/',
        data: data,
        type:"POST",
        dataType:"json",
        error:function(){alert('Fail to add record, please try again later.');},
        success: function(data) {
            if (data.success)
            {
                $('.day-active .record-items').append(gen_record_item(data.data));
                gen_report(data.report);
                $('#input-item').val('');
                $('#balance').html('<span>Account balance </span>'+format_currency(data.balance));
                bind_change_popover_event();
                
                $('a[rel=tooltip]').tooltip();
            }
            else
            {
                alert('Fail to add record, please try again later.');
            }
        }
    });
}

var months = ['January','February','March','April','May','June',
              'July','August','September','October','November','December'];
var months_short = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var today = new Date();
var selected_month = today;
var start_month = selected_month.getMonth()-6;
var end_month = selected_month.getMonth()+5;
var display_year = selected_month.getFullYear();

function format_number(num)
{
    if (num < 10) num = '0'+num;
    
    return num;
}

function convert_month(month)
{
    month ++;
    return month;
}

function get_ordinal(n)
{
    var s=["th","st","nd","rd"],
    v=n%100;
    return n+'<sup>'+(s[(v-20)%10]||s[v]||s[0])+'</sup>';
}

function format_currency(nStr)
{
    nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return currency_symbol + x1 + x2;
}

function init_month_ctrl()
{
    var result = '';   
    for (var i = 0; i <= 11; i++)
    {
        var extra_class = '';
        var month_name = '';
        var year_name = '';
        
         month_name += months[i];
            
        if (i == selected_month.getMonth() && display_year == selected_month.getFullYear())
        {
            extra_class = ' active';
        }
        
        if (i == 0)
        {
            year_name = '<span class="year">'+display_year+'</span>';
        }
        
        
        if (i > today.getMonth() && display_year == today.getFullYear() || display_year > today.getFullYear())
        {
            extra_class += ' disable';
        }
        
        var item = '<span class="month'+extra_class+'" month="'+i+'">' + month_name + year_name +'</span>';
        
        result += item;
    }
    
    return result;
}

function switch_month(change)
{
    display_year += change;
    
    $('#month-ctrl .mask').append('<div class="next-strip"></div>');
    $('#month-ctrl .next-strip').html(init_month_ctrl());
    if (change > 0)
    {
        // next year
        $('#month-ctrl .next-strip').css('left',$('#month-ctrl .next-strip').width()+'px');
    }
    else
    {
        // previous year
        $('#month-ctrl .next-strip').css('left',-$('#month-ctrl .next-strip').width()+'px');
    }
    
    $('#month-ctrl .strip').stop().animate({left:$('#month-ctrl .strip').width()*-change},555,function(){$(this).remove()});
    $('#month-ctrl .next-strip').stop().animate({left:0},555,function(){$(this).removeClass('#month-ctrl next-strip');$(this).addClass('#month-ctrl strip');bind_month_ctrl_events();});
    
}

function bind_month_ctrl_events()
{
    $('.month').each(function(){
        if (!$(this).hasClass('disable'))
        {
            $(this).click(function(){
                selected_month = new Date(display_year,$(this).attr('month'));
                
                $('#month-ctrl .strip').html(init_month_ctrl());
                
                bind_month_ctrl_events();
                
                load_records();
            });
        }
    });
}

function load_records()
{
    
    $.ajax({
        url: '/api/get_records/'+selected_month.getFullYear()+'/'+convert_month(selected_month.getMonth())+'/',
        data: {},
        type:"GET",
        dataType:"json",
        error:function(){alert('Fail to load records.');},
        success: function(data) {
            if (data.success)
            {
                gen_report(data.report);
                
                $('#records').html('');
                
                var total = data.records.length;
                
                for (var i = 0; i < total; i++)
                {
                    var item = data.records[i];
                    
                    var html = '<div class="day" day="'+item.date+'">';
                    
                    if (selected_month.getFullYear() == today.getFullYear() &&
                        selected_month.getMonth() == today.getMonth() &&
                        parseInt(item.date) > today.getDate())
                    {
                        continue;
                    }
                    
                    var day_name_active = '';
                    
                    html += '<div class="day-name"><span>'+get_ordinal(item.date)+'</span></div>';
                    
                    var items = item.records.length;
                    
                    html += '<div class="record-items" date="'+display_year+'-'+format_number(convert_month(selected_month.getMonth()))+'-'+format_number(item.date)+'">';
                    
                    for (var j = 0; j < items; j++)
                    {
                        html += gen_record_item(item.records[j]);
                    }
                    
                    html += '</div>';
                    
                    html += '<div class="clear"></div></div>';
                    
                    $('#records').prepend(html);
                }
                
                $($('#records div.day')[0]).addClass('day-active');
                
                $('#records div.day-name').each(function(){
                    $(this).click(function(){
                        if ($(this).parent().hasClass('day-active')) return;
                        
                        $('.day-active').removeClass('day-active');
                        
                        $(this).parent().addClass('day-active');
                    });
                });
                
                bind_change_popover_event();
                bind_sortable_event();
                
                $('#balance').html('<span>Account balance </span>'+format_currency(data.balance));
            }
            else
            {
                alert('Fail to load records.');
            }
        }
    });
}

function gen_record_item(record)
{
    var html = '';
    var class_name = 'btn-success';
    var switch_btn_name = "It's expense";
    var switch_btn_icon = 'icon-minus';
    if (parseFloat(record.amount) < 0)
    {
        class_name = 'btn-danger';
        switch_btn_name = "It's income";
        switch_btn_icon = 'icon-plus';
    }
    
    html += '<div id="record-'+record.id+'" class="btn-group record-item" item_id="'+record.id+'">'+
            '<a href="javascript:void(0)" class="btn btn-record-item '+class_name+'" item_id="'+record.id+'" rel="tooltip" data-original-title="'+record.added_on_time+'"><span class="category" value="'+record.category+'">';
    
            if (record.is_recurrent)
            {
    html += '<i class="icon-repeat icon-white"></i>&nbsp;';
            }
            
    html += record.category+': </span><span class="amount" value="'+Math.abs(parseFloat(record.amount))+'">'+format_currency(Math.abs(parseFloat(record.amount)))+'</span></a>'+
            '<a href="javascript:void(0)" data-toggle="dropdown" class="btn '+class_name+' dropdown-toggle"><span class="caret"></span></a>'+
            '<ul class="dropdown-menu">'+
            '<li><a href="javascript:void(0)" onclick="switch_record('+record.id+')"><i class="'+switch_btn_icon+'"></i>&nbsp;'+switch_btn_name+'</a></li>'+
            '<li><a href="javascript:void(0)" onclick="switch_record_recurrent('+record.id+')">';
            
            if (record.is_recurrent)
            {
    html += '<i class="icon-remove"></i>&nbsp;Stop recurring</a></li>';
            }
            else
            {
    html += '<i class="icon-repeat"></i>&nbsp;Recurring</a></li>';
            }
    
    html += '<li class="divider"></li>'+
            '<li><a href="javascript:void(0)" onclick="delete_record('+record.id+')"><i class="icon-trash"></i>&nbsp;Delete</a></li>'+
            '</ul></div>';
            
    return html;
}

function gen_report(report)
{
    var expense = parseFloat(report.expense);
    var income = parseFloat(report.incomes);
    var budget = parseFloat(report.budget);
    var balance = income - expense;
    var max = expense > income ? expense : income;    
    
    if (budget_enabled)
    {
        if (expense == 0)
        {
            $('#budget-info').html('<strong>Hey there!</strong> You have <strong>'+format_currency(budget)+'</strong> to spend this month. It\'s a good start! Try not to overspend.');
            $('#budget-info').attr('class','alert alert-success');
            $('#budget-progress').hide();
        }
        else if(expense > budget)
        {
            $('#budget-progress').show();
            $('#budget-progress .bar').css('width', '100%');
            
            $('#budget-info').html('<strong>Be Careful!</strong> You have spent <strong>'+format_currency(expense - budget)+
                                    '</strong> more than <strong>'+format_currency(budget)+'</strong> budget.');
            $('#budget-info').attr('class','alert alert-error');
        }
        else
        {
            $('#budget-progress').show();
            $('#budget-progress .bar').css('width', (expense/budget)*100+'%');
            
            $('#budget-info').html('You have already spent <strong>'+format_currency(expense)+
                               '</strong> from <strong>'+format_currency(budget)+'</strong> budget.');
            $('#budget-info').attr('class','alert alert-info');
        }
    }
    
    $('#expense-meter .label').html(format_currency(expense));
    $('#income-meter .label').html(format_currency(income));
    if (balance > 0)
    {
        // own more money
        $('#expense-meter .bar').css('width', '0%');
        $('#income-meter .bar').css('width', (balance/max)*100+'%');
        $('#income-meter .bar').attr('data-original-title','Very good! You owned '+format_currency(balance)+' more than you spent.');
        $('#income-meter .bar').tooltip();
    }
    else if (balance < 0)
    {
        // spent more money
        balance = Math.abs(balance);
        $('#income-meter .bar').css('width', '0%');
        $('#expense-meter .bar').css('width', (balance/max)*100+'%');
        $('#expense-meter .bar').attr('data-original-title','You spent '+format_currency(balance)+' more than you owned.');
        $('#expense-meter .bar').tooltip();
    }
    else
    {
        // it's balance
        $('#expense-meter .bar').css('width', '0%');
        $('#income-meter .bar').css('width', '0%');
    }
}

function delete_record(record_id)
{
    $.ajax({
        url: '/api/delete_record/',
        data: {id:record_id},
        type:"POST",
        dataType:"json",
        error:function(){alert('Delete record failed.');},
        success: function(data) {
            if (data.success)
            {
                $('#input-item-edit-'+record_id).parents('.qtip').remove();
                $('#record-'+record_id).remove();
                gen_report(data.report);
                $('#balance').html('<span>Account balance </span>'+format_currency(data.balance));
                
                $('a[rel=tooltip]').tooltip();
            }
            else
            {
                alert('Delete record failed.');
            }
        }
    });
}

function switch_record(record_id)
{
    $.ajax({
        url: '/api/switch_record/',
        data: {id:record_id},
        type:"POST",
        dataType:"json",
        error:function(){alert('Switch record failed.');},
        success: function(data) {
            if (data.success)
            {
                $('#input-item-edit-'+record_id).parents('.qtip').remove();
                $('#record-'+record_id).replaceWith(gen_record_item(data.data));
                gen_report(data.report);
                $('#balance').html('<span>Account balance </span>'+format_currency(data.balance));
                
                bind_single_popover($('#record-'+record_id+' .btn-record-item'));
                
                $('a[rel=tooltip]').tooltip();
            }
            else
            {
                alert('Switch record failed.');
            }
        }
    });
}

function switch_record_recurrent(record_id)
{
    $.ajax({
        url: '/api/switch_record_recurrent/',
        data: {id:record_id},
        type:"POST",
        dataType:"json",
        error:function(){alert('Fail to change the record recurring status.');},
        success: function(data) {
            if (data.success)
            {
                $('#input-item-edit-'+record_id).parents('.qtip').remove();
                $('#record-'+record_id).replaceWith(gen_record_item(data.data));
                bind_single_popover($('#record-'+record_id+' .btn-record-item'));
                
                $('a[rel=tooltip]').tooltip();
            }
            else
            {
                alert('Fail to change the record recurring status.');
            }
        }
    });
}

function change_record()
{
    var record_id = $('.selected-record-item').attr('item_id');
    var item_value = $('#input-item-edit-'+record_id).val();
    
    $.ajax({
        url: '/api/update_record/',
        data: {id:record_id,item:item_value},
        type:"POST",
        dataType:"json",
        error:function(){alert('Fail to change the record.');},
        success: function(data) {
            if (data.success)
            {
                $('#input-item-edit-'+record_id).parents('.qtip').remove();
                $('#record-'+record_id).replaceWith(gen_record_item(data.data));
                gen_report(data.report);
                $('#balance').html('<span>Account balance </span>'+format_currency(data.balance));
                
                bind_single_popover($('#record-'+record_id+' .btn-record-item'));
                $('a[rel=tooltip]').tooltip();
            }
            else
            {
                alert('Fail to change the record.');
            }
        }
    });
}

function bind_single_popover(target)
{
    $(target).click(function(){
        $('.selected-record-item').removeClass('selected-record-item');
        $(this).addClass('selected-record-item');
    });
    
    $(target).qtip({
        content: '<div style="text-align:center"><input id="input-item-edit" type="text" placeholder="Enter a bill" class="span2" style="margin:0">&nbsp;<button id="btn-add" class="btn btn-info" style="margin:0" onclick="change_record()"><i class="icon-ok icon-white"></i>&nbsp;Done</button></div>',
        show: { solo: true,when:{event:'click'},delay:50 },
        hide: { when: 'unfocus', fixed: true },
        position: {
            corner: {
               target: 'bottomMiddle',
               tooltip: 'topMiddle'
            }
         },
        style: { 
            width: 268,
            padding: 10,
            background: '#000',
            color: '#fff',
            border: {
                width: 1,
                color: '#000'
            },
            tip: {size:{x:12,y:6},corner:'topMiddle'},
            name: 'light' // Inherit the rest of the attributes from the preset dark style
        },
        api:{
            onShow:function(){
    
                var category = $('.selected-record-item .category').attr('value');
                var amount = $('.selected-record-item .amount').attr('value');
                
                if ($('.selected-record-item').hasClass('btn-success'))
                {
                    amount = '+'+amount;
                }
                
                $('#input-item-edit').val(category+':'+amount);
                
                $('#input-item-edit').keypress(function(e){
                    if (e.keyCode == 13) change_record();
                });
                
                $('#input-item-edit').attr('id','input-item-edit-'+$('.selected-record-item').attr('item_id'));
            }
        }
    });            
}

function bind_change_popover_event()
{
    $('.btn-record-item').each(function(){
        bind_single_popover($(this));
    });
    
    $('a[rel=tooltip]').tooltip();
}

function bind_sortable_event()
{
    $('div.record-items').each(function(){
        $(this).sortable({
            connectWith:'div.record-items',
            receive:function(event,ui){
                var record_id = $(ui.item).attr('item_id');
                var new_date = $(ui.item).parent().attr('date');
                
                $.ajax({
                    url: '/api/update_record_date/',
                    data: {id:record_id,date:new_date},
                    type:"POST",
                    dataType:"json",
                    error:function(){},
                    success: function(data) {
                        
                    }
                });
            }
        })
    });
}

function update_settings()
{
    $('#setting-error').hide();
    $('#setting-msg').hide(); 
    var data = {currency_symbol:'$',email:'',monthly_budget:'0',account_balance:'0',budget_enabled:'1'};
    
    data.currency_symbol = $('#currency-symbol').val();
    data.email = $('#email').val();
    data.monthly_budget = $('#monthly_budget').val();
    data.account_balance = $('#account_balance').val();
    
    if ($('#budget-enabled').is(':checked'))
    {
        data.budget_enabled = '1';
    }
    else
    {
        data.budget_enabled = '0';
    }
    
    var password = $('#new-password').val();
    if (password != '')
    {
        if (password.length < 6)
        {
            $('#setting-error').html('The new password is too short. It must be at least 6 chars long.');
            $('#setting-error').show();
            return;
        }
        
        data.password = password;
    }
    
    $.ajax({
        url: '/api/update_settings/',
        data: data,
        type:"POST",
        dataType:"json",
        error:function(){
            $('#setting-error').html('Fail to update account settings, please try again later.');
            $('#setting-error').show();
        },
        success: function(data) {
            if (data.success)
            {
                $('#setting-msg').html('Account settings updated!');
                $('#setting-msg').show();
            }
            else
            {
                show_error(data.msg, '#setting-error');
            }
        }
    });
}

function show_error(code,target)
{
    $(target).html(code);
    $(target).show();
}

function error(msg)
{
    $('#global-error span').html(msg);
    $('#global-error').show();
}