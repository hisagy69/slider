'use strict';
class Slider {
	constructor ({selector, settings}) {
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
		if (this.currentSlide < this.slides.length) {
			this.currentSlide += 1;
		} else {
			if (this.loop) {
				this.slider.style.transform = 'translateX(0)';
				this.prevSlide = 0;
			}
			this.currentSlide = 1;
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
		this.slider.addEventListener('mousedown', (e) => {
			console.dir(e);
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
