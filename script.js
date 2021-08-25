'use strict';

class Slider {
	constructor({selector, settings}) {
		this.slider = document.querySelector(selector.sliderSelector);
		this.bulletsWrapper = document.querySelector(selector.bulletsWrapperSelector);
		this.bulletsWrapperSelector = selector.bulletsWrapperSelector;
		this.prevSelector = selector.prevSelector;
		this.nextSelector = selector.nextSelector;
		this.animation = settings.animation;
		this.loop = settings.loop;
		this.slides = this.slider.querySelectorAll('.slide');
		this.currentSlide = 1;
		this.prevSlide = 1;
		this.slidesView = settings.slidesView || 1;
		this.viewWidth = settings.viewWidth || 900;
		this.pageSize = Math.ceil(this.slides.length / this.slidesView);
	}
	paginationAdd() {
		if (this.pageSize <= 1 || !this.bulletsWrapper) {
			return;
		}
		this.bulletsWrapper.parentNode.style.display = 'flex';
		for (let i = 1; i <= this.slides.length; i++) {
			this.bulletsWrapper.insertAdjacentHTML('beforeend', `<span>${i}</span>`);
		}
		this.bullets = this.bulletsWrapper.querySelectorAll('span');
		this.bullets[0].classList.add('active');
	}//+
	slidesViewAdd() {
		const style = document.createElement('style');
		style.textContent = `
			.slide {
				width: ${this.viewWidth / this.slidesView}px;
			}
		`;
		document.body.append(style);
	}//+
	animationChange() {
		let n = this.positionStart + (this.prevSlide - 1) * (this.viewWidth / this.slidesView);
		const positionTo = this.positionStart + (this.currentSlide - 1) * (this.viewWidth / this.slidesView);
		const animate = () => {
			if (Math.abs(n) - Math.abs(positionTo) >= 0 && Math.abs(n) - Math.abs(positionTo) <= 10) {
				n = positionTo;
				this.prevSlide = this.currentSlide;
				cancelAnimationFrame(this.animateKey);
				this.animateKey = null;
				this.slider.style.transform = `translateX(-${n}px)`;
				return;
			}
			if (this.currentSlide > this.prevSlide) {
				n += 10;
			} else {
				n -= 10;
			}
			this.slider.style.transform = `translateX(-${n}px)`;
			this.animateKey = requestAnimationFrame(animate);
		}
		this.animateKey = requestAnimationFrame(animate);
	}
	changeSlide() {
		document.querySelector('.active').classList.remove('active');
		this.currentSlide >= this.slides.length + 1 ?
			this.bullets[0].classList.add('active') :
			this.bullets[this.currentSlide - 1].classList.add('active');// -1 чтобы указать корректно индекс элемента массива
		if (this.animation) {
			if (this.animateKey) {
				cancelAnimationFrame(this.animateKey);
			}
			this.animationChange();
			return;
		}
		this.slider.style.transform = `translateX(-${this.positionStart + (this.currentSlide - 1) * (this.viewWidth / this.slidesView)}px)`;// начальная позиция слайдера складывается с корректным слайдом - 1, т.к. отсчет с нуля и умножается на размер слайда.
	}//+
	nextSlideChange() {
		if (this.currentSlide < this.slides.length + 1) {
			this.currentSlide += 1;
		} else {
			if (this.loop) {
				this.slider.style.transform = 'translateX(0)';
				this.prevSlide = 1;
			}
			this.currentSlide = 2;
		}
	}//+
	prevSlideChange() {
		if (this.currentSlide > 1) {
			this.currentSlide -= 1;
		} else {
			if (this.loop) {
				this.slider.style.transform = `translateX(-${this.slides.length * (this.viewWidth / this.slidesView)}px)`;
				this.prevSlide = this.slides.length + 1;
			}
			this.currentSlide = this.slides.length;
		}
	}//+
	swipe(el, setting) {
		// Настройки по умолчанию
		const settings = Object.assign({}, {
			minDist: 60,
			maxDist: 120,
			MaxTime: 700,
			minTime: 50
		}, setting);
		// Корректировка времени
		if (settings.minTime > settings.maxTime) {
			settings.maxTime = settings.minTime + 500;
		}
		if (settings.maxTime < 100 ||settings.minTime < 50) {
			settings.minTime = 50;
			settings.maxTime = 700;
		}
		let dir,
			swipeType,
			isMouse = false,
			isMouseDown = false,
			startX = 0,
			distX = 0,
			startTime = 0,
			support = {
				pointer: !!('PointerEvent' in window || ('msPointerEnabled' in window.navigator)),
				touch: !!(typeof window.orientation !== 'undefined' ||
					/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
					'ontouchstart' in window || navigator.msMaxTouchPoints ||
					'maxTouchPoints' in window.navigator > 1 || 'msMaxTouchPoints' in window.navigator > 1			
				)
			};
			// Определение доступных событий в браузере: pointer, touch и mouse.
		const getSupportedEvents = () => {
			let events;
			switch (true) {
				case support.pointer:
					events = {
						type: 'pointer',
						start: 'PointerDown',
						move: 'PointerMove',
						end: 'PointerUp',
						cancel: 'PointerCancel',
						leave: 'PointerLeave'
					};
					// Добавляем префикс для ie10
					const ie10 = (window.navigator.msPointerEnabled && Function('/*@cc_on return document.documentMode===10@*/')());
					for (let value in events) {
						if (value === 'type') continue;
						events[value] = (ie10) ? 'MS' + events[value] :
							events[value].toLowerCase();
					}
					break;
				case support.touch:
					events = {
						type: 'touch',
						start: 'touchstart',
						move: 'touchmove',
						end: 'touchend',
						cancel: 'touchcancel'
					};
					break;
				default:
					events = {
						type: 'mouse',
						start: 'mousedown',
						move: 'mousemove',
						end: 'mouseup',
						leave: 'mouseleave'
					}
					break;
				}
			return events;
		};
		// Объединение событий pointer, touch и mouse
		const eventsUnify = (e) => {
			return e.changedTouches ? e.changedTouches[0] : e;
		};
		// возвращает touchlist или событие без изменения
		const checkStart = (e) => {
			const event = eventsUnify(e);
			if (support.touch && typeof e.touches !== 'undefined' && e.touches.length !== 1) return; // Игнорирование касания несколькими пальцами
			dir = 'none';
			swipeType = 'none';
			dir = 0;
			startX = event.pageX;
			startTime = new Date().getTime();
			if (isMouse) isMouseDown = true;

		};
		// Обработчик начала нажатия
		const checkMove = (e) => {
			if (isMouse && !isMouseDown) return;// выход, если кнопка не нажата
			const event = eventsUnify(e);
			distX = event.pageX - startX;
			dir = (distX < 0) ? 'left' : 'right'; 
		};
		// Обработчик движения указателя
		const checkEnd = (e) => {
			console.log('end');
			if (isMouse && !isMouseDown) {
				isMouseDown = false;
				return;
			}
			const endTime = new Date().getTime();
			const time = endTime - startTime;
			if (time >= settings.minTime && time <= settings.maxTime && Math.abs(distX) >= settings.minDist && Math.abs(distX) <= settings.maxDist) {
				swipeType = dir;
			}
			distX = Math.abs(distX);
			console.log(swipeType);
			if (swipeType !== 'none' && distX >= settings.minDist) {
				const swipeEvent = new CustomEvent('swipe', {
					bubbles: true,
					cancelable: true,
					detail: {
						full: e,
						dir: swipeType,
						dist: distX,
						time: time
					}
				});
				console.log(swipeEvent);
				el.dispatchEvent(swipeEvent);
			}
			// Создание кастомного события свайп
		};
		// Обработчик окончания касания указателя
		const events = getSupportedEvents();
		// Добавление поддерживаемых событий
		if ((support.pointer && !support.touch) || events.type === 'mouse') isMouse = true;
		el.addEventListener(events.start, checkStart);
		el.addEventListener(events.move, checkMove);
		el.addEventListener(events.end, checkEnd);
		if (support.pointer && support.touch) {
			el.addEventListener('lostpointercapture', checkEnd);
		}

	}
	handlerChange() {
		document.addEventListener('click', (e) => {
			if (e.target.closest(this.nextSelector) || e.target.closest(this.prevSelector) || e.target.closest(this.bulletsWrapperSelector)) {
				this.prevSlide = this.currentSlide;
				if (e.target.closest(this.nextSelector)) {
					this.nextSlideChange();
				} else if (e.target.closest(this.prevSelector)) {
					this.prevSlideChange();
				} else if (e.target.closest(this.bulletsWrapperSelector + '>span')) {
					this.currentSlide = +e.target.closest(this.bulletsWrapperSelector + '>span').textContent;
				}
				if (this.prevSlide !== this.currentSlide) {
					this.changeSlide();
				}
			}
		});
		this.swipe(this.slider);
		this.slider.addEventListener('swipe', (e) => {
			console.log('work', e.detail);
		});// todo: swiper
	}
	addCloneSlide() {
		if (this.slidesView > 1) {
			for (let i = 0; i < this.slides.length; i++) {
				if (i < this.slidesView) {
					this.slider.append(this.slides[i].cloneNode(true));
				} 
				if (i >= this.slides.length - this.slidesView) {
					this.slider.prepend(this.slides[i].cloneNode(true));
				}
			}
		} else {
			this.slider.append(this.slides[0].cloneNode(true));
			this.slider.prepend(this.slides[this.slides.length - 1].cloneNode(true));
		}
	}//+
	init() {
		this.paginationAdd();
		this.slidesViewAdd();
		if (this.loop) {
			this.positionStart = this.viewWidth;
			this.addCloneSlide();
			this.slider.style.transform = `translateX(-${this.positionStart}px)`;
		} else {
			this.positionStart = 0;
		}
		this.handlerChange();
	}//+
};

const slider = new Slider({selector: {
		sliderSelector: '.slider__wrapper',
		prevSelector: '.slider__arrow_prev', 
		nextSelector: '.slider__arrow_next',
		bulletsWrapperSelector: '.slider__pagination'
	},
	settings: {
		animation: true,
		loop: true,
		slidesView: 3,
		viewWidth: 900
	}
});
slider.init();
