async function loadSliders() {
	const bnbSlideValue = document.getElementById("bnbSliderSpan");
	const hellfireSlideValue = document.getElementById("hellfireSliderSpan");
	const bnbInputSlider = document.getElementById("bnbSliderInput");
	const hellfireInputSlider = document.getElementById("hellfireSliderInput");
	bnbInputSlider.oninput = (()=>{
		let value = bnbInputSlider.value;
		bnbSlideValue.textContent = value + "%";
		bnbSlideValue.classList.add("show");
		hellfireSlideValue.textContent = '' + (100 - value) + "%";
		hellfireInputSlider.value = 100 - value;
	});
	hellfireInputSlider.oninput = (()=>{
		let value = hellfireInputSlider.value;
		hellfireSlideValue.textContent = value + "%";
		hellfireSlideValue.classList.add("show");
		bnbSlideValue.textContent = '' + (100 - value) + "%";
		bnbInputSlider.value = 100 - value;
	});
}
