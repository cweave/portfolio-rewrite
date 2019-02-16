let myField = document.querySelector('input[type="text"]');
let validityState = myField.validity;

// Add the novalidate attribute when the JS loads
let contactForm = document.getElementById('contact-form');
contactForm.setAttribute('novalidate', true);

let hasError = function (field) {
	// Don't validate submits, buttons, reset inputs, and disabled fields
	if (field.disabled || field.type === 'reset' || field.type === 'submit' || field.type === 'button') return;

	let validity = field.validity;

	// if valid, return null
	if (validity.valid) return;

	// if empty
	if (validity.valueMissing) return 'Please fill out this field.';

	// if not right type
	if (validity.typeMismatch) {
		if (field.type === 'email') return 'Please enter an email address.';
	}

	// If pattern doesn't match
	if (validity.patternMismatch) {
		// If pattern info is included, return custom error
		if (field.hasAttribute('title')) {
			return `Please match the requested format: ${field.getAttribute('title')}.`;
		}

		// Otherwise, generic error
		return 'Please match the requested format.';
	}

	// catchall error
	return 'The value you entered for this field is invalid.';

};

let showError = function (field, error) {
	field.classList.remove('valid');
	field.classList.add('error');

	// get field id or name
	let id = field.id || field.name;
	if (!id) return;

	// check if error field exists, if not, create one
	let errorMessage = field.form.querySelector('.error-message#error-for-' + id);
	if (!errorMessage) {
		errorMessage = document.createElement('div');
		errorMessage.className = 'error-message';
		errorMessage.id = `error-for-${id}`;
		field.parentNode.insertBefore(errorMessage, field.nextSibling);
	}

	// add ARIA role for accessibility
	field.setAttribute('aria-describedby', `error-for-${id}`);
	// update error message
	errorMessage.innerHTML = error;

	// show error message
	errorMessage.style.display = 'block';
	errorMessage.style.visibility = 'visible';

};

let removeError = function (field) {

	field.classList.remove('error');
	field.removeAttribute('aria-describedby');

	// don't validate the button
	if (field.disabled || field.type === 'reset' || field.type === 'submit' || field.type === 'button') return;
	field.classList.add('valid');

	// get field id or name
	const id = field.id || field.name;
	if (!id) return;

	// check if error message is in the dom
	let errorMessage = field.form.querySelector('.error-message#error-for-' + id + '');
	if (!errorMessage) return;

	// if so, hide it
	errorMessage.innerHTML = '';
	errorMessage.display = 'none';
	errorMessage.visibility = 'hidden';
};

// check validity when user leaves field
document.addEventListener('blur', function (event) {

	const error = hasError(event.target);

	if (error) {
		showError(event.target, error);
		return;
	}

	// Otherwise, remove any existing error message
	removeError(event.target);

}, true);

// check validity on submit
document.addEventListener('submit', function (event) {

	//get all form elements
	let fields = event.target.elements;

	// validate each field
	// store the first field with an error to a variable so we can bring into focus
	let error, hasErrors;
	for (let i = 0; i < fields.length; i++) {
		error = hasError(fields[i]);
		if (error) {
			showError(fields[i], error);
			if (!hasErrors) {
				hasErrors = fields[i];
			}
		}
	}

	// if there are errors, don't submit the form and focus on the first element with an console.error
	if (hasErrors) {
		event.preventDefault();
		hasErrors.focus();
	} else {
		event.preventDefault(); // we are submitting via xhr below
		var form = event.target;
		var data = getFormData(form);  // get the values submitted in the form

		if (validateHuman(data.honeypot)) {  //if form is filled, form will not be submitted
			return false;
		}

		// change the button to a spinner on submit and disable button
		const submitButton = document.getElementById('submit');
		submitButton.innerHTML = "";
		submitButton.disabled = true;
		const loader = document.createElement('span');
		loader.className = 'fas fa-spinner fa-spin';
		submitButton.appendChild(loader);


		//disableAllButtons(form);

		const url = form.action;
		const xhr = new XMLHttpRequest();
		xhr.open('POST', url);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.onreadystatechange = function () {
			const formElements = form.querySelector(".form-elements")
			if (formElements) {
				formElements.style.display = "none"; // hide form
			}
			const thankYouTitle = document.getElementById('contact-form-title');

			if (thankYouTitle) {
				thankYouTitle.innerHTML = "Thanks for contacting me!";
				const thankYouMessage = document.getElementById('contact-form-description');
				thankYouMessage.innerHTML = "";
				const p = document.createElement('p');

				p.innerHTML = "I will be in contact with you as soon as possible!";
				thankYouMessage.appendChild(p);
			}
			return;
		};
		// url encode form data for sending as post data
		var encoded = Object.keys(data).map(function (k) {
			return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
		}).join('&');
		xhr.send(encoded);
	}

}, false);

// auto format phone number
document.getElementById('phone').addEventListener('input', function (phoneNumber) {
	const digit = phoneNumber.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
	phoneNumber.target.value = !digit[2] ? digit[1] : '(' + digit[1] + ') ' + digit[2] + (digit[3] ? '-' + digit[3] : '');
});

function validateHuman(honeypot) {
	if (honeypot) {  //if hidden form filled up
		return true;
	} else {
		return false;
	}
}

// get all data in form and return object
function getFormData(form) {
	const elements = form.elements;

	const fields = Object.keys(elements).filter(function(k) {
		return (elements[k].name !== "honeypot");
	}).map(function(k) {
		if(elements[k].name !== undefined) {
			return elements[k].name;
			// special case for Edge's html collection
		} else if(elements[k].length > 0){
			return elements[k].item(0).name;
		}
	}).filter(function(item, pos, self) {
		return self.indexOf(item) == pos && item;
	});

	const formData = {};
	fields.forEach(function(name) {
		const element = elements[name];

		// singular form elements just have one value
		formData[name] = element.value;

		// when our element has multiple items, get their values
		if (element.length) {
			const data = [];
			for (let i = 0; i < element.length; i++) {
				var item = element.item(i);
				if (item.checked || item.selected) {
					data.push(item.value);
				}
			}
			formData[name] = data.join(', ');
		}
	});

	// add form-specific values into the data
	formData.formDataNameOrder = JSON.stringify(fields);
	formData.formGoogleSheetName = form.dataset.sheet || "responses"; // default sheet name
	formData.formGoogleSendEmail = form.dataset.email || ""; // no email by default
	return formData;
}