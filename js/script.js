var pageSpeed = 25,
	scrolldelay,
	timer;

$(function() {
	setTimeout(function(){ window.scrollTo(0, 0); }, 100);
	$('.marker, .overlay').fadeOut(0);
	clean_teleprompter();

	timer = $('.clock').timer({ stopVal: 10000 });

	$('#teleprompter').change(clean_teleprompter);
	$('body').keydown(navigate);

	$('article .teleprompter').css({
		'padding-bottom': Math.ceil($(window).height()-$('header').height()) + 'px'
	});

	$('.font_size').slider({
		min: 12,
		max: 100,
		value: 60,
		orientation: "horizontal",
		range: "min",
		animate: true,
		slide: fontSize,
		change: fontSize
	});

	$('.speed').slider({
		min: 1,
		max: 50,
		value: 35,
		orientation: "horizontal",
		range: "min",
		animate: true,
		slide: speed,
		change: speed
	});

	$('.button.play').click(function(){
		if($(this).hasClass('icon-play'))
		{
			start_teleprompter();
		}
		else
		{
			stop_teleprompter();
		}
	});
	$('.button.flipx').click(function(){
		if($('.teleprompter').hasClass('flipy'))
		{
			$('.teleprompter').removeClass('flipy').toggleClass('flipxy');
		}
		else
		{
			$('.teleprompter').toggleClass('flipx');
		}
	});
	$('.button.flipy').click(function(){
		if($('.teleprompter').hasClass('flipx'))
		{
			$('.teleprompter').removeClass('flipx').toggleClass('flipxy');
		}
		else
		{
			$('.teleprompter').toggleClass('flipy');
		}
	});
	$('.button.reset').click(function(){
		stop_teleprompter();
		setTimeout(function(){ window.scrollTo(0, 0); }, 100);
		$('.speed').slider('value', 35);
		$('.font_size').slider('value', 60);
		$('.teleprompter').removeClass('flipx flipy flipxy flipxy_alt');
	});
});

function fontSize()
{
	var font_size = $('.font_size').slider( "value" );

	$('article .teleprompter').css({
		'font-size': font_size + 'px',
		'line-height': Math.ceil(font_size * 1.5) + 'px',
		'padding-bottom': Math.ceil($(window).height()-$('header').height()) + 'px'
	});

	$('article .teleprompter p').css({
		'padding-bottom': Math.ceil(font_size * 0.25) + 'px',
		'margin-bottom': Math.ceil(font_size * 0.25) + 'px'
	});
}

function speed()
{
	pageSpeed = 50 - $('.speed').slider('value');
}

function pageScroll()
{
	$('body').stop().animate({scrollTop: window.pageYOffset + 1}, 1);
	scrolldelay = setTimeout('pageScroll()', pageSpeed);

	// We're at the bottom of the document, stop
	if(window.pageYOffset >= ( document.body.scrollHeight - $(window).height() ))
	{
		stop_teleprompter();
		setTimeout(function(){ window.scrollTo(0, 0); }, 100);
	}
}

// Listen for Key Presses on Body
function navigate(evt)
{
	var space = 32,
		escape = 27,
		left = 37,
		up = 38,
		right = 39,
		down = 40,
		speed = $('.speed').slider('value'),
		font_size = $('.font_size').slider('value');

	// Exit if we're inside an input field
	if (typeof evt.target.id == 'undefined' || evt.target.id == 'teleprompter')
	{
		return;
	}
	else if (typeof evt.target.id == 'undefined' || evt.target.id != 'gui')
	{
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}

	// Reset GUI
	if(evt.keyCode == escape)
	{
		$('.button.reset').trigger('click');
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
	// Start Stop Scrolling
	else if(evt.keyCode == space)
	{
		$('.button.play').trigger('click');
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
	// Decrease Speed with Left Arrow
	else if(evt.keyCode == left)
	{
		$('.speed').slider('value', speed-1);
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
	// Decrease Font Size with Down Arrow
	else if(evt.keyCode == down)
	{
		$('.font_size').slider('value', font_size-1);
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
	// Increase Font Size with Up Arrow
	else if(evt.keyCode == up)
	{
		$('.font_size').slider('value', font_size+1);
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
	// Increase Speed with Right Arrow
	else if(evt.keyCode == right)
	{
		$('.speed').slider('value', speed+1);
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
}

function start_teleprompter()
{
	$('.button.play').removeClass('icon-play').addClass('icon-pause');
	$('header h1, header nav').fadeTo('slow', 0.15);
	$('.marker, .overlay').fadeIn('slow');
	$('body').addClass('playing');

	timer.resetTimer();
	timer.startTimer();

	pageScroll();
}
function stop_teleprompter()
{
	clearTimeout(scrolldelay);
	$('header h1, header nav').fadeTo('slow', 1);
	$('.button.play').removeClass('icon-pause').addClass('icon-play');
	$('.marker, .overlay').fadeOut('slow');
	$('body').removeClass('playing');

	timer.stopTimer();
}
function clean_teleprompter()
{
	var text = $('#teleprompter').html();
	$('#teleprompter').html('<p>' + text.replace(/<br>+/g,"@@").replace(/@@@@/g,'</p><p>') + '</p>');
}
window.onresize = function(event) {
    //$('.button.reset').trigger('click');
};

/*
 * jQuery UI Touch Punch 0.2.2
 *
 * Copyright 2011, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function(b){b.support.touch="ontouchend" in document;if(!b.support.touch){return;}var c=b.ui.mouse.prototype,e=c._mouseInit,a;function d(g,h){if(g.originalEvent.touches.length>1){return;}g.preventDefault();var i=g.originalEvent.changedTouches[0],f=document.createEvent("MouseEvents");f.initMouseEvent(h,true,true,window,1,i.screenX,i.screenY,i.clientX,i.clientY,false,false,false,false,0,null);g.target.dispatchEvent(f);}c._touchStart=function(g){var f=this;if(a||!f._mouseCapture(g.originalEvent.changedTouches[0])){return;}a=true;f._touchMoved=false;d(g,"mouseover");d(g,"mousemove");d(g,"mousedown");};c._touchMove=function(f){if(!a){return;}this._touchMoved=true;d(f,"mousemove");};c._touchEnd=function(f){if(!a){return;}d(f,"mouseup");d(f,"mouseout");if(!this._touchMoved){d(f,"click");}a=false;};c._mouseInit=function(){var f=this;f.element.bind("touchstart",b.proxy(f,"_touchStart")).bind("touchmove",b.proxy(f,"_touchMove")).bind("touchend",b.proxy(f,"_touchEnd"));e.call(f);};})(jQuery);
