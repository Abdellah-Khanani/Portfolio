(function(){var s=document.querySelector('[data-slider]');if(!s)return;
var t=s.querySelector('.slides'),n=t.children.length,i=0,dots=s.querySelectorAll('.dots button'),timer;
function go(k){i=(k+n)%n;t.style.transform='translateX(-'+i*100+'%)';dots.forEach(function(d,j){d.setAttribute('aria-current',j===i?'true':'false')})}
dots.forEach(function(d,j){d.addEventListener('click',function(){go(j);reset()})});
var p=s.querySelector('.prev'),x=s.querySelector('.next');
if(p)p.addEventListener('click',function(){go(i-1);reset()});if(x)x.addEventListener('click',function(){go(i+1);reset()});
function reset(){clearInterval(timer);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(function(){go(i+1)},6000)}
var sx=0;s.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
s.addEventListener('touchend',function(e){var d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>40){go(i+(d<0?1:-1));reset()}});
go(0);reset();})();
