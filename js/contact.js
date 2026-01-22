// ========================================
// Contact Form Handler
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                company: document.getElementById('company').value,
                service: document.getElementById('service').value,
                message: document.getElementById('message').value
            };

            // Disable submit button
            const submitButton = contactForm.querySelector('.btn-submit');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            try {
                // Send form data to server
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    // Success
                    showMessage('Thank you for contacting us! We\'ll get back to you soon.', 'success');
                    contactForm.reset();
                } else {
                    // Server error
                    showMessage(result.message || 'Something went wrong. Please try again.', 'error');
                }
            } catch (error) {
                // Network error
                console.error('Error:', error);
                showMessage('Unable to send message. Please check your connection and try again.', 'error');
            } finally {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = 'form-message ' + type;

        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Auto-hide success message after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                formMessage.className = 'form-message';
            }, 5000);
        }
    }

    // Form validation enhancement
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (email && !emailRegex.test(email)) {
                this.setCustomValidity('Please enter a valid email address');
                this.reportValidity();
            } else {
                this.setCustomValidity('');
            }
        });
    }

    // Phone number formatting (optional)
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = value;
                } else if (value.length <= 6) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                } else {
                    value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                }
            }
            e.target.value = value;
        });
    }
});
