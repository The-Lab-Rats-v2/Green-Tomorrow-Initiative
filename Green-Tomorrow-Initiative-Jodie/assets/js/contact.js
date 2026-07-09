// Wait until the page loads
document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("contactForm");

    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const message = document.getElementById("message");

    const nameError = document.getElementById("nameError");
    const emailError = document.getElementById("emailError");
    const messageError = document.getElementById("messageError");

    const successMessage = document.getElementById("successMessage");

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        let isValid = true;

        // Hide success message
        successMessage.style.display = "none";

        // Clear previous errors
        nameError.textContent = "";
        emailError.textContent = "";
        messageError.textContent = "";

        nameError.style.display = "none";
        emailError.style.display = "none";
        messageError.style.display = "none";

        // -----------------------------
        // Name Validation
        // -----------------------------
        const namePattern = /^[A-Za-z\s]+$/;

        if (username.value.trim() === "") {

            nameError.textContent = "Please enter your full name.";
            nameError.style.display = "block";
            isValid = false;

        } else if (username.value.trim().length < 2) {

            nameError.textContent = "Name must be at least 2 characters long.";
            nameError.style.display = "block";
            isValid = false;

        } else if (!namePattern.test(username.value.trim())) {

            nameError.textContent = "Name can only contain letters and spaces.";
            nameError.style.display = "block";
            isValid = false;

        }

        // -----------------------------
        // Email Validation
        // -----------------------------
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email.value.trim() === "") {

            emailError.textContent = "Please enter your email address.";
            emailError.style.display = "block";
            isValid = false;

        } else if (!emailPattern.test(email.value.trim())) {

            emailError.textContent = "Please enter a valid email address (e.g. name@example.com).";
            emailError.style.display = "block";
            isValid = false;

        }

        // -----------------------------
        // Message Validation
        // -----------------------------
        if (message.value.trim() === "") {

            messageError.textContent = "Please enter your message.";
            messageError.style.display = "block";
            isValid = false;

        } else if (message.value.trim().length < 10) {

            messageError.textContent = "Message must be at least 10 characters long.";
            messageError.style.display = "block";
            isValid = false;

        }

        // -----------------------------
        // Form Success
        // -----------------------------
        if (isValid) {

            successMessage.textContent = "✓ Your message has been sent successfully! We'll get back to you soon.";
            successMessage.style.display = "block";

            form.reset();

            setTimeout(function () {

                successMessage.style.display = "none";

            }, 4000);

        }

    });

});